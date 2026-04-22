import { Calendar, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Project, Roadmap } from "@/types/project"
import { decodeIntakePayload } from "@/lib/intake-payload"

interface OverviewTabProps {
  project: Project
  roadmap: Roadmap | null
}

function Section({
  label,
  children,
  icon,
}: {
  label: string
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-stone-400 uppercase">
        {icon}
        {label}
      </p>
      <div className="text-sm whitespace-pre-wrap text-stone-800">
        {children}
      </div>
    </div>
  )
}

export function OverviewTab({ project, roadmap }: OverviewTabProps) {
  const decoded = decodeIntakePayload(project.description)
  const teamMembers = roadmap?.payload.team_members

  return (
    <div className="flex flex-col gap-8">
      {decoded.ok ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Section label="Description">{decoded.data.description}</Section>
          <Section label="Team" icon={<Users className="h-3 w-3" />}>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((member, idx) => (
                    <Badge
                      key={`${member.name}-${idx}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {member.name} · {member.role}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              decoded.data.team
            )}
          </Section>
          <Section
            label="Estimated duration"
            icon={<Calendar className="h-3 w-3" />}
          >
            {decoded.data.estimatedDuration}
          </Section>
        </div>
      ) : (
        <Section label="Description">
          {decoded.raw || "(description not found)"}
        </Section>
      )}

      {roadmap?.payload.summary && (
        <Section label="Roadmap summary">{roadmap.payload.summary}</Section>
      )}

      <footer className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-400">
        <span>Created · {new Date(project.created_at).toLocaleString()}</span>
        {project.updated_at !== project.created_at && (
          <span>Updated · {new Date(project.updated_at).toLocaleString()}</span>
        )}
      </footer>
    </div>
  )
}
