"use client"

import { useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { removeMember, updateMemberRole } from "@/lib/actions/member"
import {
  canManageMembers,
  canTransferOwnership,
  roleLabel,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { Membership, Role, User } from "@/types/project"

interface MemberRowProps {
  projectId: string
  member: Membership
  user: User | undefined
  myRole: Role | null
  meId: string | null
  totalOwners: number
}

function roleBadgeVariant(role: Role): "info" | "secondary" | "outline" {
  if (role === "owner") return "info"
  if (role === "co_owner") return "secondary"
  return "outline"
}

function Initial({ email }: { email: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600"
    >
      {email.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function MemberRow({
  projectId,
  member,
  user,
  myRole,
  meId,
  totalOwners,
}: MemberRowProps) {
  const [pendingRole, setPendingRole] = useState<Role | null>(null)
  const [transferConfirm, setTransferConfirm] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRolePending, startRoleTransition] = useTransition()
  const [isRemovePending, startRemoveTransition] = useTransition()

  const isMe = member.user_id === meId
  const canManage = canManageMembers(myRole)
  const canTransfer = canTransferOwnership(myRole) && !isMe
  // Can't remove yourself via this control, and can't remove the sole owner.
  const canRemove =
    canManage && !isMe && !(member.role === "owner" && totalOwners <= 1)
  const canChangeRole = canManage && !isMe && member.role !== "owner"

  async function applyRole(nextRole: Role) {
    setError(null)
    const res = await updateMemberRole(projectId, member.user_id, nextRole)
    if (!res.ok) setError(res.message)
  }

  function handleRoleChange(nextValue: string) {
    const nextRole = nextValue as Role
    if (nextRole === member.role) return
    if (nextRole === "owner") {
      if (!canTransfer) return
      setPendingRole(nextRole)
      setTransferConfirm(true)
      return
    }
    startRoleTransition(() => applyRole(nextRole))
  }

  function confirmTransfer(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!pendingRole) return
    startRoleTransition(async () => {
      const res = await updateMemberRole(projectId, member.user_id, pendingRole)
      if (res.ok) {
        setTransferConfirm(false)
        setPendingRole(null)
        return
      }
      setError(res.message)
    })
  }

  function handleRemove(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (isRemovePending) return
    setError(null)
    startRemoveTransition(async () => {
      const res = await removeMember(projectId, member.user_id)
      if (res.ok) {
        setRemoveOpen(false)
        return
      }
      setError(res.message)
    })
  }

  const email = user?.email ?? `${member.user_id.slice(-8)}`

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/70 p-3",
        isMe && "bg-stone-50/80"
      )}
    >
      <Initial email={email} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-stone-800">{email}</p>
          {isMe && <Badge variant="outline">You</Badge>}
        </div>
        <p className="font-mono text-[11px] text-stone-400">{member.user_id}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canChangeRole ? (
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={isRolePending}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="co_owner">Co-owner</SelectItem>
              {canTransfer && (
                <SelectItem value="owner">Owner (transfer)</SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={roleBadgeVariant(member.role)}>
            {roleLabel(member.role)}
          </Badge>
        )}

        {canRemove && (
          <AlertDialog
            open={removeOpen}
            onOpenChange={(next) => {
              if (!next) setError(null)
              setRemoveOpen(next)
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-stone-400 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove member</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">{email}</span>{" "}
                  will be removed from this project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemovePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={isRemovePending}
                >
                  {isRemovePending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isRemovePending ? "Removing" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <AlertDialog
        open={transferConfirm}
        onOpenChange={(next) => {
          if (!next) {
            setPendingRole(null)
            setError(null)
          }
          setTransferConfirm(next)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{email}</span> will
              become the new owner of the project. You will automatically be
              assigned the co-owner role. This action can be undone but must be
              done by the new owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRolePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTransfer}
              disabled={isRolePending}
            >
              {isRolePending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRolePending ? "Transferring" : "Transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && !removeOpen && !transferConfirm && (
        <p className="w-full pt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}
