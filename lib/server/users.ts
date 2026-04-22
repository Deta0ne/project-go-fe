import "server-only"

import { fetchBackend } from "@/lib/server/backend"
import type { User } from "@/types/project"

export async function fetchUser(id: string): Promise<User | null> {
  if (!id) return null
  try {
    const res = await fetchBackend(`/users/${encodeURIComponent(id)}`)
    if (!res.ok) return null
    return (await res.json()) as User
  } catch {
    return null
  }
}

export async function fetchUsersByIds(
  ids: readonly string[],
): Promise<Map<string, User>> {
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return new Map()

  const results = await Promise.all(unique.map((id) => fetchUser(id)))
  const map = new Map<string, User>()
  results.forEach((user, idx) => {
    if (user) map.set(unique[idx], user)
  })
  return map
}
