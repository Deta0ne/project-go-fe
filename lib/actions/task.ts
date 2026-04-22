"use server"

import { revalidatePath } from "next/cache"

import { fetchBackend } from "@/lib/server/backend"
import { AUTH_COOKIE_NAME, getAuthToken } from "@/lib/server/auth-cookie"
import {
  taskCreateSchema,
  taskUpdateSchema,
  ulidSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/validations/task"
import type { Task } from "@/types/project"

export type TaskActionResult =
  | { ok: true; task: Task }
  | { ok: false; message: string }

export type TaskMutationResult =
  | { ok: true }
  | { ok: false; message: string }

async function authHeaders(): Promise<Record<string, string> | null> {
  const token = await getAuthToken()
  if (!token) return null
  return { Cookie: `${AUTH_COOKIE_NAME}=${token}` }
}

function mapTaskError(status: number): string {
  switch (status) {
    case 400:
      return "Invalid task information"
    case 401:
      return "Your session has expired, please log in again"
    case 403:
      return "You do not have permission to perform this action"
    case 404:
      return "Task or project not found"
    default:
      return "An error occurred, try again"
  }
}

export async function createTask(
  projectId: string,
  input: TaskCreateInput,
): Promise<TaskActionResult> {
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }
  const parsed = taskCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  // Strip undefined keys so the backend doesn't see `assignee_id: null` on
  // create (API only accepts `null` for update/clear semantics).
  const body: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
  }
  if (parsed.data.status) body.status = parsed.data.status
  if (parsed.data.priority) body.priority = parsed.data.priority
  if (parsed.data.assignee_id) body.assignee_id = parsed.data.assignee_id
  if (parsed.data.due_date) body.due_date = parsed.data.due_date

  let res: Response
  try {
    res = await fetchBackend(
      `/projects/${encodeURIComponent(parsedProjectId.data)}/tasks`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, try again" }
  }

  if (!res.ok) return { ok: false, message: mapTaskError(res.status) }

  const task = (await res.json()) as Task
  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true, task }
}

export async function updateTask(
  taskId: string,
  projectId: string,
  input: TaskUpdateInput,
): Promise<TaskActionResult> {
  const parsedTaskId = ulidSchema.safeParse(taskId)
  if (!parsedTaskId.success) {
    return { ok: false, message: "Invalid task ID" }
  }
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }
  const parsed = taskUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  // We forward the parsed payload AS IS — `null` for nullable fields
  // explicitly clears them on the backend, while omitted fields stay
  // untouched.
  let res: Response
  try {
    res = await fetchBackend(
      `/tasks/${encodeURIComponent(parsedTaskId.data)}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, try again" }
  }

  if (!res.ok) return { ok: false, message: mapTaskError(res.status) }

  const task = (await res.json()) as Task
  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true, task }
}

export async function deleteTask(
  taskId: string,
  projectId: string,
): Promise<TaskMutationResult> {
  const parsedTaskId = ulidSchema.safeParse(taskId)
  if (!parsedTaskId.success) {
    return { ok: false, message: "Invalid task ID" }
  }
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  let res: Response
  try {
    res = await fetchBackend(
      `/tasks/${encodeURIComponent(parsedTaskId.data)}`,
      {
        method: "DELETE",
        headers,
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, try again" }
  }

  if (!res.ok) return { ok: false, message: mapTaskError(res.status) }

  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true }
}
