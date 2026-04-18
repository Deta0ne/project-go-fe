"use client"

import { cn } from "@/lib/utils"

export type OrbState = "idle" | "listening" | "thinking"

// Vivid palettes from the reference — creates the liquid, iridescent look.
const palettes: Record<
  OrbState,
  { bg: string; c1: string; c2: string; c3: string; c4: string; c5: string }
> = {
  idle: {
    bg: "#cff1f4",
    c1: "#9e9fef", // indigo
    c2: "#c471ec", // magenta
    c3: "#9bc761", // green
    c4: "#ccd4f2", // pale blue
    c5: "#f472b6", // pink
  },
  listening: {
    bg: "#fce7f3",
    c1: "#f472b6", // pink
    c2: "#fb7185", // rose
    c3: "#facc15", // yellow
    c4: "#fb923c", // orange
    c5: "#e879f9", // fuchsia
  },
  thinking: {
    bg: "#e0e7ff",
    c1: "#818cf8", // indigo
    c2: "#c084fc", // purple
    c3: "#38bdf8", // sky
    c4: "#a78bfa", // violet
    c5: "#2dd4bf", // teal
  },
}

export function Orb({
  state = "idle",
  size = 104,
}: {
  state?: OrbState
  size?: number
}) {
  // Master speed driver: slow when idle, quicker when listening, fastest when thinking.
  const speed = state === "thinking" ? 2.4 : state === "listening" ? 3.2 : 7

  const colors = palettes[state]

  const blur = Math.max(8, size * 0.14)
  const c1 = size * 0.55
  const c2 = size * 0.4
  const c3 = size * 0.6
  const c4 = size * 0.3
  const c5 = size * 0.36

  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {/* Ambient halo behind the orb */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-6 rounded-full blur-2xl transition-opacity duration-700",
          state === "idle" ? "opacity-50" : "opacity-90"
        )}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--beam-soft), transparent 70%)",
        }}
      />

      {/* Listening — concentric ripples radiating outward */}
      {state === "listening" && (
        <>
          <span
            className="absolute inset-0 rounded-full border border-(--beam)/35"
            style={{ animation: "orb-ripple 2.2s ease-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-full border border-(--beam)/25"
            style={{
              animation: "orb-ripple 2.2s ease-out 0.9s infinite",
            }}
          />
        </>
      )}

      {/* Thinking — a fine arc orbiting the orb */}
      {state === "thinking" && (
        <span
          className="pointer-events-none absolute -inset-2 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--beam) 55deg, transparent 140deg)",
            mask: "radial-gradient(circle, transparent 63%, black 65%, black 67%, transparent 69%)",
            WebkitMask:
              "radial-gradient(circle, transparent 63%, black 65%, black 67%, transparent 69%)",
            animation: "orb-spin 1.6s linear infinite",
          }}
        />
      )}

      {/* The orb itself — a blurred cluster of colored circles */}
      <div
        className="relative h-full w-full overflow-hidden rounded-full transition-colors duration-700"
        style={{
          backgroundColor: colors.bg,
          boxShadow:
            "0 24px 60px -20px rgba(60, 90, 200, 0.28), inset 0 0 0 1px rgba(255,255,255,0.65)",
          animation: `orb-hue ${speed * 2.4}s linear infinite`,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-colors duration-700"
          style={{ filter: `blur(${blur}px)` }}
        >
          <span
            className="absolute rounded-full transition-colors duration-700"
            style={{
              width: c1,
              height: c1,
              backgroundColor: colors.c1,
              opacity: 0.9,
              animation: `orb-drift-1 ${speed}s ease-in-out infinite`,
            }}
          />
          <span
            className="absolute rounded-full transition-colors duration-700"
            style={{
              width: c2,
              height: c2,
              backgroundColor: colors.c2,
              opacity: 0.85,
              animation: `orb-drift-2 ${speed * 1.15}s ease-in-out infinite`,
            }}
          />
          <span
            className="absolute rounded-full transition-colors duration-700"
            style={{
              width: c3,
              height: c3,
              backgroundColor: colors.c3,
              opacity: 0.9,
              animation: `orb-drift-3 ${speed * 0.9}s ease-in-out infinite`,
            }}
          />
          <span
            className="absolute rounded-full transition-colors duration-700"
            style={{
              width: c4,
              height: c4,
              backgroundColor: colors.c4,
              opacity: 0.85,
              animation: `orb-drift-4 ${speed * 1.25}s ease-in-out infinite`,
            }}
          />
          <span
            className="absolute rounded-full transition-colors duration-700"
            style={{
              width: c5,
              height: c5,
              backgroundColor: colors.c5,
              opacity: 0.8,
              animation: `orb-drift-5 ${speed * 0.85}s ease-in-out infinite`,
            }}
          />
        </div>

        {/* Glossy top highlight for dimension */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 55%, transparent 100%)",
          }}
        />
      </div>
    </div>
  )
}
