"use client"

import { AGENT_DISPLAY_NAME } from "@/lib/agent"
import { AnimatedOrb } from "@/components/chat/animated-orb"

export function SamaritanThinking() {
  return (
    <div className="flex gap-3" aria-live="polite">
      <div className="shrink-0">
        <AnimatedOrb size={32} />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-stone-700">
        <div className="mb-1">{AGENT_DISPLAY_NAME} is thinking...</div>
        <div
          className="flex items-center gap-1"
          aria-label={`${AGENT_DISPLAY_NAME} is typing`}
          role="status"
        >
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}
