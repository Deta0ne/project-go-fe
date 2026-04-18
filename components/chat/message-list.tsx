"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
import type { Message } from "./chat-shell"
import { TypingIndicator } from "./typing-indicator"

interface MessageListProps {
  messages: Message[]
  isThinking: boolean
}

export function MessageList({ messages, isThinking }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages.length, isThinking])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-y-auto pt-40 pb-32 space-y-4 border-none px-6"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isThinking && <TypingIndicator />}

      <div ref={bottomRef} aria-hidden="true" className="h-20" />
    </div>
  )
}
