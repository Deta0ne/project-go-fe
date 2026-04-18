"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MessageSquareDashed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Orb, type OrbState } from "@/components/orb-example"
import { BubbleField } from "./bubble-field"
import { Composer } from "./composer"
import { MessageList } from "./message-list"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

// Static conversation script. The first entry is shown on the hero screen,
// subsequent entries are sent as assistant replies after each user answer.
const ASSISTANT_SCRIPT = [
  "What shalt thou build?",
  "Who is on your team, and what will each person be working on?",
  "How long do you estimate this project will take?",
  "Excellent. I have everything I need to begin. Let the build commence.",
] as const

const THINKING_DELAY_MS = 1200
const HERO_TITLE_OFFSET_PX = 110
const HERO_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const ORB_TRANSITION = `top 900ms ${HERO_EASE}, transform 900ms ${HERO_EASE}, opacity 700ms ease-out`

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFinished = step >= ASSISTANT_SCRIPT.length - 1
  const hasStarted = messages.length > 0

  // Defer the initial transform/opacity by a frame so the orb can ease in
  // from a slightly smaller, transparent state on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Clear any pending assistant reply when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const orbState: OrbState = useMemo(() => {
    if (isThinking) return "thinking"
    if (inputFocused && inputValue.trim().length > 0) return "listening"
    return "idle"
  }, [isThinking, inputFocused, inputValue])

  const sendMessage = useCallback(
    (content: string) => {
      if (isThinking || isFinished) return

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsThinking(true)

      const nextStep = step + 1
      const reply = ASSISTANT_SCRIPT[nextStep]

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: reply,
              createdAt: new Date(),
            },
          ])
        }
        setStep(nextStep)
        setIsThinking(false)
      }, THINKING_DELAY_MS)
    },
    [isThinking, isFinished, step]
  )

  const resetChat = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessages([])
    setStep(0)
    setIsThinking(false)
    setInputValue("")
  }, [])

  const orbScale = mounted ? (hasStarted ? 0.45 : 1) : 0.6

  return (
    <div>
      <BubbleField />

      {hasStarted && (
        <Button
          onClick={resetChat}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-white/70 text-stone-600 backdrop-blur-sm hover:bg-white"
          aria-label="Reset chat"
        >
          <MessageSquareDashed className="h-5 w-5" />
        </Button>
      )}

      {/* The orb shares one element across both states; it animates from
          the centred hero position to a smaller header position. */}
      <div
        className="pointer-events-none absolute left-1/2 z-10"
        style={{
          top: hasStarted ? "1.5rem" : "50%",
          transform: `translate(-50%, ${hasStarted ? "0%" : "-60%"}) scale(${orbScale})`,
          opacity: mounted ? 1 : 0,
          transformOrigin: "center top",
          transition: ORB_TRANSITION,
        }}
      >
        <Orb state={orbState} size={160} />
      </div>

      <h1
        className={cn(
          "pointer-events-none absolute right-0 left-0 z-10 px-6 text-center text-2xl font-medium text-stone-700 md:text-3xl",
          "transition-[opacity,filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
        style={{
          top: `calc(50% + ${HERO_TITLE_OFFSET_PX}px)`,
          opacity: !mounted || hasStarted ? 0 : 1,
          filter: !mounted || hasStarted ? "blur(12px)" : "blur(0px)",
          transform: `translateY(${hasStarted ? "-24px" : "0px"})`,
        }}
      >
        {ASSISTANT_SCRIPT[0]}
      </h1>

      {hasStarted && (
        <MessageList messages={messages} isThinking={isThinking} />
      )}

      <Composer
        onSend={sendMessage}
        onValueChange={setInputValue}
        onFocusChange={setInputFocused}
        disabled={isThinking || isFinished}
        placeholder={
          isFinished
            ? "Conversation complete"
            : hasStarted
              ? "Type your answer..."
              : "Describe your project..."
        }
      />
    </div>
  )
}
