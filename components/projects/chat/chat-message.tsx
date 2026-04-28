"use client"

import { useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AnimatedOrb } from "@/components/chat/animated-orb"
import { MarkdownRenderer } from "@/components/chat/markdown-renderer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AGENT_DISPLAY_NAME, isAgentMessage } from "@/lib/agent"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageT } from "@/types/message"

import { MentionHighlight } from "./mention-highlight"

interface ChatMessageProps {
  message: ChatMessageT
  isMine: boolean
  canDelete: boolean
  onDelete: (id: string) => Promise<void>
}

function avatarInitial(nameOrEmail: string): string {
  const trimmed = nameOrEmail?.trim() ?? ""
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "?"
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function ChatMessage({
  message,
  isMine,
  canDelete,
  onDelete,
}: ChatMessageProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isOptimistic = message.id.startsWith("temp-")
  const isAgent = isAgentMessage(message)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        await onDelete(message.id)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })
  }

  return (
    <div
      className={cn(
        "group flex gap-3",
        isMine ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isAgent
            ? "bg-transparent"
            : isMine
              ? "bg-stone-800 text-stone-50"
              : "bg-stone-200 text-stone-700",
        )}
        aria-hidden
      >
        {isAgent ? (
          <AnimatedOrb size={32} />
        ) : (
          avatarInitial(message.user_username || message.user_email)
        )}
      </div>

      <div
        className={cn(
          "flex max-w-[75%] min-w-0 flex-col gap-1",
          isMine ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "flex items-baseline gap-2 text-xs",
            isMine ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="font-medium text-stone-700">
            {isAgent ? AGENT_DISPLAY_NAME : message.user_username || message.user_email || "Unknown"}
          </span>
          <span className="text-stone-400">
            {formatTime(message.created_at)}
          </span>
        </div>

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap",
            isAgent
              ? "rounded-tl-sm border border-emerald-200 bg-emerald-50/70 text-stone-800"
              : isMine
              ? "rounded-tr-sm bg-stone-800 text-stone-50"
              : "rounded-tl-sm bg-stone-100 text-stone-800",
            isOptimistic && "opacity-60"
          )}
        >
          {isAgent ? (
            <MarkdownRenderer content={message.content || " "} />
          ) : (
            <MentionHighlight
              content={message.content}
              mentionClassName={
                isMine
                  ? "font-medium text-emerald-200"
                  : "font-medium text-emerald-700"
              }
            />
          )}
        </div>

        {canDelete && !isOptimistic && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-stone-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  disabled={pending}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
