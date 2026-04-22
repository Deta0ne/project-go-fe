"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod/v4"

import { fetchBackend } from "@/lib/server/backend"
import { AUTH_COOKIE_NAME, getAuthToken } from "@/lib/server/auth-cookie"
import { encodeIntakePayload } from "@/lib/intake-payload"
import {
  projectIntakeSchema,
  projectUpdateSchema,
  type ProjectIntakeInput,
  type ProjectUpdateInput,
} from "@/lib/validations/project"
import type { CreateProjectResponse } from "@/types/project"

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; message: string }

export type DeleteProjectResult =
  | { ok: true }
  | { ok: false; message: string }

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string }

// Backend's OpenAI call has a 20s default timeout. The backend doc
// recommends FE timeout >= 30s so the server can respond with its own
// 504 before we abort client-side (giving us headroom for network +
// transaction commit latency on top of the OpenAI window).
const CREATE_PROJECT_TIMEOUT_MS = 120_000

export async function createProject(
  input: ProjectIntakeInput,
): Promise<CreateProjectResult> {
  const parsed = projectIntakeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const token = await getAuthToken()
  if (!token) {
    return { ok: false, message: "You need to be logged in" }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    CREATE_PROJECT_TIMEOUT_MS,
  )

  let res: Response
  try {
    res = await fetchBackend("/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify(parsed.data),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        message: "Roadmap generation timed out, try again",
      }
    }
    return { ok: false, message: "Server is not reachable, try again" }
  } finally {
    clearTimeout(timeoutId)
  }

  if (res.status === 401) {
    return { ok: false, message: "Your session has expired, please log in again" }
  }
  if (res.status === 502) {
    return {
      ok: false,
      message: "Roadmap generation failed, try again",
    }
  }
  if (res.status === 504) {
    return {
      ok: false,
      message: "Roadmap generation timed out, try again",
    }
  }
  if (!res.ok) {
    return { ok: false, message: "Project could not be created, try again" }
  }

  const data = (await res.json()) as Partial<CreateProjectResponse>
  const projectId = data.project?.id
  if (!projectId) {
    return { ok: false, message: "Unexpected response from server" }
  }

  return { ok: true, projectId }
}

const projectIdSchema = z.string().min(1, "Project ID is required")

export async function deleteProject(
  id: string,
): Promise<DeleteProjectResult> {
  const parsed = projectIdSchema.safeParse(id)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const token = await getAuthToken()
  if (!token) {
    return { ok: false, message: "You need to be logged in" }
  }

  let res: Response
  try {
    res = await fetchBackend(`/projects/${encodeURIComponent(parsed.data)}`, {
      method: "DELETE",
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
    })
  } catch {
    return { ok: false, message: "Server is not reachable, try again" }
  }

  if (res.status === 401) {
    return { ok: false, message: "Your session has expired, please log in again" }
  }
  if (res.status === 403) {
    return { ok: false, message: "Only the owner can delete this project" }
  }
  if (res.status === 404) {
    return { ok: false, message: "Project not found" }
  }
  if (!res.ok) {
    return { ok: false, message: "Project could not be deleted, try again" }
  }

  revalidatePath("/projects")
  return { ok: true }
}

export async function updateProject(
  id: string,
  input: ProjectUpdateInput,
): Promise<ActionResult> {
  const parsedId = projectIdSchema.safeParse(id)
  if (!parsedId.success) {
    return { ok: false, message: parsedId.error.issues[0].message }
  }
  const parsed = projectUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const token = await getAuthToken()
  if (!token) return { ok: false, message: "You need to be logged in" }

  const description = encodeIntakePayload({
    description: parsed.data.description,
    team: parsed.data.team,
    estimatedDuration: parsed.data.estimatedDuration,
  })

  let res: Response
  try {
    res = await fetchBackend(`/projects/${encodeURIComponent(parsedId.data)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({ name: parsed.data.name, description }),
    })
  } catch {
    return { ok: false, message: "Server is not reachable, try again" }
  }

  if (res.status === 401) {
    return { ok: false, message: "Your session has expired, please log in again" }
  }
  if (res.status === 403) {
    return { ok: false, message: "You do not have permission to edit this project" }
  }
  if (res.status === 404) return { ok: false, message: "Project not found" }
  if (!res.ok) {
    return { ok: false, message: "Project could not be updated, try again" }
  }

  revalidatePath(`/projects/${parsedId.data}`)
  revalidatePath("/projects")
  return { ok: true }
}

export async function regenerateRoadmap(
  id: string,
): Promise<ActionResult> {
  const parsedId = projectIdSchema.safeParse(id)
  if (!parsedId.success) {
    return { ok: false, message: parsedId.error.issues[0].message }
  }

  const token = await getAuthToken()
  if (!token) return { ok: false, message: "You need to be logged in" }

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    CREATE_PROJECT_TIMEOUT_MS,
  )

  let res: Response
  try {
    res = await fetchBackend(
      `/projects/${encodeURIComponent(parsedId.data)}/roadmap/regenerate`,
      {
        method: "POST",
        headers: { Cookie: `${AUTH_COOKIE_NAME}=${token}` },
        signal: controller.signal,
      },
    )
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        message: "Roadmap generation timed out, try again",
      }
    }
    return { ok: false, message: "Server is not reachable, try again" }
  } finally {
    clearTimeout(timeoutId)
  }

  if (res.status === 401) {
    return { ok: false, message: "Your session has expired, please log in again" }
  }
  if (res.status === 403) {
    return { ok: false, message: "You do not have permission to regenerate the roadmap" }
  }
  if (res.status === 404) return { ok: false, message: "Project not found" }
  if (res.status === 502) {
    return {
      ok: false,
      message: "Roadmap generation failed, try again",
    }
  }
  if (res.status === 504) {
    return {
      ok: false,
      message: "Roadmap generation timed out, try again",
    }
  }
  if (!res.ok) {
    return { ok: false, message: "Roadmap could not be regenerated, try again" }
  }

  revalidatePath(`/projects/${parsedId.data}`)
  return { ok: true }
}
