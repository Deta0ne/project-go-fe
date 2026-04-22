"use client"

import { useState, useTransition } from "react"
import { Loader2, PencilLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProject } from "@/lib/actions/project"

interface ProjectEditDialogProps {
  projectId: string
  defaultValues: {
    name: string
    description: string
    team: string
    estimatedDuration: string
  }
  triggerLabel?: string
  disabled?: boolean
}

export function ProjectEditDialog({
  projectId,
  defaultValues,
  triggerLabel = "Edit",
  disabled,
}: ProjectEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      team: String(data.get("team") ?? "").trim(),
      estimatedDuration: String(data.get("estimatedDuration") ?? "").trim(),
    }

    startTransition(async () => {
      const res = await updateProject(projectId, payload)
      if (res.ok) {
        setOpen(false)
        return
      }
      setError(res.message)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <PencilLine className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the project name and information. If you want to regenerate
            the roadmap, use the &ldquo;Regenerate roadmap&rdquo; button.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={defaultValues.name}
              required
              maxLength={120}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              defaultValue={defaultValues.description}
              required
              rows={4}
              maxLength={6000}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-team">Team</Label>
            <Textarea
              id="project-team"
              name="team"
              defaultValue={defaultValues.team}
              required
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-duration">Estimated duration</Label>
            <Input
              id="project-duration"
              name="estimatedDuration"
              defaultValue={defaultValues.estimatedDuration}
              required
              maxLength={200}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Saving" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
