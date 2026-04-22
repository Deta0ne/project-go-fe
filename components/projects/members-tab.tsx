"use client"

import { AddMemberForm } from "@/components/projects/members/add-member-form"
import { MemberRow } from "@/components/projects/members/member-row"
import { canManageMembers } from "@/lib/permissions"
import type { Membership, Role, User } from "@/types/project"

interface MembersTabProps {
  projectId: string
  members: readonly Membership[]
  users: ReadonlyMap<string, User>
  role: Role | null
  meId: string | null
}

const ROLE_ORDER: Record<Role, number> = {
  owner: 0,
  co_owner: 1,
  member: 2,
}

export function MembersTab({
  projectId,
  members,
  users,
  role,
  meId,
}: MembersTabProps) {
  const sorted = [...members].sort((a, b) => {
    const byRole = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
    if (byRole !== 0) return byRole
    return a.created_at.localeCompare(b.created_at)
  })

  const totalOwners = members.filter((m) => m.role === "owner").length

  return (
    <div className="flex flex-col gap-5">
      {canManageMembers(role) && <AddMemberForm projectId={projectId} />}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-12 text-center">
          <p className="text-sm text-stone-500">No members yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((member) => (
            <MemberRow
              key={member.user_id}
              projectId={projectId}
              member={member}
              user={users.get(member.user_id)}
              myRole={role}
              meId={meId}
              totalOwners={totalOwners}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
