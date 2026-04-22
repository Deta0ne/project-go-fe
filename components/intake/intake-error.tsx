"use client"

import { Button } from "@/components/ui/button"

interface IntakeErrorProps {
  message: string
  onRetry: () => void
  onReset: () => void
}

export function IntakeError({ message, onRetry, onReset }: IntakeErrorProps) {
  return (
    <div
      className="flex max-w-md flex-col items-center gap-6 text-center"
      role="alert"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium text-stone-800">
          Bir şeyler ters gitti
        </h2>
        <p className="text-sm text-stone-500">{message}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onRetry}>Tekrar dene</Button>
        <Button variant="ghost" onClick={onReset}>
          Baştan başla
        </Button>
      </div>
    </div>
  )
}
