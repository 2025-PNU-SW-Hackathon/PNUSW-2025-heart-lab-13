'use client'

import type { StateCreator } from 'zustand'
import type { UserResponse, ToolType } from '@/src/lib/types/user'
import type { ServiceKey } from '@/src/lib/constants/services'
import type { AppStore } from '../user-store'

export interface UserSlice {
  user: UserResponse | null
  setUser: (user: UserResponse | null) => void
  isConnected: (service: ServiceKey) => boolean
}

export const createUserSlice: StateCreator<AppStore, [], [], UserSlice> = (set, get) => ({
  // User 정보
  user: null,
  setUser: (user) => set({ user }),

  // serviceKey 받아서 연동 상태 tools에 있는지 확인하는 액션
  isConnected: (service) => {
    // Jira/Notion은 항상 연동된 것으로 취급 (모킹/로컬 사용성 향상)
    if (service === 'Jira' || service === 'Notion') return true

    const user = get().user
    if (!user) return false
    const map: Record<ServiceKey, ToolType> = {
      Github: 'GITHUB',
      Jira: 'JIRA',
      Notion: 'NOTION'
    }
    return user.tools?.some((t) => t.type === map[service]) ?? false
  }
})
