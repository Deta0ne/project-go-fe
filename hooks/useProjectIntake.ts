"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { createProject } from "@/lib/actions/project"
import {
  INTAKE_QUESTIONS,
  PROCESSING_STAGES,
  STAGE_DELAY_MS,
  THINKING_DELAY_MS,
} from "@/lib/constants/intake"
import { encodeIntakePayload } from "@/lib/intake-payload"
import type { Message } from "@/types/chat"
import type { IntakeAnswers, IntakePhase } from "@/types/intake"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function makeMessage(role: Message["role"], content: string): Message {
  return { id: generateId(), role, content, createdAt: new Date() }
}

export interface UseProjectIntake {
  phase: IntakePhase
  messages: Message[]
  thinking: boolean
  sendAnswer: (content: string) => void
  retry: () => void
  reset: () => void
}

export function useProjectIntake(): UseProjectIntake {
  const router = useRouter()
  const [phase, setPhase] = useState<IntakePhase>({ kind: "idle" })
  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const answersRef = useRef<Partial<IntakeAnswers>>({})
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const cancelledRef = useRef(false)

  const registerTimer = useCallback(
    (id: ReturnType<typeof setTimeout>): void => {
      timersRef.current.add(id)
    },
    [],
  )

  const clearTimers = useCallback((): void => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current.clear()
  }, [])

  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          timersRef.current.delete(id)
          resolve()
        }, ms)
        registerTimer(id)
      }),
    [registerTimer],
  )

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      clearTimers()
    }
  }, [clearTimers])

  const submit = useCallback(async (): Promise<void> => {
    const answers = answersRef.current
    if (
      !answers.name ||
      !answers.description ||
      !answers.team ||
      !answers.estimatedDuration
    ) {
      setPhase({ kind: "error", message: "Eksik bilgi var, baştan deneyin" })
      return
    }

    setPhase({ kind: "submitting" })
    setPhase({ kind: "processing", stageIndex: 0 })

    // Run the staged animation in parallel with the actual network request
    // so the user sees a minimum of PROCESSING_STAGES.length * STAGE_DELAY_MS
    // even when the backend responds quickly.
    const stagePromise = (async () => {
      for (let i = 1; i < PROCESSING_STAGES.length; i++) {
        await wait(STAGE_DELAY_MS)
        if (cancelledRef.current) return
        setPhase({ kind: "processing", stageIndex: i })
      }
      await wait(STAGE_DELAY_MS)
    })()

    // Backend's `description` is opaque to it — we pack the extra intake
    // answers (team, estimated duration) into a JSON string so the contract
    // stays at `{ name, description }`. See lib/intake-payload.ts.
    const description = encodeIntakePayload({
      description: answers.description,
      team: answers.team,
      estimatedDuration: answers.estimatedDuration,
    })

    const [result] = await Promise.all([
      createProject({ name: answers.name, description }),
      stagePromise,
    ])

    if (cancelledRef.current) return

    if (result.ok) {
      setPhase({ kind: "redirecting", projectId: result.projectId })
      router.replace(`/projects/${result.projectId}`)
    } else {
      setPhase({ kind: "error", message: result.message })
    }
  }, [router, wait])

  const sendAnswer = useCallback(
    (content: string): void => {
      const trimmed = content.trim()
      if (!trimmed) return

      const step =
        phase.kind === "idle"
          ? 0
          : phase.kind === "collecting"
            ? phase.step
            : -1
      if (step < 0 || step >= INTAKE_QUESTIONS.length) return
      if (thinking) return

      const question = INTAKE_QUESTIONS[step]
      answersRef.current = {
        ...answersRef.current,
        [question.field]: trimmed,
      }

      setMessages((prev) => [...prev, makeMessage("user", trimmed)])

      const nextStep = step + 1
      const moreQuestions = nextStep < INTAKE_QUESTIONS.length

      // `thinking` drives the typing indicator bubble — only show it when
      // an assistant question is actually about to land. For the final
      // answer we just hold the orb in place briefly and submit.
      if (moreQuestions) setThinking(true)
      setPhase({ kind: "collecting", step: nextStep })

      const id = setTimeout(() => {
        timersRef.current.delete(id)
        if (cancelledRef.current) return

        if (moreQuestions) {
          setMessages((prev) => [
            ...prev,
            makeMessage("assistant", INTAKE_QUESTIONS[nextStep].text),
          ])
          setThinking(false)
          return
        }

        // No farewell message — go straight to submit. The orb stays in
        // thinking mode and immediately glides back to centre.
        void submit()
      }, THINKING_DELAY_MS)
      registerTimer(id)
    },
    [phase, registerTimer, submit, thinking],
  )

  const retry = useCallback((): void => {
    if (phase.kind !== "error") return
    void submit()
  }, [phase, submit])

  const reset = useCallback((): void => {
    clearTimers()
    answersRef.current = {}
    setMessages([])
    setThinking(false)
    setPhase({ kind: "idle" })
  }, [clearTimers])

  return { phase, messages, thinking, sendAnswer, retry, reset }
}
