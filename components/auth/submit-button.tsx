"use client"

import { useFormStatus } from "react-dom"
import { SpinnerGap } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <SpinnerGap className="animate-spin" /> : children}
    </Button>
  )
}
