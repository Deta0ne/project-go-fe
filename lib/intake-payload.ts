import { z } from "zod/v4"

/**
 * Backend's `POST /projects` accepts only `{ name, description }`. To carry
 * the extra intake answers (team, estimated duration) without changing the
 * backend contract we serialize them as JSON into the `description` field.
 *
 * Wire example:
 *   {
 *     "name": "Yeni proje",
 *     "description": "{\"description\":\"...\",\"team\":\"...\",\"estimatedDuration\":\"...\"}"
 *   }
 */

export const intakePayloadSchema = z.object({
  description: z.string(),
  team: z.string(),
  estimatedDuration: z.string(),
})

export type IntakePayload = z.infer<typeof intakePayloadSchema>

export function encodeIntakePayload(payload: IntakePayload): string {
  return JSON.stringify(payload)
}

export type DecodeResult =
  | { ok: true; data: IntakePayload }
  | { ok: false; raw: string }

/**
 * Safe parse: any failure (invalid JSON, missing fields, legacy plain-text
 * descriptions from older projects) falls back to the raw string so the UI
 * can still display something meaningful.
 */
export function decodeIntakePayload(raw: string): DecodeResult {
  if (!raw) return { ok: false, raw: "" }

  try {
    const parsed: unknown = JSON.parse(raw)
    const result = intakePayloadSchema.safeParse(parsed)
    if (result.success) return { ok: true, data: result.data }
    return { ok: false, raw }
  } catch {
    return { ok: false, raw }
  }
}
