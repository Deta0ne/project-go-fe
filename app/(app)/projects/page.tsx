import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"
import { decodeIntakePayload } from "@/lib/intake-payload"
import { fetchProjects } from "@/lib/server/projects"
import type { Project } from "@/types/project"

const DESCRIPTION_PREVIEW_CHARS = 180

function descriptionPreview(raw: string): string {
  const decoded = decodeIntakePayload(raw)
  const text = decoded.ok ? decoded.data.description : decoded.raw
  if (!text) return ""
  if (text.length <= DESCRIPTION_PREVIEW_CHARS) return text
  return `${text.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}…`
}

function ProjectCard({ project }: { project: Project }) {
  const preview = descriptionPreview(project.description)
  const created = new Date(project.created_at).toLocaleDateString()

  return (
    <div className="group relative rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-sm transition-all hover:border-stone-300 hover:bg-white hover:shadow-sm">
      <Link
        href={`/projects/${project.id}`}
        className="flex flex-col gap-3 rounded-2xl p-5 pr-14 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
      >
        <h2 className="line-clamp-1 text-base font-medium text-stone-800 group-hover:text-stone-900">
          {project.name}
        </h2>

        {preview && (
          <p className="line-clamp-3 text-sm text-stone-600">{preview}</p>
        )}

        <span className="text-xs text-stone-400">{created}</span>
      </Link>

      <div className="absolute top-3 right-3">
        <DeleteProjectButton
          projectId={project.id}
          projectName={project.name}
        />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-200 px-6 py-16 text-center">
      <h2 className="text-lg font-medium text-stone-700">No projects yet</h2>
      <p className="max-w-sm text-sm text-stone-500">
        To create your first project, click the button below and answer a few
        questions.
      </p>
      <Button asChild>
        <Link href="/projects/create">
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </Button>
    </div>
  )
}

export default async function ProjectsListPage() {
  const projects = await fetchProjects({ limit: 50 })

  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col gap-8 overflow-y-auto px-6 py-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-stone-400 uppercase">
            Projects
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-800">
            My projects
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button asChild size="sm">
              <Link href="/projects/create">
                <Plus className="h-4 w-4" />
                New project
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </header>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
