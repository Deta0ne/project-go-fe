"use client"

import {
  ArrowRight,
  CalendarClock,
  Flag,
  GitBranch,
  Hourglass,
  Target,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  Roadmap,
  RoadmapItem,
  RoadmapMilestone,
  TaskPriority,
} from "@/types/project"

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
}

function priorityDotClass(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-red-500 ring-red-200"
    case "medium":
      return "bg-amber-500 ring-amber-200"
    case "low":
      return "bg-stone-400 ring-stone-200"
  }
}

function priorityAccentClass(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "from-red-200/70 via-red-100/30"
    case "medium":
      return "from-amber-200/70 via-amber-100/30"
    case "low":
      return "from-stone-300/60 via-stone-200/30"
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

/**
 * Compact metadata pill used inside the card. Less visual weight than the
 * older Chip badge — uses muted icon + label and only adds a ring on hover.
 */
function MetaPill({
  icon: Icon,
  label,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: React.ReactNode
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-stone-500 ring-1 ring-transparent transition-colors hover:bg-stone-100 hover:text-stone-700 hover:ring-stone-200">
          <Icon className="h-3 w-3" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function ItemCard({
  item,
  index,
  renderAction,
}: {
  item: RoadmapItem
  index: number
  renderAction?: (item: RoadmapItem) => React.ReactNode
}) {
  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-xl border border-stone-200/80 bg-white p-4",
        "shadow-[0_1px_0_rgba(0,0,0,0.02),0_4px_12px_-8px_rgba(0,0,0,0.08)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_2px_0_rgba(0,0,0,0.02),0_12px_24px_-12px_rgba(0,0,0,0.18)]"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r to-transparent opacity-80",
          priorityAccentClass(item.priority)
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
            <span className="font-mono text-stone-400">T·{pad2(index + 1)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex h-2 w-2 rounded-full ring-2",
                    priorityDotClass(item.priority)
                  )}
                  aria-label={PRIORITY_LABEL[item.priority]}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span className="flex items-center gap-1.5">
                  <Flag className="h-3 w-3" />
                  {PRIORITY_LABEL[item.priority]}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          <h4 className="text-[15px] leading-snug font-semibold text-stone-900">
            {item.title}
          </h4>

          {item.description && (
            <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap text-stone-600">
              {item.description}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 -ml-1.5">
            <MetaPill
              icon={Hourglass}
              label={`${item.estimated_days}d`}
              tooltip={`Estimated ${item.estimated_days} day${item.estimated_days === 1 ? "" : "s"}`}
            />
            {item.suggested_role && (
              <MetaPill
                icon={Target}
                label={item.suggested_role}
                tooltip={`Suggested role: ${item.suggested_role}`}
              />
            )}
            {item.suggested_assignee_label && (
              <MetaPill
                icon={UserRound}
                label={item.suggested_assignee_label}
                tooltip={`Suggested assignee: ${item.suggested_assignee_label}`}
              />
            )}
          </div>

          {item.depends_on.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-stone-400">
                <GitBranch className="h-3 w-3" />
                depends on
              </span>
              {item.depends_on.map((dep) => (
                <Tooltip key={dep}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-md bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600 ring-1 ring-stone-200/80">
                      <ArrowRight className="h-2.5 w-2.5 shrink-0 text-stone-400" />
                      <span className="truncate">{dep}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{dep}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        {renderAction && <div className="shrink-0">{renderAction(item)}</div>}
      </div>
    </li>
  )
}

function MilestoneSection({
  index,
  milestone,
  items,
  renderItemAction,
}: {
  index: number
  milestone: RoadmapMilestone
  items: readonly RoadmapItem[]
  renderItemAction?: (
    item: RoadmapItem,
    milestoneTitle: string | null
  ) => React.ReactNode
}) {
  return (
    <li className="relative pl-14">
      <div className="absolute top-0.5 left-0 flex flex-col items-center">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold tracking-wider text-stone-100 shadow-md ring-4 ring-white">
          <span className="font-mono">{pad2(index + 1)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
              Milestone {pad2(index + 1)}
            </span>
            <h3 className="text-base font-semibold text-stone-900">
              {milestone.title}
            </h3>
          </div>
          {milestone.estimated_duration && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900/5 px-2.5 py-1 text-[11px] font-medium text-stone-700 ring-1 ring-stone-900/5">
                  <CalendarClock className="h-3 w-3" />
                  {milestone.estimated_duration}
                </span>
              </TooltipTrigger>
              <TooltipContent>Estimated duration</TooltipContent>
            </Tooltip>
          )}
        </div>

        {milestone.description && (
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-stone-600">
            {milestone.description}
          </p>
        )}

        {items.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2.5">
            {items.map((item, itemIdx) => (
              <ItemCard
                key={`${index}-${itemIdx}-${item.title}`}
                item={item}
                index={itemIdx}
                renderAction={
                  renderItemAction
                    ? (it) => renderItemAction(it, milestone.title)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

interface RoadmapViewProps {
  roadmap: Roadmap
  renderItemAction?: (
    item: RoadmapItem,
    milestoneTitle: string | null
  ) => React.ReactNode
  headerAction?: React.ReactNode
}

export function RoadmapView({
  roadmap,
  renderItemAction,
  headerAction,
}: RoadmapViewProps) {
  const { summary, milestones, items } = roadmap.payload

  // Group items by milestone_index. Backend sends 1-indexed values; convert
  // to 0-indexed and route out-of-range entries to an "Other" bucket.
  const itemsByMilestone = new Map<number, RoadmapItem[]>()
  const orphanItems: RoadmapItem[] = []
  items.forEach((item) => {
    const idx = item.milestone_index - 1
    if (idx < 0 || idx >= milestones.length) {
      orphanItems.push(item)
      return
    }
    const bucket = itemsByMilestone.get(idx) ?? []
    bucket.push(item)
    itemsByMilestone.set(idx, bucket)
  })

  const totalDays = items.reduce(
    (sum, item) => sum + (item.estimated_days || 0),
    0
  )

  return (
    <TooltipProvider delayDuration={150}>
      <section className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200/80 pb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
              Project Roadmap
            </span>
            <h2 className="text-xl font-semibold text-stone-900">
              {milestones.length} milestone{milestones.length === 1 ? "" : "s"}
              <span className="mx-2 text-stone-300">·</span>
              <span className="text-stone-500">
                {items.length} task{items.length === 1 ? "" : "s"}
              </span>
              {totalDays > 0 && (
                <>
                  <span className="mx-2 text-stone-300">·</span>
                  <span className="font-mono text-sm text-stone-500">
                    ≈ {totalDays}d
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs text-stone-400">
              Generated by{" "}
              <span className="font-mono text-stone-500">{roadmap.model}</span>
            </p>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>

        {summary && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
            {summary}
          </p>
        )}

        {milestones.length > 0 && (
          <div className="relative">
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-5 w-px bg-linear-to-b from-stone-300 via-stone-200 to-transparent"
            />
            <ol className="relative flex flex-col gap-5">
              {milestones.map((milestone, index) => (
                <MilestoneSection
                  key={`${index}-${milestone.title}`}
                  index={index}
                  milestone={milestone}
                  items={itemsByMilestone.get(index) ?? []}
                  renderItemAction={renderItemAction}
                />
              ))}
            </ol>

            {orphanItems.length > 0 && (
              <div className="relative mt-5 pl-14">
                <div className="absolute top-1 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-stone-500 shadow-sm ring-4 ring-white">
                  <span className="font-mono">··</span>
                </div>
                <div className="rounded-2xl border border-dashed border-stone-200 bg-white/50 p-5">
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                    Other
                  </span>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {orphanItems.map((item, idx) => (
                      <ItemCard
                        key={`orphan-${idx}-${item.title}`}
                        item={item}
                        index={idx}
                        renderAction={
                          renderItemAction
                            ? (it) => renderItemAction(it, null)
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </TooltipProvider>
  )
}
