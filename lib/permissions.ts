import type { Membership, Role, Task } from "@/types/project"

export function getMyRole(
  members: readonly Membership[],
  userId: string | null,
): Role | null {
  if (!userId) return null
  const found = members.find((m) => m.user_id === userId)
  return found?.role ?? null
}

export const canEditProject = (role: Role | null): boolean =>
  role === "owner" || role === "co_owner"

export const canDeleteProject = (role: Role | null): boolean =>
  role === "owner"

export const canManageMembers = (role: Role | null): boolean =>
  role === "owner" || role === "co_owner"

export const canRegenerateRoadmap = canEditProject

export const canCreateTask = (role: Role | null): boolean => role !== null

export function canDeleteTask(
  role: Role | null,
  task: Pick<Task, "created_by">,
  userId: string | null,
): boolean {
  if (role === "owner" || role === "co_owner") return true
  return role === "member" && task.created_by === userId
}

export const canEditTask = (role: Role | null): boolean => role !== null

export const canTransferOwnership = (role: Role | null): boolean =>
  role === "owner"

export function roleLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner"
    case "co_owner":
      return "Co-owner"
    case "member":
      return "Member"
  }
}
