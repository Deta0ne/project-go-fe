import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/server/auth-cookie"

const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)
  const { pathname } = request.nextUrl

  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!token && !authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
