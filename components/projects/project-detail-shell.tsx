"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatTab } from "@/components/projects/chat/chat-tab"
import { MembersTab } from "@/components/projects/members-tab"
import { OverviewTab } from "@/components/projects/overview-tab"
import { RoadmapTab } from "@/components/projects/roadmap-tab"
import { TasksTab } from "@/components/projects/tasks-tab"
import type {
  Membership,
  Project,
  Roadmap,
  Role,
  Task,
  User,
} from "@/types/project"

const TABS = ["overview", "tasks", "roadmap", "members", "chat"] as const
type Tab = (typeof TABS)[number]

function asTab(value: string | null): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "overview"
}

interface ProjectDetailShellProps {
  project: Project
  roadmap: Roadmap | null
  tasks: readonly Task[]
  members: readonly Membership[]
  // Plain record instead of a Map because client components are serialized
  // across the RSC boundary and Maps aren't supported there.
  usersById: Record<string, User>
  role: Role | null
  meId: string | null
}

export function ProjectDetailShell({
  project,
  roadmap,
  tasks,
  members,
  usersById,
  role,
  meId,
}: ProjectDetailShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = asTab(searchParams.get("tab"))

  // Convert the plain record back into a Map for ergonomic `.get()` access
  // inside child components.
  const users = useMemo(() => {
    const m = new Map<string, User>()
    Object.entries(usersById).forEach(([id, u]) => m.set(id, u))
    return m
  }, [usersById])

  const changeTab = useCallback(
    (next: string) => {
      const tab = asTab(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", tab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return (
    <Tabs value={active} onValueChange={changeTab} className="flex-1">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks">
          Tasks
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {tasks.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        <TabsTrigger value="members">
          Members
          {members.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {members.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-4">
        <OverviewTab project={project} roadmap={roadmap} />
      </TabsContent>

      <TabsContent value="tasks" className="pt-4">
        <TasksTab
          projectId={project.id}
          tasks={tasks}
          members={members}
          users={users}
          role={role}
          meId={meId}
        />
      </TabsContent>

      <TabsContent value="roadmap" className="pt-4">
        <RoadmapTab
          projectId={project.id}
          roadmap={roadmap}
          tasks={tasks}
          role={role}
          members={members}
          users={users}
        />
      </TabsContent>

      <TabsContent value="members" className="pt-4">
        <MembersTab
          projectId={project.id}
          members={members}
          users={users}
          role={role}
          meId={meId}
        />
      </TabsContent>

      <TabsContent value="chat" className="pt-4">
        <ChatTab
          projectId={project.id}
          meId={meId}
          meEmail={meId ? (users.get(meId)?.email ?? null) : null}
          meUsername={meId ? (users.get(meId)?.username ?? null) : null}
          role={role}
        />
      </TabsContent>
    </Tabs>
  )
}
