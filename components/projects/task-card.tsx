"use client"

import { useState, useTransition } from "react"
import {
  Calendar,
  Check,
  CircleDashed,
  Loader2,
  Pencil,
  Play,
  Trash2,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { deleteTask, updateTask } from "@/lib/actions/task"
import { canDeleteTask, canEditTask } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type {
  Role,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "@/types/project"

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-stone-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
}

// Status quick-toggle cycles through the three states.
const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "done") return <Check className="h-3.5 w-3.5" />
  if (status === "in_progress") return <Play className="h-3.5 w-3.5" />
  return <CircleDashed className="h-3.5 w-3.5" />
}

function statusButtonClass(status: TaskStatus): string {
  switch (status) {
    case "done":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    case "in_progress":
      return "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
    case "todo":
      return "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
  }
}

function isOverdue(due: string | undefined, status: TaskStatus): boolean {
  if (!due || status === "done") return false
  const d = new Date(due).getTime()
  if (Number.isNaN(d)) return false
  return d < Date.now()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

interface TaskCardProps {
  task: Task
  role: Role | null
  meId: string | null
  users: ReadonlyMap<string, User>
  onEdit: (task: Task) => void
}

export function TaskCard({ task, role, meId, users, onEdit }: TaskCardProps) {
  const [isStatusPending, startStatusTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canEdit = canEditTask(role)
  const canDelete = canDeleteTask(role, task, meId)
  const canToggleStatus = canEdit
  const assignee = task.assignee_id ? users.get(task.assignee_id) : undefined
  const overdue = isOverdue(task.due_date, task.status)

  function toggleStatus() {
    if (!canToggleStatus || isStatusPending) return
    const next = NEXT_STATUS[task.status]
    startStatusTransition(async () => {
      await updateTask(task.id, task.project_id, { status: next })
    })
  }

  function confirmDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (isDeletePending) return
    setDeleteError(null)
    startDeleteTransition(async () => {
      const res = await deleteTask(task.id, task.project_id)
      if (res.ok) {
        setDeleteOpen(false)
        return
      }
      setDeleteError(res.message)
    })
  }

  return (
    <article className="group flex gap-3 rounded-2xl border border-stone-200 bg-white/70 p-4 transition-colors hover:border-stone-300">
      <button
        type="button"
        onClick={toggleStatus}
        disabled={!canToggleStatus || isStatusPending}
        aria-label={`Change status · currently ${STATUS_LABEL[task.status]}`}
        title={STATUS_LABEL[task.status]}
        className={cn(
          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
          statusButtonClass(task.status),
          !canToggleStatus && "cursor-default opacity-80",
          isStatusPending && "cursor-progress opacity-70"
        )}
      >
        {isStatusPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <StatusIcon status={task.status} />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3
            className={cn(
              "text-sm font-medium text-stone-800",
              task.status === "done" && "text-stone-400 line-through"
            )}
          >
            {task.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <span className="flex items-center gap-1 text-xs text-stone-500">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  PRIORITY_DOT[task.priority]
                )}
                aria-hidden
              />
              {PRIORITY_LABEL[task.priority]}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-stone-400 hover:text-stone-800"
                  onClick={() => onEdit(task)}
                  aria-label="Edit task"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <AlertDialog
                  open={deleteOpen}
                  onOpenChange={(next) => {
                    if (!next) setDeleteError(null)
                    setDeleteOpen(next)
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-stone-400 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete task</AlertDialogTitle>
                      <AlertDialogDescription>
                        <span className="font-medium text-foreground">
                          {task.title}
                        </span>{" "}
                        will be permanently deleted. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                      <p className="text-sm text-destructive" role="alert">
                        {deleteError}
                      </p>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeletePending}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={confirmDelete}
                        disabled={isDeletePending}
                      >
                        {isDeletePending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {isDeletePending ? "Deleting" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <p className="line-clamp-2 text-sm whitespace-pre-wrap text-stone-600">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {task.due_date && (
            <Badge variant={overdue ? "destructive" : "outline"}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
            </Badge>
          )}
          {assignee && (
            <Badge variant="secondary">
              <UserRound className="h-3 w-3" />
              {assignee.email}
            </Badge>
          )}
        </div>
      </div>
    </article>
  )
}
