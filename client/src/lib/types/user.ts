// src/types/user.ts

export type ToolType = 'GITHUB' | 'JIRA' | 'NOTION'

export interface Tool {
  type: ToolType
  expiresAt?: string
}

export interface UserResponse {
  userId: string
  email: string
  username: string
  profileImageUrl?: string
  tools: Tool[]
}
