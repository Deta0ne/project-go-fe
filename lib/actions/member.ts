"use server"

import { revalidatePath } from "next/cache"

import { fetchBackend } from "@/lib/server/backend"
import { AUTH_COOKIE_NAME, getAuthToken } from "@/lib/server/auth-cookie"
import {
  memberAddSchema,
  memberRoleSchema,
  type MemberAddInput,
  type MemberRole,
} from "@/lib/validations/member"
import { ulidSchema } from "@/lib/validations/task"
import type { Membership } from "@/types/project"

export type MemberAddResult =
  | { ok: true; member: Membership }
  | { ok: false; message: string }

export type MemberMutationResult =
  | { ok: true }
  | { ok: false; message: string }

async function authHeaders(): Promise<Record<string, string> | null> {
  const token = await getAuthToken()
  if (!token) return null
  return { Cookie: `${AUTH_COOKIE_NAME}=${token}` }
}

function mapMemberError(status: number): string {
  switch (status) {
    case 400:
      return "Invalid user information"
    case 401:
      return "Your session has expired, please log in again"
    case 403:
      return "You do not have permission to perform this action"
    case 404:
      return "Project or user not found"
    case 409:
      return "This user is already a member of the project or has violated the role rules"
    default:
      return "An error occurred, please try again"
  }
}

export async function addMember(
  projectId: string,
  input: MemberAddInput,
): Promise<MemberAddResult> {
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }
  const parsed = memberAddSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  let res: Response
  try {
    res = await fetchBackend(
      `/projects/${encodeURIComponent(parsedProjectId.data)}/members`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, please try again" }
  }

  if (!res.ok) return { ok: false, message: mapMemberError(res.status) }

  const member = (await res.json()) as Membership
  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true, member }
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: MemberRole,
): Promise<MemberMutationResult> {
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }
  const parsedUserId = ulidSchema.safeParse(userId)
  if (!parsedUserId.success) {
    return { ok: false, message: "Invalid user ID" }
  }
  const parsedRole = memberRoleSchema.safeParse(role)
  if (!parsedRole.success) {
    return { ok: false, message: "Invalid role" }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  let res: Response
  try {
    res = await fetchBackend(
      `/projects/${encodeURIComponent(parsedProjectId.data)}/members/${encodeURIComponent(parsedUserId.data)}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ role: parsedRole.data }),
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, please try again" }
  }

  if (!res.ok) return { ok: false, message: mapMemberError(res.status) }

  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true }
}

export async function removeMember(
  projectId: string,
  userId: string,
): Promise<MemberMutationResult> {
  const parsedProjectId = ulidSchema.safeParse(projectId)
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project ID" }
  }
  const parsedUserId = ulidSchema.safeParse(userId)
  if (!parsedUserId.success) {
    return { ok: false, message: "Invalid user ID" }
  }

  const headers = await authHeaders()
  if (!headers) return { ok: false, message: "You need to be logged in" }

  let res: Response
  try {
    res = await fetchBackend(
      `/projects/${encodeURIComponent(parsedProjectId.data)}/members/${encodeURIComponent(parsedUserId.data)}`,
      {
        method: "DELETE",
        headers,
      },
    )
  } catch {
    return { ok: false, message: "Server is not reachable, please try again" }
  }

  if (!res.ok) return { ok: false, message: mapMemberError(res.status) }

  revalidatePath(`/projects/${parsedProjectId.data}`)
  return { ok: true }
}
