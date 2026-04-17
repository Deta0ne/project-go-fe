import "server-only"

const DEFAULT_BACKEND_BASE_URL = "http://localhost:8080"
const REQUEST_TIMEOUT_MS = 8_000

function normalizeBackendBaseUrl(rawUrl: string): string {
  const parsedUrl = new URL(rawUrl)

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Invalid backend URL protocol")
  }

  return parsedUrl.toString().replace(/\/+$/, "")
}

export function getBackendBaseUrl(): string {
  const rawUrl =
    process.env.BACKEND_API_URL?.trim() || DEFAULT_BACKEND_BASE_URL

  try {
    return normalizeBackendBaseUrl(rawUrl)
  } catch (error) {
    console.error(
      "Invalid BACKEND_API_URL. Falling back to default backend URL.",
      error,
    )
    return DEFAULT_BACKEND_BASE_URL
  }
}

export function buildBackendUrl(path: string): string {
  const baseUrl = getBackendBaseUrl()
  return new URL(path, `${baseUrl}/`).toString()
}

export async function fetchBackend(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(buildBackendUrl(path), {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
}
