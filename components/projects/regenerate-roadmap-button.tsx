"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { regenerateRoadmap } from "@/lib/actions/project"

interface RegenerateRoadmapButtonProps {
  projectId: string
  disabled?: boolean
  compact?: boolean
}

export function RegenerateRoadmapButton({
  projectId,
  disabled,
  compact,
}: RegenerateRoadmapButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)

    startTransition(async () => {
      const res = await regenerateRoadmap(projectId)
      if (res.ok) {
        setOpen(false)
        return
      }
      setError(res.message)
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isPending}
          aria-label="Regenerate roadmap for this project"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {compact ? null : isPending ? "Regenerating" : "Regenerate roadmap"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate roadmap</AlertDialogTitle>
          <AlertDialogDescription>
            The current roadmap will be deleted and a new one will be generated
            by AI. This process may take up to 20 seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Regenerating" : "Regenerate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
