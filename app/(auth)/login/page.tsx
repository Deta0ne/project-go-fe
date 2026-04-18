import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Giriş Yap",
}

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
        <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
      </div>
      <LoginForm />
    </div>
  )
}
