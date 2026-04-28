"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AGENT_HANDLE } from "@/lib/agent"

const MAX_LENGTH = 4000
const AGENT_MENTION_BUTTON_CLASS =
  "h-7 rounded-full border border-stone-200 px-3 text-xs text-stone-600 hover:bg-stone-50"

interface ChatComposerProps {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
}

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [mentionCursor, setMentionCursor] = useState<{ start: number, end: number, query: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const trimmed = value.trim()
  const isDisabled = hydrated ? Boolean(disabled) || sending : false
  const canSend = !isDisabled && trimmed.length > 0
  const mentionPrefix = `@${AGENT_HANDLE} `

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
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void submit()
  }

  const updateMentionState = (val: string, cursorPosition: number) => {
    const beforeCursor = val.slice(0, cursorPosition)
    const match = beforeCursor.match(/(?:^|\s)(@\w*)$/)
    const targetHandle = `@${AGENT_HANDLE}`.toLowerCase()
    
    if (match && targetHandle.startsWith(match[1].toLowerCase()) && match[1].toLowerCase() !== targetHandle) {
      setMentionCursor({
        start: beforeCursor.lastIndexOf(match[1]),
        end: cursorPosition,
        query: match[1],
      })
    } else {
      setMentionCursor(null)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setValue(val)
    updateMentionState(val, e.target.selectionStart)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionCursor && e.key === "Tab") {
      e.preventDefault()
      const val = value
      const newValue = val.slice(0, mentionCursor.start) + mentionPrefix + val.slice(mentionCursor.end)
      setValue(newValue)
      setMentionCursor(null)
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
        const newCursor = mentionCursor.start + mentionPrefix.length
        textareaRef.current?.setSelectionRange(newCursor, newCursor)
      })
      return
    }

    if (e.key === "Escape" && mentionCursor) {
      setMentionCursor(null)
      e.stopPropagation()
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      if (mentionCursor) {
        e.preventDefault()
        const val = value
        const newValue = val.slice(0, mentionCursor.start) + mentionPrefix + val.slice(mentionCursor.end)
        setValue(newValue)
        setMentionCursor(null)
        requestAnimationFrame(() => {
          textareaRef.current?.focus()
          const newCursor = mentionCursor.start + mentionPrefix.length
          textareaRef.current?.setSelectionRange(newCursor, newCursor)
        })
        return
      }
      e.preventDefault()
      void submit()
    }
  }

  const handleAskAgent = () => {
    if (isDisabled || value.trim().length > 0) return
    setValue(mentionPrefix)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(
        mentionPrefix.length,
        mentionPrefix.length,
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end justify-center gap-2">
        <div className="relative flex-1">
          {mentionCursor && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-56 rounded-md border border-stone-200 bg-white shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3 py-1.5 text-xs font-semibold text-stone-500 bg-stone-50 border-b border-stone-100 rounded-t-md uppercase tracking-wider">
                Agents
              </div>
              <div 
                className="px-3 py-2 text-sm text-stone-900 cursor-pointer hover:bg-stone-50 flex items-center gap-2 transition-colors rounded-b-md"
                onClick={() => {
                  const val = value
                  const newValue = val.slice(0, mentionCursor.start) + mentionPrefix + val.slice(mentionCursor.end)
                  setValue(newValue)
                  setMentionCursor(null)
                  requestAnimationFrame(() => {
                    textareaRef.current?.focus()
                    const newCursor = mentionCursor.start + mentionPrefix.length
                    textareaRef.current?.setSelectionRange(newCursor, newCursor)
                  })
                }}
              >
                <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center text-xs font-bold text-white">
                  {AGENT_HANDLE[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium leading-none">{AGENT_HANDLE}</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-stone-200 bg-stone-100 px-1.5 font-mono text-[10px] font-medium text-stone-500">
                    Tab
                  </kbd>
                </div>
              </div>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onSelect={handleSelect}
            onKeyUp={handleSelect}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={`Write a message... Tip: type @${AGENT_HANDLE} to ask the project agent`}
            maxLength={MAX_LENGTH}
            disabled={isDisabled}
            rows={2}
            className="min-h-12 w-full resize-none"
          />
        </div>
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
      <div className="flex justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAskAgent}
          disabled={isDisabled || value.trim().length > 0}
          className={AGENT_MENTION_BUTTON_CLASS}
          aria-label={`Ask ${AGENT_HANDLE}`}
        >
          Ask @{AGENT_HANDLE}
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
