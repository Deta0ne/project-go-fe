"use client"

import { useMemo } from "react"

type Bubble = {
  size: number
  left: number
  delay: number
  duration: number
  drift: number
}

// Deterministic-ish seed so the layout doesn't shift between renders
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280
  return x - Math.floor(x)
}

export function BubbleField({ count = 14 }: { count?: number }) {
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      size: 60 + seeded(i, 1) * 180, // 60 - 240px
      left: seeded(i, 2) * 100, // 0 - 100 vw
      delay: seeded(i, 3) * 18, // 0 - 18s
      duration: 22 + seeded(i, 4) * 22, // 22 - 44s
      drift: (seeded(i, 5) - 0.5) * 80, // -40px - 40px
    }))
  }, [count])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ["--drift" as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
