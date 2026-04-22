"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquareDashed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Orb, type OrbState } from "@/components/orb-example"
import { BubbleField } from "@/components/chat/bubble-field"
import { Composer } from "@/components/chat/composer"
import { MessageList } from "@/components/chat/message-list"
import { HERO_GREETING, INTAKE_QUESTIONS } from "@/lib/constants/intake"
import { useProjectIntake } from "@/hooks/useProjectIntake"

import { IntakeProcessing } from "./intake-processing"
import { IntakeError } from "./intake-error"

const HERO_TITLE_OFFSET_PX = 110
const HERO_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const ORB_TRANSITION = `top 900ms ${HERO_EASE}, transform 900ms ${HERO_EASE}, opacity 700ms ease-out`
const FADE_TRANSITION = "opacity 500ms ease-out, filter 500ms ease-out"
const INTAKE_QUESTIONS_LENGTH = INTAKE_QUESTIONS.length

export function ProjectIntake() {
  const { phase, messages, thinking, sendAnswer, retry, reset } =
    useProjectIntake()

  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)

  // Defer the initial transform/opacity by a frame so the orb can ease in
  // from a slightly smaller, transparent state on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const hasStarted = messages.length > 0
  const isProcessing =
    phase.kind === "processing" ||
    phase.kind === "submitting" ||
    phase.kind === "redirecting"
  const isError = phase.kind === "error"
  // After the final answer the hook stays in `collecting` for a brief beat
  // before submit() fires; lock the composer so the user can't squeeze in
  // another message during that window.
  const isAwaitingSubmit =
    phase.kind === "collecting" && phase.step >= INTAKE_QUESTIONS_LENGTH
  // Orb sits at the top while the user is mid-conversation; in every other
  // phase (idle hero, processing, error) it animates back to the centre.
  const orbCentered = !hasStarted || isProcessing || isError

  const composerDisabled =
    thinking || isProcessing || isError || isAwaitingSubmit

  const orbState: OrbState = useMemo(() => {
    if (isProcessing || thinking || isAwaitingSubmit) return "thinking"
    if (inputFocused && inputValue.trim().length > 0) return "listening"
    return "idle"
  }, [isProcessing, thinking, isAwaitingSubmit, inputFocused, inputValue])

  const orbScale = mounted ? (orbCentered ? 1 : 0.45) : 0.6
  const stageIndex = phase.kind === "processing" ? phase.stageIndex : 0

  return (
    <div>
      <BubbleField />

      {hasStarted && !isProcessing && !isError && (
        <Button
          onClick={reset}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-white/70 text-stone-600 backdrop-blur-sm hover:bg-white"
          aria-label="Reset chat"
        >
          <MessageSquareDashed className="h-5 w-5" />
        </Button>
      )}

      {/* Single orb element shared across all phases. Position and scale
          animate via the same transition so transitions like
          collecting → processing glide the orb back to the centre instead
          of swapping it out. */}
      <div
        className="pointer-events-none absolute left-1/2 z-10"
        style={{
          top: orbCentered ? "50%" : "1.5rem",
          transform: `translate(-50%, ${orbCentered ? "-60%" : "0%"}) scale(${orbScale})`,
          opacity: mounted ? 1 : 0,
          transformOrigin: "center top",
          transition: ORB_TRANSITION,
        }}
      >
        <Orb state={orbState} size={160} />
      </div>

      {/* Hero greeting — visible only on the initial idle hero state. */}
      <h1
        className={cn(
          "pointer-events-none absolute right-0 left-0 z-10 px-6 text-center text-2xl font-medium text-stone-700 md:text-3xl",
          "transition-[opacity,filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        )}
        style={{
          top: `calc(50% + ${HERO_TITLE_OFFSET_PX}px)`,
          opacity: !mounted || hasStarted ? 0 : 1,
          filter: !mounted || hasStarted ? "blur(12px)" : "blur(0px)",
          transform: `translateY(${hasStarted ? "-24px" : "0px"})`,
        }}
      >
        {HERO_GREETING}
      </h1>

      {/* Stage / error content sits in the same slot as the hero greeting,
          appearing after the orb has finished re-centering. */}
      {(isProcessing || isError) && (
        <div
          className="pointer-events-auto absolute right-0 left-0 z-10 flex justify-center px-6"
          style={{ top: `calc(50% + ${HERO_TITLE_OFFSET_PX}px)` }}
        >
          {isProcessing ? (
            <IntakeProcessing stageIndex={stageIndex} />
          ) : (
            phase.kind === "error" && (
              <IntakeError
                message={phase.message}
                onRetry={retry}
                onReset={reset}
              />
            )
          )}
        </div>
      )}

      {/* Chat list fades out when leaving the collecting phase so the orb
          glides back to centre against an empty backdrop. */}
      {hasStarted && (
        <div
          className="absolute inset-0"
          style={{
            opacity: isProcessing || isError ? 0 : 1,
            filter: isProcessing || isError ? "blur(8px)" : "blur(0px)",
            transition: FADE_TRANSITION,
            pointerEvents: isProcessing || isError ? "none" : "auto",
          }}
          aria-hidden={isProcessing || isError}
        >
          <MessageList messages={messages} isThinking={thinking} />
        </div>
      )}

      {/* Composer also fades out — but stays mounted so the disabled state
          transitions cleanly. */}
      <div
        style={{
          opacity: isProcessing || isError ? 0 : 1,
          transition: FADE_TRANSITION,
          pointerEvents: isProcessing || isError ? "none" : "auto",
        }}
        aria-hidden={isProcessing || isError}
      >
        <Composer
          onSend={sendAnswer}
          onValueChange={setInputValue}
          onFocusChange={setInputFocused}
          disabled={composerDisabled}
          placeholder={
            hasStarted ? "Type your answer..." : "Describe your project..."
          }
        />
      </div>
    </div>
  )
}
