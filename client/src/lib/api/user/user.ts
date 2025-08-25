import type { UserResponse } from '@/src/lib/types/user'
import { API_BASE } from '../_config'

// 사용자 정보 반환
export async function getMe(): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
