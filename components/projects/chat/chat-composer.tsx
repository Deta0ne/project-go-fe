"use client"

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react"
import { Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const MAX_LENGTH = 4000

interface ChatComposerProps {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
}

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const trimmed = value.trim()
  const isDisabled = hydrated ? Boolean(disabled) || sending : false
  const canSend = !isDisabled && trimmed.length > 0

  const submit = async () => {
    if (!canSend) return
    const content = trimmed
    setSending(true)
    setError(null)
    try {
      await onSend(content)
      setValue("")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void submit()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          maxLength={MAX_LENGTH}
          disabled={isDisabled}
          rows={2}
          className="min-h-12 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="h-10 w-10"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>{error ?? "Enter to send · Shift+Enter for newline"}</span>
        <span
          className={
            value.length > MAX_LENGTH - 100 ? "text-stone-500" : undefined
          }
        >
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
    </form>
  )
}
