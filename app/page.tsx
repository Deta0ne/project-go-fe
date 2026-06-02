import { BubbleField } from "@/components/chat/bubble-field"
import { Orb } from "@/components/orb-example"
import { Button } from "@/components/ui/button"
import { HERO_GREETING } from "@/lib/constants/intake"
import { getAuthToken } from "@/lib/server/auth-cookie"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const token = await getAuthToken()
  if (token) {
    redirect("/home")
  }

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-6 py-10">
      <BubbleField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,156,247,0.20)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[4px_4px]" />

      <header className="absolute inset-x-6 top-6 z-20 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-foreground/90"
        >
          <span className="rounded-full border border-border/70 p-1">
            <Orb size={12} />
          </span>
          <span className="transition-colors group-hover:text-foreground">
            project-go
          </span>
        </Link>
        <Button asChild variant="ghost" className="rounded-full px-5">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="composer-intro mb-8">
          <Orb size={180} />
        </div>

        <span className="text-blur-intro mb-5 rounded-full border border-border/70 bg-background/40 px-4 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground">
          MEET SAMARITAN
        </span>

        <h1 className="text-blur-intro bg-linear-to-b from-foreground to-primary bg-clip-text text-5xl font-medium tracking-tight text-transparent md:text-7xl">
          {HERO_GREETING}
        </h1>

        <p
          className="text-blur-intro mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: "120ms" }}
        >
          Describe your project once. Samaritan turns it into a roadmap, tasks,
          and team chat in moments.
        </p>

        <div
          className="text-blur-intro mt-10 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "220ms" }}
        >
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full px-8">
            <Link href="/login">See how it works</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
