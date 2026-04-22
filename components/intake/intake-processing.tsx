"use client"

import { PROCESSING_STAGES } from "@/lib/constants/intake"

interface IntakeProcessingProps {
  stageIndex: number
}

export function IntakeProcessing({ stageIndex }: IntakeProcessingProps) {
  const stage =
    PROCESSING_STAGES[Math.min(stageIndex, PROCESSING_STAGES.length - 1)]

  return (
    <p
      key={stage}
      className="text-blur-intro text-lg font-medium text-stone-700 md:text-xl"
      role="status"
      aria-live="polite"
    >
      {stage}
    </p>
  )
}
