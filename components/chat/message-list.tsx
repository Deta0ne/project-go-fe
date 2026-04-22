"use client"

import { useEffect, useRef } from "react"

import type { Message } from "@/types/chat"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"

interface MessageListProps {
  messages: Message[]
  isThinking: boolean
}

export function MessageList({ messages, isThinking }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages.length, isThinking])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 space-y-4 overflow-y-auto border-none px-6 pt-40 pb-32"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isThinking && <TypingIndicator />}

      {/* Bottom spacer keeps the last message clear of the composer. */}
      <div aria-hidden="true" className="h-20" />
    </div>
  )
}
