"use client"

import { cn } from "@/lib/utils"
import type { Message } from "./chat-shell"
import { User } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import { AnimatedOrb } from "./animated-orb"

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

// Format time for display
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex max-w-[90%] gap-2 md:max-w-[80%]",
        isUser
          ? "user-message-enter ml-auto flex-row-reverse"
          : "mr-auto animate-in items-end duration-300 fade-in slide-in-from-bottom-2"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-white" : "bg-emerald-600",
          !isUser &&
            isStreaming &&
            "sticky bottom-4 self-end transition-all duration-300"
        )}
        style={{
          boxShadow:
            "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
        }}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4 text-stone-800" />
        ) : (
          <AnimatedOrb className="h-8 w-8 shrink-0" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
      >
        {/* Role label (optional, shown on larger screens) */}
        <span className="mt-2 mb-1 hidden text-xs text-stone-400 sm:block">
          {isUser ? "You" : "Assistant"}
        </span>

        {/* Bubble */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border-none",
            isUser
              ? "rounded-br-md border border-stone-200 bg-white text-stone-800"
              : "rounded-bl-md bg-transparent text-stone-800"
          )}
          style={{
            boxShadow: isUser
              ? "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px"
              : "none",
            willChange: isStreaming ? "height" : "auto",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className={cn(isUser ? "px-4 py-3" : "py-1")}
            style={{
              transition:
                "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
            }}
          >
            {isUser ? (
              <p className="text-sm wrap-break-word whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <MarkdownRenderer
                content={message.content || " "}
                isStreaming={isStreaming}
              />
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="mt-1 text-xs text-stone-400">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
