export interface ChatMessage {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  edited_at?: string | null
  user_email: string
  user_username?: string
}
