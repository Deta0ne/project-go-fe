"use client"

import type React from "react"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { cn } from "@/lib/utils"
import { AnimatedOrb } from "./animated-orb"

interface ComposerProps {
  onSend: (content: string) => void
  onValueChange?: (value: string) => void
  onFocusChange?: (focused: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export function Composer({
  onSend,
  onValueChange,
  onFocusChange,
  disabled,
  placeholder = "Type a message... (Shift+Enter for new line)",
}: ComposerProps) {
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wasDisabledRef = useRef(disabled)

  // Re-focus the textarea whenever the composer transitions from disabled
  // back to enabled — keeps the user typing without an extra click after
  // the assistant finishes its turn.
  useEffect(() => {
    if (wasDisabledRef.current && !disabled) {
      textareaRef.current?.focus()
    }
    wasDisabledRef.current = disabled
  }, [disabled])

  const handleFocus = useCallback(() => {
    setFocused(true)
    onFocusChange?.(true)
  }, [onFocusChange])

  const handleBlur = useCallback(() => {
    setFocused(false)
    onFocusChange?.(false)
  }, [onFocusChange])

  const autosize = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value
      setValue(next)
      onValueChange?.(next)
      autosize()
    },
    [autosize, onValueChange],
  )

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return

    onSend(trimmed)
    setValue("")
    onValueChange?.("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend, onValueChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="composer-intro pointer-events-none fixed right-0 bottom-4 left-0 z-10 px-4">
      <div className="relative max-w-2xl mx-auto pointer-events-auto">
        <div
          data-active={focused}
          className={cn(
            "composer-animated-border",
            "flex items-center gap-2 p-3 bg-white/90 backdrop-blur-sm transition-all duration-200 relative rounded-3xl",
          )}
          style={{
            boxShadow:
              "rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 69, 0.06) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.06) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.06) 0px 6px 6px -3px, rgba(14, 63, 126, 0.06) 0px 12px 12px -6px, rgba(14, 63, 126, 0.06) 0px 24px 24px -12px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400",
              "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              "max-h-[200px] overflow-y-auto",
            )}
            aria-label="Message input"
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "relative h-9 w-9 shrink-0 transition-all rounded-full flex items-center justify-center",
              canSend ? "cursor-pointer hover:scale-105" : "opacity-50 cursor-not-allowed",
            )}
            aria-label="Send message"
          >
            <AnimatedOrb size={36} />
          </button>
        </div>
      </div>
    </div>
  )
}
