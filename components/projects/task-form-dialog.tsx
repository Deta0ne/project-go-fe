"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTask, updateTask } from "@/lib/actions/task"
import type {
  Membership,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "@/types/project"

const NONE_VALUE = "__none__"

export type TaskFormPrefill = {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  assignee_id?: string | null
  due_date?: string | null
}

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (next: boolean) => void
  projectId: string
  members: readonly Membership[]
  users: ReadonlyMap<string, User>
  // If `task` is provided → edit mode. Otherwise → create mode (optionally
  // pre-filled, e.g. from a roadmap item).
  task?: Task
  prefill?: TaskFormPrefill
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return ""
  // Backend returns RFC3339; the date input only needs YYYY-MM-DD.
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toIsoFromDateInput(value: string): string | null {
  if (!value) return null
  // Normalize to midnight UTC so backend just stores the date.
  const iso = new Date(`${value}T00:00:00.000Z`).toISOString()
  return iso
}

export function TaskFormDialog({
  open,
  onOpenChange,
  projectId,
  members,
  users,
  task,
  prefill,
}: TaskFormDialogProps) {
  const isEdit = Boolean(task)
  const initial: Required<TaskFormPrefill> & { status: TaskStatus } = {
    title: task?.title ?? prefill?.title ?? "",
    description: task?.description ?? prefill?.description ?? "",
    priority: task?.priority ?? prefill?.priority ?? "medium",
    status: task?.status ?? prefill?.status ?? "todo",
    assignee_id: task?.assignee_id ?? prefill?.assignee_id ?? null,
    due_date: task?.due_date ?? prefill?.due_date ?? null,
  }

  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [priority, setPriority] = useState<TaskPriority>(initial.priority)
  const [status, setStatus] = useState<TaskStatus>(initial.status)
  const [assignee, setAssignee] = useState<string>(
    initial.assignee_id ?? NONE_VALUE
  )
  const [dueDate, setDueDate] = useState<string>(
    toDateInputValue(initial.due_date)
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Reset when the dialog reopens for a different task/prefill.
  React.useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? prefill?.title ?? "")
    setDescription(task?.description ?? prefill?.description ?? "")
    setPriority(task?.priority ?? prefill?.priority ?? "medium")
    setStatus(task?.status ?? prefill?.status ?? "todo")
    setAssignee(task?.assignee_id ?? prefill?.assignee_id ?? NONE_VALUE)
    setDueDate(toDateInputValue(task?.due_date ?? prefill?.due_date ?? null))
    setError(null)
  }, [open, task, prefill])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)

    startTransition(async () => {
      if (isEdit && task) {
        // For edit, send only changed fields so unrelated values stay
        // untouched. Nullable fields are cleared with explicit `null`.
        const patch: Parameters<typeof updateTask>[2] = {}
        if (title !== task.title) patch.title = title
        if (description !== task.description) patch.description = description
        if (status !== task.status) patch.status = status
        if (priority !== task.priority) patch.priority = priority

        const nextAssignee = assignee === NONE_VALUE ? null : assignee
        if (nextAssignee !== (task.assignee_id ?? null)) {
          patch.assignee_id = nextAssignee
        }

        const nextDue = toIsoFromDateInput(dueDate)
        const currentDue = task.due_date ?? null
        if (nextDue !== currentDue) {
          patch.due_date = nextDue
        }

        if (Object.keys(patch).length === 0) {
          onOpenChange(false)
          return
        }

        const res = await updateTask(task.id, projectId, patch)
        if (res.ok) {
          onOpenChange(false)
          return
        }
        setError(res.message)
        return
      }

      const res = await createTask(projectId, {
        title,
        description,
        priority,
        status,
        assignee_id: assignee === NONE_VALUE ? "" : assignee,
        due_date: toIsoFromDateInput(dueDate) ?? undefined,
      })
      if (res.ok) {
        onOpenChange(false)
        return
      }
      setError(res.message)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Create a task that you can assign to your team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="No one assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No one assigned</SelectItem>
                  {members.map((m) => {
                    const user = users.get(m.user_id)
                    return (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {user?.email ?? m.user_id.slice(-8)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending
                ? isEdit
                  ? "Updating"
                  : "Creating"
                : isEdit
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
