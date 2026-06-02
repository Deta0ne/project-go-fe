/**
 * Base URL the browser uses to reach the backend.
 *
 * When unset (default), we return an empty string so chat requests are issued
 * as relative paths that hit the Next.js dev/prod server on the same origin.
 * `next.config.mjs` rewrites then forward them to the Go backend. This keeps
 * the browser same-origin with the FE so existing cookie-based auth (set on
 * the FE domain by the login Server Action) continues to work.
 *
 * In deployments where the backend is reached cross-origin directly (e.g.
 * production behind separate domains with CORS + SameSite=None cookies),
 * set NEXT_PUBLIC_BACKEND_URL to the backend origin.
 */
export function getPublicBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
  if (!url) return ""
  return url.replace(/\/+$/, "")
}

export function getPublicBackendWsUrl(): string {
  const http = getPublicBackendUrl()
  if (http) return http.replace(/^http/, "ws")
  if (typeof window === "undefined") return ""
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}`
}
