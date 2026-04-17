import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Kayıt Ol",
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kayıt Ol</h1>
        <p className="text-sm text-muted-foreground">
          Yeni bir hesap oluşturun
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
