export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in_progress" | "done"
export type Role = "owner" | "co_owner" | "member"

export interface User {
  id: string
  email: string
  username?: string
  created_at: string
}

export interface Membership {
  project_id: string
  user_id: string
  role: Role
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  // Backend omits these fields when null (omitempty on the Go side).
  assignee_id?: string
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface RoadmapMilestone {
  title: string
  description: string
  estimated_duration: string
}

export interface RoadmapItem {
  title: string
  description: string
  priority: TaskPriority
  estimated_days: number
  milestone_index: number
  depends_on: string[]
  suggested_role: string
  suggested_assignee_label: string
}

export interface TeamMember {
  name: string
  role: string
}

export interface RoadmapPayload {
  summary: string
  milestones: RoadmapMilestone[]
  items: RoadmapItem[]
  team_members?: TeamMember[]
}

export interface Roadmap {
  project_id: string
  model: string
  payload: RoadmapPayload
  created_at: string
  updated_at: string
}

export interface CreateProjectResponse {
  project: Project
  roadmap: Roadmap
}
