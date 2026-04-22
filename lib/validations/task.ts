import { z } from "zod/v4"

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i

export const ulidSchema = z.string().regex(ULID_REGEX, "Invalid ID")

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"])
export const taskPrioritySchema = z.enum(["low", "medium", "high"])

export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .default(""),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  // Empty string means "no assignee" on create — backend expects the field
  // to be absent rather than null.
  assignee_id: z
    .union([ulidSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  // ISO date-time string. Empty string → undefined (no due date).
  due_date: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>

// Update supports 3-state PATCH semantics for nullable fields: omit means
// "leave as is", a value means "set", and explicit `null` means "clear".
// We model the nullable fields as `string | null | undefined` so the UI
// can send `null` to clear them.
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignee_id: z
    .union([ulidSchema, z.null()])
    .optional(),
  due_date: z
    .union([z.string().min(1, "Date must be at least 1 character"), z.null()])
    .optional(),
})

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
