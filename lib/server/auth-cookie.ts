import "server-only"

import { cookies } from "next/headers"

export const AUTH_COOKIE_NAME = "auth_token_project_go_be"

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null
}

export async function setAuthToken(
  token: string,
  maxAgeSeconds: number,
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  })
}

export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

function base64UrlDecode(segment: string): string {
  const padded =
    segment.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (segment.length % 4)) % 4)
  return Buffer.from(padded, "base64").toString("utf8")
}

/**
 * Reads the current user's id from the auth JWT payload without verifying
 * the signature — the backend still enforces auth on every request, we only
 * need the id for UI-level role gating (e.g. "am I the owner?").
 *
 * Returns null when the cookie is missing or the payload can't be decoded.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const token = await getAuthToken()
  if (!token) return null

  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      sub?: unknown
      user_id?: unknown
    }
    const sub =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.user_id === "string"
          ? payload.user_id
          : null
    return sub
  } catch {
    return null
  }
}
