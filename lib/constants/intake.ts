import type { IntakeAnswers } from "@/types/intake"

export const HERO_GREETING = "What shalt thou build?"

export const INTAKE_QUESTIONS = [
  { field: "description", text: HERO_GREETING },
  {
    field: "team",
    text: "Who is on your team, and what will each person be working on?",
  },
  {
    field: "estimatedDuration",
    text: "How long do you estimate this project will take?",
  },
  {
    field: "name",
    text: "What is the name of the project that you want to build?",
  },
] as const satisfies ReadonlyArray<{
  field: keyof IntakeAnswers
  text: string
}>

export const PROCESSING_STAGES = [
  "Analyzing your idea...",
  "Designing the project shape...",
  "Setting things up...",
] as const

/** Pause between user answer and the next assistant question — gives the
 * "assistant is typing" feel during the conversation. After the final
 * answer the same delay precedes submit(), keeping the orb in thinking
 * mode while it glides back to centre. */
export const THINKING_DELAY_MS = 1200

/** Per-stage visibility during processing. The total artificial floor is
 * `PROCESSING_STAGES.length * STAGE_DELAY_MS`. The orb's centre-glide
 * animation runs in 900 ms, so this should stay above ~600 ms to feel
 * intentional rather than rushed. */
export const STAGE_DELAY_MS = 700
