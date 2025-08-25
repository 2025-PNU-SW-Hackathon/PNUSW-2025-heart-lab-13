'use client'

import type { UserSlice } from './slices/user-slice'
import type { ServiceSlice } from './slices/service-slice'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createUserSlice } from './slices/user-slice'
import { createServiceSlice } from './slices/service-slice'

export type AppStore = UserSlice & ServiceSlice

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createUserSlice(set, get, store),
        ...createServiceSlice(set, get, store)
      }),
      {
        name: 'app-storage',
        // 서비스 탭만 저장
        partialize: (state) => ({ selected: state.selected }),
        version: 1
      }
    ),
    { name: 'app-store', enabled: process.env.NODE_ENV !== 'production' }
  )
)
