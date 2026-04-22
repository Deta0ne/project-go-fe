import { z } from "zod/v4"

export const projectIntakeSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(120, "Project name must be less than 120 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
})

export type ProjectIntakeInput = z.infer<typeof projectIntakeSchema>

// Project edit dialog always sends all four fields — name + the three
// intake fields — which the server action repacks into the backend's
// `{ name, description: JSON.stringify(...) }` shape.
export const projectUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(120, "Project name must be less than 120 characters"),
  description: z
    .string()
    .min(1, "Description must be at least 1 character")
    .max(6000, "Description must be less than 6000 characters"),
  team: z
    .string()
    .min(1, "Team information must be at least 1 character")
    .max(2000, "Team information must be less than 2000 characters"),
  estimatedDuration: z
    .string()
    .min(1, "Estimated duration must be at least 1 character")
    .max(200, "Estimated duration must be less than 200 characters"),
})

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
