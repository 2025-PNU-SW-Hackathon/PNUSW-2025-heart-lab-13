// src/lib/hooks/useSessionState.ts
'use client'
import { useEffect, useRef, useState } from 'react'

// 오버로드 선언: 초기값이 있으면 [T, ...], 없으면 [T|undefined, ...]
export function useSessionState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>]
export function useSessionState<T = unknown>(
  key: string
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>]

// 구현
export function useSessionState<T>(key: string, initial?: T) {
  const canUseDOM = typeof window !== 'undefined'
  const [hydrated, setHydrated] = useState(false)
  const wroteGuard = useRef(false)

  // 하이드레이션 이후에만 실제 sessionStorage 값을 읽을 예정이지만,
  // 초기값은 렌더를 위해 임시로 넣어둔다.
  type S = T | undefined
  const [state, setState] = useState<S>(() => {
    // SSR/프리렌더: storage 접근 금지
    if (!canUseDOM) return initial as S
    // 클라이언트 첫 렌더 시점에도 즉시 storage를 읽지 않고 initial을 씀
    return initial as S
  })

  useEffect(() => {
    setHydrated(true)
  }, [])

  // 하이드레이션 직후 1회, storage에서 최종 복원
  useEffect(() => {
    if (!hydrated || !canUseDOM) return
    try {
      const raw = sessionStorage.getItem(key)
      if (raw != null) {
        setState(JSON.parse(raw) as S)
      } else {
        // 저장된 게 없으면 initial 유지
      }
    } catch {
      // 파싱 실패 등 무시
    }
  }, [hydrated, canUseDOM, key])

  // 하이드레이션 이후부터만 저장 (복원 직후 1틱은 쓰지 않도록 가드)
  useEffect(() => {
    if (!hydrated || !canUseDOM) return
    if (!wroteGuard.current) {
      wroteGuard.current = true
      return
    }
    try {
      if (state === undefined) {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, JSON.stringify(state))
      }
    } catch {
      /* ignore */
    }
  }, [state, hydrated, canUseDOM, key])

  // 오버로드 시그니처 충족을 위해 캐스팅 (호출부에서 initial을 넘기면 T로 추론됨)
  return [
    state as T | undefined,
    setState as React.Dispatch<React.SetStateAction<T | undefined>>
  ] as const
}
