"use client"

import { useState, useTransition } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addMember } from "@/lib/actions/member"

interface AddMemberFormProps {
  projectId: string
}

export function AddMemberForm({ projectId }: AddMemberFormProps) {
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState<"member" | "co_owner">("member")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)

    startTransition(async () => {
      const res = await addMember(projectId, { user_id: userId.trim(), role })
      if (res.ok) {
        setUserId("")
        setRole("member")
        return
      }
      setError(res.message)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white/70 p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-stone-800">Add member</h3>
        <p className="text-xs text-stone-500">
          Copy the user ID and paste it here to invite a user.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member-user-id">User ID</Label>
          <Input
            id="member-user-id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="01K9..."
            required
            maxLength={26}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "member" | "co_owner")}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="co_owner">Co-owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isPending || !userId.trim()}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
