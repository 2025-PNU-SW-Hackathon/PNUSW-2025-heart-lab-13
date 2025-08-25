'use client'

import type { StateCreator } from 'zustand'
import type { AppStore } from '../user-store'
import type { ServiceKey } from '@/src/lib/constants/services'

// 서비스 탭 선택 상태
export interface ServiceSlice {
  selected: ServiceKey
  setSelected: (s: ServiceKey) => void
}

export const createServiceSlice: StateCreator<AppStore, [], [], ServiceSlice> = (set) => ({
  selected: 'Github',
  setSelected: (s) => set({ selected: s })
})
