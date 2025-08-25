// src/app/report/page.tsx
'use client'

import Sidebar from '@/src/components/side-bar/side-bar'
import ReportSheet from '@/src/components/report-sheet/report-sheet'
import { useSessionState } from '@/src/lib/hooks/useSessionState'
import { useHydrated } from '@/src/lib/hooks/useHydrated'
import { useEffect, useMemo, useRef } from 'react'
import { fetchPerformances, fetchPerformanceDetail } from '@/src/lib/api/performances/performances'
import type {
  PerformanceListResponse,
  PerformanceReferenceResponse
} from '@/src/lib/api/performances/types'
import { makePrChipHTML } from '@/src/components/editor/pr-chip'

export default function ReportPage() {
  const hydrated = useHydrated()

  const [expandedCardIds, setExpandedCardIds] = useSessionState<string[]>(
    'report:ui:expandedCardIds',
    []
  )
  const [loadingCardId, setLoadingCardId] = useSessionState<string | null>(
    'report:ui:loadingCardId',
    null
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

  // 카드 토글
  const handleToggleCard = async (id: string) => {
    const draftKey = `report:draft:${id}`
    const isExpanded = expandedCardIds.includes(draftKey)

    if (isExpanded) {
      setExpandedCardIds((prev) => prev.filter((v) => v !== draftKey))
      setLoadingCardId(null)
      return
    }

    const existing = sessionStorage.getItem(draftKey)
    if (existing) {
      setExpandedCardIds((prev) => [...prev, draftKey])
      return
    }

    setLoadingCardId(draftKey)
    try {
      const detail = await fetchPerformanceDetail(id)

      const fmt = (s: string | null) => {
        if (!s) return ''
        try {
          return new Date(s).toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      const draft = {
        id: detail.id,
        title: detail.title ?? '',
        startDate: fmt(detail.startDate),
        endDate: fmt(detail.endDate),
        descriptionHtml: convertTextToHtmlWithChips(detail.description || '', detail.references),
        contributionHtml: convertTextToHtmlWithChips(detail.contribution || '', detail.references),
        outcomeHtml: convertTextToHtmlWithChips(detail.outcome || '', detail.references),
        updatedAt: Date.now(),
        isReadonly: true
      }
      sessionStorage.setItem(draftKey, JSON.stringify(draft))
      setExpandedCardIds((prev) => [...prev, draftKey])
    } catch (e) {
      console.error('성과 상세 로드 실패:', e)
      setExpandedCardIds((prev) => [...prev, draftKey])
    } finally {
      setLoadingCardId(null)
    }
  }

  const handleDeletePerformance = (deletedId: string) => {
    setPerfList((prev) => ({ performances: prev.performances.filter((p) => p.id !== deletedId) }))
    const draftKey = `report:draft:${deletedId}`
    setExpandedCardIds((prev) => prev.filter((v) => v !== draftKey))
  }

  const hasList = (perfList?.performances?.length ?? 0) > 0

  return (
    <div className="grid min-h-screen grid-cols-[1512fr_412fr]">
      {/* 좌측 */}
      <div className="flex-1 py-6 px-8 flex flex-col max-h-screen overflow-y-scroll overflow-x-hidden scrollbar-stable">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-extrabold mb-6">Moti</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const key = `report:draft:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
                setExpandedCardIds((prev) => [...prev, key])
              }}
              className="px-4 py-2 border border-border-color text-black rounded-lg transition-colors text-sm font-normal hover:bg-selected-color"
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
              + 새 항목 추가
            </button>
          </div>
        </div>

        {/* 새 항목 카드 (세션에만 존재) */}
        {hydrated &&
          expandedCardIds
            .filter(
              (cardId) =>
                cardId.startsWith('report:draft:') &&
                !perfList.performances.find((p) => `report:draft:${p.id}` === cardId)
            )
            .map((newCardId) => (
              <div
                key={newCardId}
                className="bg-white rounded-lg border border-border-color shadow-sm mb-4 transition-all duration-300"
              >
                <div className="border-b border-border-color bg-blue-50">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-blue-900">새 성과 항목</div>
                  </div>
                </div>
                <div className="p-4">
                  <ReportSheet
                    storageKey={newCardId}
                    onClose={() =>
                      setExpandedCardIds((prev) => prev.filter((id) => id !== newCardId))
                    }
                  />
                </div>
              </div>
            ))}

        {/* 기존 성과 카드 목록 */}
        {hydrated && hasList ? (
          <div className="space-y-4 mb-6">
            {perfList.performances.map((p) => {
              const draftKey = `report:draft:${p.id}`
              const isExpanded = expandedCardIds.includes(draftKey)
              const isLoading = loadingCardId === draftKey

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-lg border border-border-color transition-all duration-300 ${isExpanded ? 'shadow-sm' : 'hover:shadow-sm'}`}
                >
                  <button
                    type="button"
                    className={`w-full p-4 text-left rounded-lg transition-colors ${isLoading ? 'cursor-wait' : 'hover:bg-gray-50'}`}
                    onClick={() => !isLoading && handleToggleCard(p.id as string)}
                    disabled={isLoading}
                    aria-label={`${isLoading ? '로딩 중' : isExpanded ? '축소' : '확장'}: ${(p.title as string) || ''}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
                        e.preventDefault()
                        handleToggleCard(p.id as string)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {(p.title as string) || '제목 없음'}
                        </div>
                        <div className="text-xs text-text-gray">
                          {p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : ''} –{' '}
                          {p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : ''}
                        </div>
                      </div>
                      <div className="ml-4 text-gray-400">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>

                  {isLoading && (
                    <div className="border-t border-border-color">
                      <div className="p-8 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <div className="text-sm text-gray-600 mb-2">데이터를 불러오는 중...</div>
                        <div className="text-xs text-gray-400">잠시만 기다려주세요</div>
                      </div>
                    </div>
                  )}

                  {isExpanded && !isLoading && (
                    <div className="border-t border-border-color">
                      <div className="p-4">
                        <ReportSheet
                          storageKey={draftKey}
                          onClose={() =>
                            setExpandedCardIds((prev) => prev.filter((id) => id !== draftKey))
                          }
                          onDelete={handleDeletePerformance}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 페이지네이션 추후 */}
          </div>
        ) : null}
      </div>

      {/* 우측 */}
      <div className="h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>
    </div>
  )
}
