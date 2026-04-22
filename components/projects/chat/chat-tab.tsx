"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectChat } from "@/hooks/useProjectChat"
import { cn } from "@/lib/utils"
import type { Role } from "@/types/project"

import { ChatComposer } from "./chat-composer"
import { ChatMessage } from "./chat-message"

interface ChatTabProps {
  projectId: string
  meId: string | null
  meEmail: string | null
  role: Role | null
}

export function ChatTab({ projectId, meId, meEmail, role }: ChatTabProps) {
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
  } = useProjectChat(projectId, { meId, meEmail })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  // Auto-scroll to bottom on new tail messages, but not when we prepend older
  // history (loadOlder). We key off the *last* message id.
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.id === lastMessageIdRef.current) return
    lastMessageIdRef.current = last.id
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const isMember = role !== null

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

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadOlder()}
            disabled={loadingOlder}
          >
            {loadingOlder ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Load older"
            )}
          </Button>
        )}
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
            {messages.map((m) => (
              <li key={m.id}>
                <ChatMessage
                  message={m}
                  isMine={m.user_id === meId}
                  canDelete={m.user_id === meId}
                  onDelete={remove}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isMember ? (
        <ChatComposer onSend={send} disabled={loading} />
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-3 text-center text-sm text-stone-500">
          Only project members can send messages.
        </p>
      )}
    </div>
  )
}
