// lib/api/github.ts
import { API_BASE } from '../_config'
import type { GithubOrgsResponse, GithubPullsResponse, GithubPullDetail } from './types'
import { FetchGithubPullsOptions } from '../../types/pull-requests'

// Org 목록
export async function fetchGithubOrgs(): Promise<GithubOrgsResponse> {
  const res = await fetch(`${API_BASE}/tools/github/orgs`, { credentials: 'include' })
  if (!res.ok)
    throw new Error((await res.text()) || `HTTP ${res.status}: GitHub 조직 정보 조회 실패`)
  return res.json()
}

// Org의 PR 목록 (org = login/slug)
export async function fetchGithubPulls(
  orgLogin: string,
  { startDate, endDate, page, limit }: FetchGithubPullsOptions = {} //객페로 받고 바로 구조분해 할당
): Promise<GithubPullsResponse> {
  const url = new URL(`${API_BASE}/tools/github/orgs/${encodeURIComponent(orgLogin)}/pulls`)

  if (startDate) url.searchParams.set('startDate', startDate)
  if (endDate) url.searchParams.set('endDate', endDate)
  if (page) url.searchParams.set('page', String(page))
  if (limit) url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), { credentials: 'include' })

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`GitHub API Error: ${res.status} - ${errorText}`)
    throw new Error(errorText || `HTTP ${res.status}: PR 정보 조회 실패`)
  }
  return res.json()
}

// PR 상세 (owner, repo, **prNumber** 사용)
export async function fetchGithubPullDetail(
  owner: string,
  repo: string,
  prNumber: number
): Promise<GithubPullDetail> {
  if (!owner || !repo || !prNumber) {
    throw new Error('조직/소유자, 레포지토리, PR 번호는 필수입니다.')
  }
  const url = `${API_BASE}/tools/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/pulls/${prNumber}`

  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`GitHub PR Detail API Error: ${res.status} - ${errorText}`)
    console.error(`Failed URL: ${url}`)
    throw new Error(errorText || `HTTP ${res.status}: PR 상세 정보 조회 실패`)
  }
  return res.json()
}
