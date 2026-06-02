"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectChat } from "@/hooks/useProjectChat"
import { hasAgentMention, isAgentMessage } from "@/lib/agent"
import { cn } from "@/lib/utils"
import type { Role } from "@/types/project"

import { ChatComposer } from "./chat-composer"
import { ChatMessage } from "./chat-message"
import { SamaritanThinking } from "./samaritan-thinking"

interface ChatTabProps {
  projectId: string
  meId: string | null
  meEmail: string | null
  meUsername: string | null
  role: Role | null
}

const AGENT_RESPONSE_TIMEOUT_MS = 60_000

export function ChatTab({ projectId, meId, meEmail, meUsername, role }: ChatTabProps) {
  const router = useRouter()
  const {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    status,
    loadOlder,
    send,
    remove,
  } = useProjectChat(projectId, { meId, meEmail, meUsername })

  const [awaitingAgent, setAwaitingAgent] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const mountedAtRef = useRef<number | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const awaitingSinceRef = useRef<number | null>(null)
  const lastAgentMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [])

  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "overview"

  // Auto-scroll to bottom on new tail messages, but not when we prepend older
  // history (loadOlder). We key off the *last* message id.
  useEffect(() => {
    if (loading || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.id === lastMessageIdRef.current) return
    lastMessageIdRef.current = last.id

    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })

    if (!isAgentMessage(last) || last.id === lastAgentMessageIdRef.current) {
      return
    }

    lastAgentMessageIdRef.current = last.id
    const createdAt = new Date(last.created_at).getTime()
    const mountedAt = mountedAtRef.current
    const isFreshAgentMessage =
      mountedAt !== null && !Number.isNaN(createdAt) && createdAt >= mountedAt

    if (isFreshAgentMessage) {
      router.refresh()
    }

    const pendingSince = awaitingSinceRef.current
    if (!pendingSince) return
    if (!Number.isNaN(createdAt) && createdAt >= pendingSince) {
      awaitingSinceRef.current = null
      setTimeout(() => setAwaitingAgent(false), 0)
    }
  }, [messages, router, loading])

  // Force scroll to bottom when returning to the chat tab
  useEffect(() => {
    if (activeTab === "chat" && !loading && messages.length > 0) {
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }, [activeTab, loading, messages.length])

  useEffect(() => {
    if (!awaitingAgent) return
    const timer = setTimeout(() => {
      setAwaitingAgent(false)
      awaitingSinceRef.current = null
    }, AGENT_RESPONSE_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [awaitingAgent])

  useEffect(() => {
    return () => {
      awaitingSinceRef.current = null
    }
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      const expectsAgent = hasAgentMention(content)
      if (expectsAgent) {
        awaitingSinceRef.current = Date.now()
        setAwaitingAgent(true)
      }
      try {
        await send(content)
      } catch (e) {
        if (expectsAgent) {
          awaitingSinceRef.current = null
          setAwaitingAgent(false)
        }
        throw e
      }
    },
    [send],
  )

  const isMember = role !== null

  function dateKey(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  function formatDateLabel(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""

    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (dateKey(iso) === dateKey(today.toISOString())) return "Bugün"
    if (dateKey(iso) === dateKey(yesterday.toISOString())) return "Dün"

    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[400px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              status === "open" && "bg-emerald-500",
              status === "connecting" && "animate-pulse bg-amber-500",
              status === "closed" && "bg-stone-400"
            )}
            aria-hidden
          />
          <span className="text-stone-500">
            {status === "open"
              ? "Live"
              : status === "connecting"
                ? "Connecting…"
                : "Reconnecting…"}
          </span>
        </div>


      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-stone-200 bg-white/50 p-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading messages…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            No messages yet. Start the conversation.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m, index) => {
              const previousMessage = messages[index - 1]

              const showDateSeparator =
                !previousMessage ||
                dateKey(previousMessage.created_at) !== dateKey(m.created_at)

              return (
                <li key={m.id} className="flex flex-col gap-4">
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-stone-200" />
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
                        {formatDateLabel(m.created_at)}
                      </span>
                      <div className="h-px flex-1 bg-stone-200" />
                    </div>
                  )}

                  <ChatMessage
                    message={m}
                    isMine={m.user_id === meId}
                    canDelete={m.user_id === meId}
                    onDelete={remove}
                  />
                </li>
              )
            })}

            {awaitingAgent && (
              <li>
                <SamaritanThinking />
              </li>
            )}
          </ul>
        )}
      </div>

      {isMember ? (
        <ChatComposer onSend={handleSend} disabled={loading} />
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-3 text-center text-sm text-stone-500">
          Only project members can send messages.
        </p>
      )}
    </div>
  )
}
