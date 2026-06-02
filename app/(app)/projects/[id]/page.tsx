import { notFound } from "next/navigation"

import { ProjectDetailShell } from "@/components/projects/project-detail-shell"
import { ProjectHeader } from "@/components/projects/project-header"
import { getCurrentUserId } from "@/lib/server/auth-cookie"
import { decodeIntakePayload } from "@/lib/intake-payload"
import { getMyRole } from "@/lib/permissions"
import {
  fetchProject,
  fetchProjectMembers,
  fetchProjectRoadmap,
  fetchProjectTasks,
} from "@/lib/server/projects"
import { fetchUsersByIds } from "@/lib/server/users"
import type { User } from "@/types/project"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch everything the page needs in parallel — none depend on each
  // other except `users`, which we resolve right after we know the member
  // ids. Any failure degrades gracefully to an empty list/null.
  const [project, roadmap, members, tasks, meId] = await Promise.all([
    fetchProject(id),
    fetchProjectRoadmap(id),
    fetchProjectMembers(id),
    fetchProjectTasks(id),
    getCurrentUserId(),
  ])

  if (!project) notFound()

  // Include the current user in the lookup even if they're not a member
  // yet (e.g. admin view) so we can display their email in forms.
  const memberIds = members.map((m) => m.user_id)
  const lookupIds = meId ? [...memberIds, meId] : memberIds
  const userMap = await fetchUsersByIds(lookupIds)

  // Serialize the Map to a plain record for the RSC → client boundary.
  const usersById: Record<string, User> = Object.fromEntries(userMap)

  const role = getMyRole(members, meId)

  const decoded = decodeIntakePayload(project.description)
  const editDefaults = decoded.ok
    ? {
        name: project.name,
        description: decoded.data.description,
        team: decoded.data.team,
        estimatedDuration: decoded.data.estimatedDuration,
      }
    : {
        name: project.name,
        description: decoded.raw ?? "",
        team: "",
        estimatedDuration: "",
      }

  return (
    <main className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto px-6 py-10">
      <ProjectHeader
        project={project}
        role={role}
        editDefaults={editDefaults}
      />
      <ProjectDetailShell
        project={project}
        roadmap={roadmap}
        tasks={tasks}
        members={members}
        usersById={usersById}
        role={role}
        meId={meId}
      />
    </main>
  )
}
