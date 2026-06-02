"use client"

import { useEffect, useRef, useState } from "react"
import { Orb } from "@/components/orb-example"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function LandingInteractive({ greeting }: { greeting: string }) {
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      setMousePos({ x, y })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="relative flex w-full flex-col items-center justify-center pt-20 pb-32">
      {/* Background Parallax Layers */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(139,156,247,0.15)_0%,transparent_50%)]"
        style={{
          transform: `translateY(${scrollY * 0.4}px) translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
      transition: "transform 0.1s ease-out"
        }} 
      />

      <section
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        style={{
          transform: `translateY(${scrollY * 0.1}px) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
      transition: "transform 0.1s ease-out"
        }}
      >
      <div className="composer-intro mb-10 relative">
        {/* Subtle glow behind orb */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
        <Orb size={180} />
      </div>

      <span className="text-blur-intro mb-6 rounded-full border border-primary/30 bg-primary/5 px-5 py-1.5 text-xs font-semibold tracking-[0.25em] text-primary backdrop-blur-md shadow-[0_0_15px_rgba(139,156,247,0.15)]">
        MEET SAMARITAN
      </span>

      <h1
        className="text-blur-intro bg-linear-to-b from-foreground via-foreground/90 to-primary/80 bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-7xl lg:text-8xl drop-shadow-sm"
        style={{ animationDelay: "100ms" }}
      >
        {greeting}
      </h1>

      <p
        className="text-blur-intro mt-8 max-w-2xl text-lg text-muted-foreground/90 md:text-xl leading-relaxed"
        style={{ animationDelay: "300ms" }}
      >
        Describe your project once. Samaritan turns it into a roadmap, tasks,
        and team chat in moments.
      </p>

      <div
        className="text-blur-intro mt-12 flex flex-col items-center gap-4 sm:flex-row"
        style={{ animationDelay: "500ms" }}
      >
        <Button
          asChild
          size="lg"
          className="group relative overflow-hidden rounded-full px-8 h-12 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,156,247,0.4)] hover:scale-105"
        >
          <Link href="/register">
            <span className="relative z-10 font-medium">Get started</span>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="ghost"
          className="rounded-full px-8 h-12 border border-transparent hover:border-border/50 hover:bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
        >
          <Link href="/login">See how it works</Link>
        </Button>
      </div>
    </section>
    </div >
  )
}
