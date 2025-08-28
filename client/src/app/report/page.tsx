// src/app/report/page.tsx
'use client'

import Sidebar from '@/src/components/side-bar/side-bar'
import ReportSheet from '@/src/components/report-sheet/report-sheet'
import { useSessionState } from '@/src/lib/hooks/useSessionState'
import { useHydrated } from '@/src/lib/hooks/useHydrated'
import { useEffect, useMemo, useRef } from 'react'
import { fetchPerformances } from '@/src/lib/api/performances/performances'
import type {
  PerformanceListResponse,
  PerformanceReferenceResponse
} from '@/src/lib/api/performances/types'
import { makePrChipHTML } from '@/src/components/editor/pr-chip'
import Logo from '@/src/components/icons/logo-icon'
import Plus from '@/src/components/icons/plus'

export default function ReportPage() {
  const hydrated = useHydrated()

  const [expandedCardIds, setExpandedCardIds] = useSessionState<string[]>(
    'report:ui:expandedCardIds',
    []
  )

  // 세션스토리지는 "새로고침 시 복원" 용도이므로, didFetchList는 reload에서만 의미 있도록 쓸 것
  const [didFetchList, setDidFetchList] = useSessionState<boolean>('report:ui:didFetchList', false)
  const [perfList, setPerfList] = useSessionState<Pick<PerformanceListResponse, 'performances'>>(
    'report:ui:perfList',
    { performances: [] }
  )

  // 네비게이션 타입: reload면 세션스토리지를 믿고, 아니면 무조건 서버에서 새로 가져오기
  const isReloadNav = (() => {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return false
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    return nav?.type === 'reload'
  })()

  // 칩 렌더링 유틸
  const convertTextToHtmlWithChips = useMemo(
    () =>
      (text: string, references: PerformanceReferenceResponse[] = []) => {
        if (!text) return ''
        return text.replace(/\{pr-chip-([^}]+)\}/g, (match, sourceId) => {
          const ref = references.find((r) => r.sourceId === sourceId)
          const data = ref?.data as
            | { number: number; title: string; url: string; state: string }
            | undefined
          if (!ref || ref.sourceType !== 'GITHUB_PULL_REQUEST' || !data) return match
          return makePrChipHTML({
            number: data.number,
            title: data.title,
            url: data.url,
            state: data.state,
            sourceId: ref.sourceId
          })
        })
      },
    []
  )

  // fetch 중복 방지 ref
  const fetchedOnceRef = useRef(false)

  useEffect(() => {
    if (!hydrated) return

    // dev StrictMode 및 상태 변경으로 인한 재실행 방지
    if (fetchedOnceRef.current) return

    // reload라면: 세션에 이미 가져온 적(didFetchList) 있으면 스킵
    if (isReloadNav && didFetchList) return

    // 여기까지 왔으면 이번 렌더 사이클에서 '한 번만' fetch
    fetchedOnceRef.current = true
    ;(async () => {
      try {
        const { performances } = await fetchPerformances()
        setPerfList({ performances })
      } catch (e) {
        console.error('성과 목록 조회 실패:', e)
      } finally {
        // 새로고침 시 재방문에서 가드로 쓰이게 true 세팅
        setDidFetchList(true)
      }
    })()
  }, [hydrated, isReloadNav, didFetchList, setPerfList, setDidFetchList])

  // 기존 카드 토글 로직 제거됨. 접힘/펼침은 ReportSheet 내부에서 관리합니다.

  const handleDeletePerformance = (deletedId: string) => {
    setPerfList((prev) => ({ performances: prev.performances.filter((p) => p.id !== deletedId) }))
    const draftKey = `report:draft:${deletedId}`
    setExpandedCardIds((prev) => prev.filter((v) => v !== draftKey))
  }

  const hasList = (perfList?.performances?.length ?? 0) > 0

  return (
    <div className="grid min-h-screen grid-cols-[1512fr_430fr]">
      {/* 좌측 */}
      <div className="flex-1 py-6 px-8 flex flex-col max-h-screen overflow-y-scroll overflow-x-hidden scrollbar-hide">
        <div className="flex-shrink-0">
          <Logo />
          <div className="mt-[26px] mb-[15px] flex items-center gap-4">
            <button
              onClick={() => {
                const key = `report:draft:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
                setExpandedCardIds((prev) => [...prev, key])
              }}
              className="px-[35px] py-4 h-[45px] flex border justify-center items-center border-gray-300 rounded-lg transition-colors hover:bg-selected-color gap-[15px] shadow-[0px_3px_8px_-1px_rgba(0,0,0,0.12)]"
              type="button"
              aria-label="새 항목 추가하기"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  const key = `report:draft:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
                  setExpandedCardIds((prev) => [...prev, key])
                }
              }}
            >
              <span className="justify-center text-black text-base font-normal">
                새 항목 추가하기
              </span>
              <Plus />
            </button>
          </div>
        </div>

        {/* 새 항목 시트 (세션에만 존재) */}
        {hydrated &&
          expandedCardIds
            .filter(
              (cardId) =>
                cardId.startsWith('report:draft:') &&
                !perfList.performances.find((p) => `report:draft:${p.id}` === cardId)
            )
            .map((newCardId) => (
              <ReportSheet
                key={newCardId}
                storageKey={newCardId}
                onClose={() => setExpandedCardIds((prev) => prev.filter((id) => id !== newCardId))}
                initialCollapsed={false}
              />
            ))}

        {/* 기존 성과 시트 목록 */}
        {hydrated && hasList ? (
          <div className="space-y-4 mb-6">
            {perfList.performances.map((p) => {
              const draftKey = `report:draft:${p.id}`
              return (
                <ReportSheet
                  key={p.id}
                  storageKey={draftKey}
                  entityId={p.id as string}
                  initialCollapsed={true}
                  onDelete={handleDeletePerformance}
                />
              )
            })}

            {/* 페이지네이션 추후 */}
          </div>
        ) : null}
      </div>

      {/* 우측 */}
      <div className="h-screen sticky top-0 flex-shrink-0 scrollbar-hide">
        <Sidebar />
      </div>
    </div>
  )
}
