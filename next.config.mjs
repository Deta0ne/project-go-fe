/** @type {import('next').NextConfig} */
const BACKEND_URL = (
  process.env.BACKEND_API_URL ?? "http://localhost:8080"
).replace(/\/+$/, "")

const nextConfig = {
  async rewrites() {
    // Forward chat endpoints to the Go backend so the browser can call them
    // same-origin. Only explicit sub-paths are rewritten — existing FE routes
    // under /projects (list, detail, create) are not affected.
    return [
      {
        source: "/projects/:id/messages",
        destination: `${BACKEND_URL}/projects/:id/messages`,
      },
      {
        source: "/projects/:id/ws",
        destination: `${BACKEND_URL}/projects/:id/ws`,
      },
      {
        source: "/messages/:messageId",
        destination: `${BACKEND_URL}/messages/:messageId`,
      },
    ]
  },
}

export default nextConfig
