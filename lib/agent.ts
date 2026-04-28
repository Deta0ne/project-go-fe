export const DEFAULT_AGENT_USER_ID = "01J000000000000000SAMARIT"
export const DEFAULT_AGENT_USER_EMAIL = "samaritan@agent.local"
export const DEFAULT_AGENT_HANDLE = "Samaritan"

export const AGENT_USER_ID =
  process.env.NEXT_PUBLIC_AGENT_USER_ID?.trim() || DEFAULT_AGENT_USER_ID
export const AGENT_USER_EMAIL =
  process.env.NEXT_PUBLIC_AGENT_USER_EMAIL?.trim() || DEFAULT_AGENT_USER_EMAIL
export const AGENT_HANDLE =
  process.env.NEXT_PUBLIC_AGENT_HANDLE?.trim() || DEFAULT_AGENT_HANDLE
export const AGENT_DISPLAY_NAME = AGENT_HANDLE

export interface AgentMentionSegment {
  text: string
  isMention: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function createMentionPattern(flags: string): RegExp {
  return new RegExp(`(^|\\s)(@${escapeRegExp(AGENT_HANDLE)}\\b)`, flags)
}

export function isAgentMessage(m: { user_id: string; user_email?: string }): boolean {
  return m.user_id === AGENT_USER_ID || m.user_email === AGENT_USER_EMAIL
}

export function hasAgentMention(content: string): boolean {
  return createMentionPattern("i").test(content)
}

export function splitAgentMentions(content: string): AgentMentionSegment[] {
  const pattern = createMentionPattern("gi")
  const segments: AgentMentionSegment[] = []
  let cursor = 0

  for (const match of content.matchAll(pattern)) {
    const leading = match[1] ?? ""
    const mention = match[2] ?? ""
    const start = match.index ?? 0
    const mentionStart = start + leading.length

    if (mentionStart > cursor) {
      segments.push({
        text: content.slice(cursor, mentionStart),
        isMention: false,
      })
    }

    segments.push({ text: mention, isMention: true })
    cursor = mentionStart + mention.length
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), isMention: false })
  }

  return segments.length > 0 ? segments : [{ text: content, isMention: false }]
}
