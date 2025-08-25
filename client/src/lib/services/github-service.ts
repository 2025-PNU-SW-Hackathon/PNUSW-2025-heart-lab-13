// lib/services/github-service.ts
import { fetchGithubOrgs, fetchGithubPulls } from '@/src/lib/api/github/github'
import { fetchGithubPullDetail } from '@/src/lib/api/github/github'
import type {
  GithubOrg,
  GithubPull,
  GithubPullDetail,
  GithubOrgsResponse,
  GithubPullsResponse
} from '@/src/lib/api/github/types'
import { yearMonthToIso } from '../utils/date'
import { OrgPullsOptions } from '../types/pull-requests'

// 간단 PR 리스트 캐시
export class PullRequestCache {
  private map = new Map<string, GithubPull[]>()
  get(key: string) {
    return this.map.get(key)
  }
  set(key: string, value: GithubPull[]) {
    this.map.set(key, value)
  }
  clear() {
    this.map.clear()
  }
}

// Org 목록 로드 (login/slug 사용)
export const loadGithubOrganizations = async (): Promise<{
  organizations: GithubOrg[]
  totalCount: number
  firstOrgLogin?: string
}> => {
  const res: GithubOrgsResponse = await fetchGithubOrgs()
  const orgs = res.orgs.map((o) => {
    // GitHub API에서 login 필드가 포함될 수 있음
    const orgWithLogin = o as GithubOrg & { login?: string }
    return { ...o, login: orgWithLogin.login ?? o.name }
  })
  return {
    organizations: orgs,
    totalCount: res.count ?? orgs.length,
    firstOrgLogin: orgs[0]?.login
  }
}

// Org의 PR 목록 로드
export const loadOrganizationPullRequests = async (
  orgLogin: string,
  opts: OrgPullsOptions = {}
): Promise<{ pullRequests: GithubPull[]; totalCount: number }> => {
  const startIso = opts.startDate
    ? new Date(opts.startDate).toISOString()
    : yearMonthToIso(opts.fromYM)

  const endIso = opts.endDate ? new Date(opts.endDate).toISOString() : yearMonthToIso(opts.toYM)

  // 둘 다 있을 때만 순서 검증
  if (startIso && endIso && new Date(startIso) > new Date(endIso)) {
    throw new Error('startDate는 endDate보다 이후일 수 없습니다.')
  }

  const res: GithubPullsResponse = await fetchGithubPulls(orgLogin, {
    ...(startIso ? { startDate: startIso } : {}),
    ...(endIso ? { endDate: endIso } : {})
  })
  return {
    pullRequests: res.prs,
    totalCount: res.count ?? res.prs.length
  }
}

// PR 상세 캐시 및 로드
type Hit<T> = { value: T; fresh: boolean }
const now = () => Date.now()
const keyOf = (owner: string, repo: string, prNumber: number) => `${owner}/${repo}#${prNumber}`

class PullRequestDetailCache {
  private ttlMs: number
  private max: number
  private map = new Map<string, { value: GithubPullDetail; ts: number }>()

  constructor({ ttlMs = 5 * 60 * 1000, max = 200 } = {}) {
    this.ttlMs = ttlMs
    this.max = max
  }

  get(key: string): Hit<GithubPullDetail> | null {
    const entry = this.map.get(key)
    if (!entry) return null
    const fresh = now() - entry.ts < this.ttlMs
    // LRU 효과: 읽으면 맨 뒤로
    this.map.delete(key)
    this.map.set(key, entry)
    return { value: entry.value, fresh }
  }

  set(key: string, value: GithubPullDetail) {
    if (this.map.size >= this.max) {
      const firstKey = this.map.keys().next().value
      if (firstKey) this.map.delete(firstKey)
    }
    this.map.set(key, { value, ts: now() })
  }
}

export const prDetailCache = new PullRequestDetailCache({ ttlMs: 5 * 60 * 1000, max: 300 })

// 캐시 선조회 → 없거나 만료면 패치해서 채우기
export const loadPullRequestDetailCached = async (
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ value: GithubPullDetail; fromCache: boolean; fresh: boolean }> => {
  const key = keyOf(owner, repo, prNumber)
  const hit = prDetailCache.get(key)
  if (hit?.fresh) return { value: hit.value, fromCache: true, fresh: true }

  const value = await fetchGithubPullDetail(owner, repo, prNumber)
  prDetailCache.set(key, value)
  return { value, fromCache: !!hit, fresh: true }
}

// 배경 최신화용(선 즉시 표시 + 뒤에서 갱신하고 싶을 때)
export const revalidatePullRequestDetail = async (
  owner: string,
  repo: string,
  prNumber: number
) => {
  const key = keyOf(owner, repo, prNumber)
  const value = await fetchGithubPullDetail(owner, repo, prNumber)
  prDetailCache.set(key, value)
}

// PR 상세 로드 (캐시 없이 바로)
export const loadPullRequestDetail = async (
  owner: string,
  repo: string,
  prNumber: number
): Promise<GithubPullDetail> => {
  return fetchGithubPullDetail(owner, repo, prNumber)
}
