"use client"

import { useMemo, useState } from "react"
import { Check, ListPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RegenerateRoadmapButton } from "@/components/projects/regenerate-roadmap-button"
import { RoadmapView } from "@/components/projects/roadmap-view"
import {
  TaskFormDialog,
  type TaskFormPrefill,
} from "@/components/projects/task-form-dialog"
import { canCreateTask, canRegenerateRoadmap } from "@/lib/permissions"
import type {
  Membership,
  Roadmap,
  RoadmapItem,
  Role,
  Task,
  User,
} from "@/types/project"

interface RoadmapTabProps {
  projectId: string
  roadmap: Roadmap | null
  tasks: readonly Task[]
  role: Role | null
  members: readonly Membership[]
  users: ReadonlyMap<string, User>
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase()
}

function buildPrefill(
  item: RoadmapItem,
  milestoneTitle: string | null
): TaskFormPrefill {
  // Prepend the milestone title as a context line so the user keeps the
  // AI-generated grouping when the item becomes a standalone task.
  const parts: string[] = []
  if (milestoneTitle) parts.push(`Milestone: ${milestoneTitle}`)
  if (item.description) parts.push(item.description)
  if (item.suggested_role) parts.push(`Suggested role: ${item.suggested_role}`)
  if (item.suggested_assignee_label) {
    parts.push(`Suggested assignee: ${item.suggested_assignee_label}`)
  }
  if (item.estimated_days) {
    parts.push(`Estimated duration: ${item.estimated_days} days`)
  }

  return {
    title: item.title,
    description: parts.join("\n\n"),
    priority: item.priority,
  }
}

export function RoadmapTab({
  projectId,
  roadmap,
  tasks,
  role,
  members,
  users,
}: RoadmapTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [prefill, setPrefill] = useState<TaskFormPrefill | undefined>()
  const existingTitles = useMemo(
    () => new Set(tasks.map((task) => normalizeTitle(task.title))),
    [tasks]
  )

  const canAdd = canCreateTask(role)

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-12 text-center">
        <p className="text-sm text-stone-500">Roadmap not found.</p>
        {canRegenerateRoadmap(role) && (
          <RegenerateRoadmapButton projectId={projectId} />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <RoadmapView
        roadmap={roadmap}
        headerAction={
          canRegenerateRoadmap(role) ? (
            <RegenerateRoadmapButton projectId={projectId} />
          ) : undefined
        }
        renderItemAction={
          canAdd
            ? (item, milestoneTitle) => {
                const isAlreadyAdded = existingTitles.has(normalizeTitle(item.title))

                const button = (
                  <Button
                    type="button"
                    variant={isAlreadyAdded ? "ghost" : "outline"}
                    size="sm"
                    disabled={isAlreadyAdded}
                    onClick={() => {
                      setPrefill(buildPrefill(item, milestoneTitle))
                      setDialogOpen(true)
                    }}
                    className={
                      isAlreadyAdded
                        ? "h-7 shrink-0 px-2 text-xs text-emerald-600 disabled:opacity-100"
                        : "h-7 shrink-0 px-2 text-xs"
                    }
                  >
                    {isAlreadyAdded ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <ListPlus className="h-3.5 w-3.5" />
                    )}
                    {isAlreadyAdded ? "Added" : "Add as task"}
                  </Button>
                )

                if (isAlreadyAdded) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>{button}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        This roadmap item is already a project task.
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>
                      Create a project task from this roadmap item
                    </TooltipContent>
                  </Tooltip>
                )
              }
            : undefined
        }
      />

      {canAdd && (
        <TaskFormDialog
          open={dialogOpen}
          onOpenChange={(next) => {
            setDialogOpen(next)
            if (!next) setPrefill(undefined)
          }}
          projectId={projectId}
          members={members}
          users={users}
          prefill={prefill}
        />
      )}
    </div>
  )
}
