"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

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
import { deleteProject } from "@/lib/actions/project"
import { cn } from "@/lib/utils"

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
  // When set, the user is navigated here after a successful delete.
  // Useful on the detail page where the current route disappears.
  redirectTo?: string
  // Alternate trigger appearance for the project detail page (label + icon).
  variant?: "icon" | "destructive"
}

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo,
  variant = "icon",
}: DeleteProjectButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    // Prevent the dialog from closing automatically — we close it manually
    // only on success so error messages stay visible.
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await deleteProject(projectId)
      if (result.ok) {
        setOpen(false)
        if (redirectTo) router.push(redirectTo)
        return
      }
      setError(result.message)
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
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${projectName} project`}
            className={cn(
              "h-8 w-8 text-stone-400 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            aria-label={`Delete ${projectName} project`}
          >
            <Trash2 className="h-4 w-4" />
            Delete project
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{projectName}</span>{" "}
            project and all tasks & memberships will be permanently deleted.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Deleting" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
