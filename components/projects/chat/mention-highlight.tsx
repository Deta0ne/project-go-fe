"use client"

import { splitAgentMentions } from "@/lib/agent"

interface MentionHighlightProps {
  content: string
  mentionClassName: string
}

export function MentionHighlight({
  content,
  mentionClassName,
}: MentionHighlightProps) {
  return (
    <>
      {splitAgentMentions(content).map((segment, index) =>
        segment.isMention ? (
          <span key={`${segment.text}-${index}`} className={mentionClassName}>
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}
