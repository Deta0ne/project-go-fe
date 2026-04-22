export interface IntakeAnswers {
  description: string
  team: string
  estimatedDuration: string
  name: string
}

export type IntakePhase =
  | { kind: "idle" }
  | { kind: "collecting"; step: number }
  | { kind: "submitting" }
  | { kind: "processing"; stageIndex: number }
  | { kind: "redirecting"; projectId: string }
  | { kind: "error"; message: string }
