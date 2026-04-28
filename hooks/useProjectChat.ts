"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  getPublicBackendUrl,
  getPublicBackendWsUrl,
} from "@/lib/public-backend"
import type { ChatMessage } from "@/types/message"

const PAGE_SIZE = 50
const MIN_RECONNECT_DELAY_MS = 2_000
const MAX_RECONNECT_DELAY_MS = 16_000

export type ConnectionStatus = "connecting" | "open" | "closed"

interface UseProjectChatOptions {
  meId: string | null
  meEmail: string | null
  meUsername: string | null
}

export interface UseProjectChatResult {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadingOlder: boolean
  status: ConnectionStatus
  loadOlder: () => Promise<void>
  send: (content: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

export function useProjectChat(
  projectId: string,
  { meId, meEmail, meUsername }: UseProjectChatOptions,
): UseProjectChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>("connecting")

  const wsRef = useRef<WebSocket | null>(null)
  // Track the oldest id we've loaded so loadOlder() can paginate even while
  // new live messages keep arriving at the tail.
  const oldestIdRef = useRef<string | null>(null)

  const addLiveMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      // Strip any optimistic placeholder by this user with matching content.
      const withoutOptimistic = prev.filter(
        (m) =>
          !(
            m.id.startsWith("temp-") &&
            m.user_id === msg.user_id &&
            m.content === msg.content
          ),
      )
      return [...withoutOptimistic, msg]
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectAttempts = 0

    const backendUrl = getPublicBackendUrl()
    const wsBaseUrl = getPublicBackendWsUrl()

    const loadInitial = async () => {
      try {
        const res = await fetch(
          `${backendUrl}/projects/${encodeURIComponent(projectId)}/messages?limit=${PAGE_SIZE}`,
          { credentials: "include" },
        )
        if (!res.ok) throw new Error(await parseError(res))
        const page = (await res.json()) as ChatMessage[]
        if (cancelled) return
        // Backend returns newest→oldest; we store chronologically.
        const chronological = [...page].reverse()
        setMessages(chronological)
        setHasMore(page.length === PAGE_SIZE)
        oldestIdRef.current = chronological[0]?.id ?? null
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }

    const connect = () => {
      if (cancelled) return
      setStatus("connecting")

      let ws: WebSocket
      try {
        ws = new WebSocket(
          `${wsBaseUrl}/projects/${encodeURIComponent(projectId)}/ws`,
        )
      } catch (e) {
        console.error("ws construct failed", e)
        scheduleReconnect()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled) return
        reconnectAttempts = 0
        setStatus("open")
      }

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as ChatMessage
          addLiveMessage(msg)
        } catch (e) {
          console.error("ws message parse failed", e)
        }
      }

      ws.onerror = () => {
        // onclose will follow and schedule reconnect; nothing else to do.
      }

      ws.onclose = () => {
        if (cancelled) return
        setStatus("closed")
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (cancelled) return
      const delay = Math.min(
        MAX_RECONNECT_DELAY_MS,
        MIN_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
      )
      reconnectAttempts += 1
      // Small jitter prevents thundering-herd on a mass restart.
      const jitter = Math.random() * 500
      reconnectTimer = setTimeout(connect, delay + jitter)
    }

    loadInitial()
    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      const ws = wsRef.current
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        ws.onopen = null
        try {
          ws.close()
        } catch {
          /* noop */
        }
      }
      wsRef.current = null
    }
  }, [projectId, addLiveMessage])

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return
    const before = oldestIdRef.current
    if (!before) return
    setLoadingOlder(true)
    try {
      const res = await fetch(
        `${getPublicBackendUrl()}/projects/${encodeURIComponent(projectId)}/messages?before=${encodeURIComponent(before)}&limit=${PAGE_SIZE}`,
        { credentials: "include" },
      )
      if (!res.ok) throw new Error(await parseError(res))
      const page = (await res.json()) as ChatMessage[]
      const chronological = [...page].reverse()
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        const merged = [...chronological.filter((m) => !seen.has(m.id)), ...prev]
        return merged
      })
      if (chronological.length > 0) {
        oldestIdRef.current = chronological[0].id
      }
      setHasMore(page.length === PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingOlder(false)
    }
  }, [projectId, hasMore, loadingOlder])

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      // Optimistic placeholder so the sender sees their message immediately.
      // The WS broadcast or REST response (whichever lands first) will replace
      // it via addLiveMessage's temp-stripping logic or the explicit replace
      // below.
      if (meId) {
        const optimistic: ChatMessage = {
          id: tempId,
          project_id: projectId,
          user_id: meId,
          content: trimmed,
          created_at: new Date().toISOString(),
          user_email: meEmail ?? "",
          user_username: meUsername ?? undefined,
        }
        setMessages((prev) => [...prev, optimistic])
      }

      try {
        const res = await fetch(
          `${getPublicBackendUrl()}/projects/${encodeURIComponent(projectId)}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content: trimmed }),
          },
        )
        if (!res.ok) throw new Error(await parseError(res))
        const real = (await res.json()) as ChatMessage
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId)
          if (withoutTemp.some((m) => m.id === real.id)) return withoutTemp
          return [...withoutTemp, real]
        })
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        throw e
      }
    },
    [projectId, meId, meEmail, meUsername],
  )

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(
        `${getPublicBackendUrl()}/messages/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      )
      if (res.status !== 204) throw new Error(await parseError(res))
      setMessages((prev) => prev.filter((m) => m.id !== id))
    },
    [],
  )

  return {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    status,
    loadOlder,
    send,
    remove,
  }
}
