"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import type { ActionState } from "@/types/auth"
import { loginSchema, registerSchema } from "@/lib/validations/auth"
import { fetchBackend } from "@/lib/server/backend"
import {
  AUTH_COOKIE_NAME,
  getAuthToken,
  clearAuthToken,
} from "@/lib/server/auth-cookie"

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { success: false, message: firstError.message }
  }

  const res = await fetchBackend("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  })

  if (!res.ok) {
    if (res.status === 401) {
      return { success: false, message: "E-posta veya şifre hatalı" }
    }
    return { success: false, message: "Bir hata oluştu, tekrar deneyin" }
  }

  const setCookieHeader = res.headers.getSetCookie()
  if (setCookieHeader.length > 0) {
    const cookieStore = await cookies()
    for (const rawCookie of setCookieHeader) {
      const parts = rawCookie.split(";").map((p) => p.trim())
      const [nameValue] = parts
      const [name, ...valueParts] = nameValue.split("=")
      const value = valueParts.join("=")

      const options: Record<string, unknown> = {}
      for (const part of parts.slice(1)) {
        const [key, val] = part.split("=")
        const k = key.toLowerCase().trim()
        if (k === "path") options.path = val
        if (k === "max-age") options.maxAge = parseInt(val)
        if (k === "httponly") options.httpOnly = true
        if (k === "secure") options.secure = true
        if (k === "samesite")
          options.sameSite = val.toLowerCase() as "lax" | "strict" | "none"
      }

      cookieStore.set(name, value, options)
    }
  }

  redirect("/")
}

export async function register(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { success: false, message: firstError.message }
  }

  const res = await fetchBackend("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  })

  if (!res.ok) {
    if (res.status === 409) {
      return { success: false, message: "Bu e-posta adresi zaten kayıtlı" }
    }
    if (res.status === 400) {
      return { success: false, message: "Geçersiz bilgiler, kontrol edin" }
    }
    return { success: false, message: "Bir hata oluştu, tekrar deneyin" }
  }

  return {
    success: true,
    message: "Hesap oluşturuldu! Giriş yapabilirsiniz.",
  }
}

export async function logout(): Promise<void> {
  const token = await getAuthToken()

  await fetchBackend("/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `${AUTH_COOKIE_NAME}=${token}` } : {}),
    },
  })

  await clearAuthToken()
  redirect("/login")
}
