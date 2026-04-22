import { z } from "zod/v4"

import { ulidSchema } from "@/lib/validations/task"

// Add member accepts member / co_owner only — owner can only be set via
// ownership transfer (see updateMemberRole semantics in the backend docs).
export const memberAddSchema = z.object({
  user_id: ulidSchema,
  role: z.enum(["member", "co_owner"]),
})

export type MemberAddInput = z.infer<typeof memberAddSchema>

// Update can set any role, including `owner` (which triggers an ownership
// transfer on the backend — the caller automatically becomes co_owner).
export const memberRoleSchema = z.enum(["owner", "co_owner", "member"])
export type MemberRole = z.infer<typeof memberRoleSchema>
