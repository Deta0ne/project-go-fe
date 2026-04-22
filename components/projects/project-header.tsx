import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog"
import { canDeleteProject, canEditProject, roleLabel } from "@/lib/permissions"
import type { Project, Role } from "@/types/project"

interface ProjectHeaderProps {
  project: Project
  role: Role | null
  editDefaults: {
    name: string
    description: string
    team: string
    estimatedDuration: string
  }
}

const ROLE_BADGE_VARIANT = {
  owner: "info" as const,
  co_owner: "secondary" as const,
  member: "outline" as const,
}

export function ProjectHeader({
  project,
  role,
  editDefaults,
}: ProjectHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-1 text-xs text-stone-500">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 gap-1 px-2 text-xs text-stone-500 hover:text-stone-800"
        >
          <Link href="/projects">
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-heading text-2xl font-medium tracking-tight text-stone-900 sm:text-3xl">
              {project.name}
            </h1>
            {role && (
              <Badge variant={ROLE_BADGE_VARIANT[role]}>
                {roleLabel(role)}
              </Badge>
            )}
          </div>
          <p className="font-mono text-[11px] text-stone-400">{project.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditProject(role) && (
            <ProjectEditDialog
              projectId={project.id}
              defaultValues={editDefaults}
            />
          )}

          {canDeleteProject(role) && (
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              variant="destructive"
              redirectTo="/projects"
            />
          )}
        </div>
      </div>
    </header>
  )
}
