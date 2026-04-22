import { Calendar, GitBranch, Target, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  Roadmap,
  RoadmapItem,
  RoadmapMilestone,
  TaskPriority,
} from "@/types/project"

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

function priorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 ring-red-200"
    case "medium":
      return "bg-amber-50 text-amber-700 ring-amber-200"
    case "low":
      return "bg-stone-100 text-stone-600 ring-stone-200"
  }
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        "bg-stone-50 text-stone-600 ring-stone-200",
        className
      )}
    >
      {children}
    </span>
  )
}

function MilestoneCard({
  index,
  milestone,
}: {
  index: number
  milestone: RoadmapMilestone
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-stone-200 bg-white/70 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
        {index + 1}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-stone-800">
            {milestone.title}
          </h3>
          {milestone.estimated_duration && (
            <Chip>
              <Calendar className="h-3 w-3" />
              {milestone.estimated_duration}
            </Chip>
          )}
        </div>
        {milestone.description && (
          <p className="text-sm whitespace-pre-wrap text-stone-600">
            {milestone.description}
          </p>
        )}
      </div>
    </li>
  )
}

function ItemCard({
  item,
  renderAction,
}: {
  item: RoadmapItem
  renderAction?: (item: RoadmapItem) => React.ReactNode
}) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium text-stone-800">{item.title}</h4>
          <Chip className={priorityBadgeClass(item.priority)}>
            {PRIORITY_LABEL[item.priority]}
          </Chip>
          <Chip>
            <Calendar className="h-3 w-3" />
            {item.estimated_days} days
          </Chip>
          {item.suggested_role && (
            <Chip>
              <Target className="h-3 w-3" />
              {item.suggested_role}
            </Chip>
          )}
          {item.suggested_assignee_label && (
            <Chip>
              <UserRound className="h-3 w-3" />
              {item.suggested_assignee_label}
            </Chip>
          )}
        </div>
        {renderAction?.(item)}
      </div>

      {item.description && (
        <p className="text-sm whitespace-pre-wrap text-stone-600">
          {item.description}
        </p>
      )}

      {item.depends_on.length > 0 && (
        <div className="mt-1 flex items-start gap-2 text-xs text-stone-500">
          <GitBranch className="mt-0.5 h-3 w-3 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-stone-600">Dependencies</span>
            <ul className="flex flex-col gap-0.5">
              {item.depends_on.map((dep) => (
                <li key={dep}>· {dep}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}

interface RoadmapViewProps {
  roadmap: Roadmap
  // Optional per-item action slot (e.g. "Add as task" on the roadmap tab).
  // Keeping it as a render prop lets callers inject a client component
  // without forcing this file to be a client component.
  renderItemAction?: (
    item: RoadmapItem,
    milestoneTitle: string | null
  ) => React.ReactNode
  // Header slot for extra content (e.g. regenerate button) on the right side.
  headerAction?: React.ReactNode
}

export function RoadmapView({
  roadmap,
  renderItemAction,
  headerAction,
}: RoadmapViewProps) {
  const { summary, milestones, items } = roadmap.payload

  // Group items by milestone_index so the reader can see which task belongs
  // to which milestone at a glance. Guard against out-of-range indices so a
  // bad AI payload never breaks the page.
  // Backend sends 1-indexed milestone_index (1, 2, 3...), convert to 0-indexed.
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

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xs font-medium tracking-wide text-stone-400 uppercase">
            Roadmap
          </h2>
          <p className="mt-1 text-xs text-stone-400">model · {roadmap.model}</p>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </header>

      {summary && (
        <p className="text-sm whitespace-pre-wrap text-stone-700">{summary}</p>
      )}

      {milestones.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wide text-stone-400 uppercase">
            Milestones
          </h3>
          <ol className="flex flex-col gap-3">
            {milestones.map((milestone, index) => (
              <MilestoneCard
                key={`${index}-${milestone.title}`}
                index={index}
                milestone={milestone}
              />
            ))}
          </ol>
        </div>
      )}

      {milestones.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-medium tracking-wide text-stone-400 uppercase">
            Tasks
          </h3>
          {milestones.map((milestone, index) => {
            const bucket = itemsByMilestone.get(index) ?? []
            if (bucket.length === 0) return null
            return (
              <div key={`bucket-${index}`} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-stone-700">
                  {index + 1}. {milestone.title}
                </p>
                <ul className="flex flex-col gap-2">
                  {bucket.map((item, itemIdx) => (
                    <ItemCard
                      key={`${index}-${itemIdx}-${item.title}`}
                      item={item}
                      renderAction={
                        renderItemAction
                          ? (it) => renderItemAction(it, milestone.title)
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )
          })}

          {orphanItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-stone-700">Other</p>
              <ul className="flex flex-col gap-2">
                {orphanItems.map((item, idx) => (
                  <ItemCard
                    key={`orphan-${idx}-${item.title}`}
                    item={item}
                    renderAction={
                      renderItemAction
                        ? (it) => renderItemAction(it, null)
                        : undefined
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
