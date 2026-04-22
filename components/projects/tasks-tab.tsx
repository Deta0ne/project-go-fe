"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/projects/task-card"
import { TaskFormDialog } from "@/components/projects/task-form-dialog"
import { canCreateTask } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type {
  Membership,
  Role,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "@/types/project"

type StatusFilter = TaskStatus | "all"
type PriorityFilter = TaskPriority | "all"

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
]

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

interface TasksTabProps {
  projectId: string
  tasks: readonly Task[]
  members: readonly Membership[]
  users: ReadonlyMap<string, User>
  role: Role | null
  meId: string | null
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-stone-800 bg-stone-800 text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-800"
      )}
    >
      {children}
    </button>
  )
}

export function TasksTab({
  projectId,
  tasks,
  members,
  users,
  role,
  meId,
}: TasksTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")

  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false
      }
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  const canCreate = canCreateTask(role)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <Pill
              key={f.value}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1 text-[10px] opacity-70">
                  {tasks.filter((t) => t.status === f.value).length}
                </span>
              )}
            </Pill>
          ))}
          <span className="mx-1 h-4 w-px bg-stone-200" aria-hidden />
          {PRIORITY_FILTERS.map((f) => (
            <Pill
              key={f.value}
              active={priorityFilter === f.value}
              onClick={() => setPriorityFilter(f.value)}
            >
              {f.label}
            </Pill>
          ))}
        </div>

        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-12 text-center">
          <p className="text-sm text-stone-500">
            {tasks.length === 0
              ? "No tasks yet."
              : "No tasks found for this filter."}
          </p>
          {tasks.length === 0 && (
            <p className="text-xs text-stone-400">
              Roadmap tab from suggestions or create a new task .
            </p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                role={role}
                meId={meId}
                users={users}
                onEdit={(t) => setEditingTask(t)}
              />
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <TaskFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projectId={projectId}
          members={members}
          users={users}
        />
      )}

      {editingTask && (
        <TaskFormDialog
          open={Boolean(editingTask)}
          onOpenChange={(next) => {
            if (!next) setEditingTask(null)
          }}
          projectId={projectId}
          members={members}
          users={users}
          task={editingTask}
        />
      )}
    </div>
  )
}
