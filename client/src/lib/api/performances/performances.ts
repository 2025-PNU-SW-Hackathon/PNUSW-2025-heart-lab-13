import { API_BASE } from '@/src/lib/api/_config'
import type {
  PerformanceRequestBody,
  PerformanceResponseBody,
  PerformanceListResponse
} from './types'

// PUT /performances
export async function putPerformance(
  body: PerformanceRequestBody
): Promise<PerformanceResponseBody> {
  const res = await fetch(`${API_BASE}/performances`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `HTTP ${res.status}: 성과 업데이트 실패`)
  }
  return res.json()
}

// GET /performances?page=..&limit=..
export async function fetchPerformances(
  page: number = 1,
  limit: number = 10
): Promise<PerformanceListResponse> {
  const base = `${API_BASE}/performances`
  const url = new URL(base)
  if (Number.isFinite(page) && page >= 1) url.searchParams.set('page', String(page))
  if (Number.isFinite(limit) && limit >= 1 && limit <= 10)
    url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `HTTP ${res.status}: 성과 목록 조회 실패`)
  }
  return res.json()
}

// GET /performances/{id}
export async function fetchPerformanceDetail(id: string): Promise<PerformanceResponseBody> {
  if (!id) throw new Error('성과 ID는 필수입니다.')
  const res = await fetch(`${API_BASE}/performances/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `HTTP ${res.status}: 성과 상세 조회 실패`)
  }
  return res.json()
}

// DELETE /performances/{id}
export async function deletePerformance(id: string): Promise<void> {
  if (!id) throw new Error('성과 ID는 필수입니다.')
  const res = await fetch(`${API_BASE}/performances/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `HTTP ${res.status}: 성과 삭제 실패`)
  }
}
