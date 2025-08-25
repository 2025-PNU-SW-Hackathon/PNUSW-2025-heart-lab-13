/* ---------- 타입 ---------- */

export interface GithubOrg {
  name: string // 조직 login 또는 name  (예: heart-lab-kr)
  avatarUrl: string
}

export interface GithubOrgsResponse {
  count: number
  orgs: GithubOrg[]
}

export interface GithubUser {
  id: number
  name: string
  avatarUrl: string
}

export interface GithubPull {
  id: number
  number: number
  title: string
  description: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  closedAt: string | null
  assignees: GithubUser[]
  state: 'open' | 'closed' | 'merged'
  url: string
  sourceId: string
}

export interface GithubPullsResponse {
  count: number
  prs: GithubPull[]
}

export interface GithubLabel {
  id: number
  name: string
  description: string
  color: string
}

export interface GithubBranch {
  label: string
  ref: string
}

export interface GithubPullDetail {
  id: number
  number: number
  title: string
  description: string
  createdAt: string // ISO-8601
  updatedAt: string
  mergedAt: string | null
  closedAt: string | null
  state: 'open' | 'closed' | 'merged'
  url: string
  assignees: GithubUser[]
  labels: GithubLabel[]
  base: GithubBranch
  head: GithubBranch
  mergedBy: GithubUser | null
  sourceId: string
}
