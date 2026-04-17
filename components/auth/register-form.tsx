"use client"

import { useActionState } from "react"
import Link from "next/link"

import type { ActionState } from "@/types/auth"
import { register } from "@/lib/actions/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/auth/submit-button"

const initialState: ActionState = { success: false, message: "" }

export function RegisterForm() {
  const [state, formAction] = useActionState(register, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.success
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {state.message}
          {state.success && (
            <>
              {" "}
              <Link href="/login" className="underline underline-offset-4">
                Giriş Yap
              </Link>
            </>
          )}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <SubmitButton>Kayıt Ol</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Giriş Yap
        </Link>
      </p>
    </form>
  )
}
