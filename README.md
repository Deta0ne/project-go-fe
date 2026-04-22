# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Environment variables

- `BACKEND_API_URL` — base URL of the Go backend (default:
  `http://localhost:8080`). Used by:
  - RSC / Server Actions (via `lib/server/backend.ts`) to talk to the backend
    directly from the Next.js server.
  - `next.config.mjs` rewrites that proxy chat endpoints
    (`/projects/:id/messages`, `/projects/:id/ws`, `/messages/:id`) from the
    browser through the Next.js server to the backend. This keeps the browser
    same-origin with the FE so existing auth cookies (set on the FE domain by
    the login Server Action) are sent automatically, including on the
    WebSocket upgrade.
- `NEXT_PUBLIC_BACKEND_URL` — optional override for the browser to reach the
  backend cross-origin (e.g. production without a reverse proxy). When unset,
  the browser uses relative paths that hit the Next.js rewrites described
  above. When set, the backend must be configured with `ALLOWED_ORIGINS`
  including the FE origin, `COOKIE_SAMESITE=None`, and `COOKIE_SECURE=true`.
