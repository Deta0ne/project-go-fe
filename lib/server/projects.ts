import "server-only"

import { fetchBackend } from "@/lib/server/backend"
import { AUTH_COOKIE_NAME, getAuthToken } from "@/lib/server/auth-cookie"
import type { Membership, Project, Roadmap, Task } from "@/types/project"

// Re-export so feature code can keep importing the project shape from this
// module, but the canonical definition lives in `@/types/project`.
export type { Project } from "@/types/project"
// Back-compat alias for earlier code that imported `ProjectDto`.
export type ProjectDto = Project

async function authedFetch(path: string): Promise<Response | null> {
  const token = await getAuthToken()
  if (!token) return null

  try {
    return await fetchBackend(path, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
  } catch {
    return null
  }
}

export async function fetchProject(id: string): Promise<Project | null> {
  const res = await authedFetch(`/projects/${encodeURIComponent(id)}`)
  if (!res) return null
  if (res.status === 404 || res.status === 401) return null
  if (!res.ok) return null
  return (await res.json()) as Project
}

export async function fetchProjectRoadmap(
  id: string,
): Promise<Roadmap | null> {
  const res = await authedFetch(
    `/projects/${encodeURIComponent(id)}/roadmap`,
  )
  if (!res) return null
  // 404 covers both "project not found" and "roadmap not found" — the UI
  // treats either as "no roadmap to show" without leaking the distinction.
  if (res.status === 404 || res.status === 401) return null
  if (!res.ok) return null
  return (await res.json()) as Roadmap
}

interface ListProjectsOptions {
  limit?: number
  offset?: number
}

export async function fetchProjects(
  options: ListProjectsOptions = {},
): Promise<Project[]> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set("limit", String(options.limit))
  if (options.offset !== undefined) params.set("offset", String(options.offset))
  const qs = params.toString()
  const path = qs ? `/projects?${qs}` : "/projects"

  const res = await authedFetch(path)
  if (!res || !res.ok) return []
  return (await res.json()) as Project[]
}

export async function fetchProjectMembers(
  id: string,
): Promise<Membership[]> {
  const res = await authedFetch(
    `/projects/${encodeURIComponent(id)}/members`,
  )
  if (!res || !res.ok) return []
  return (await res.json()) as Membership[]
}

export async function fetchProjectTasks(id: string): Promise<Task[]> {
  const res = await authedFetch(`/projects/${encodeURIComponent(id)}/tasks`)
  if (!res || !res.ok) return []
  return (await res.json()) as Task[]
}
