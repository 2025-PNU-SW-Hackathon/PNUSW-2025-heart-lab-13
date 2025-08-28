'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import RichNote, { sanitize } from '@/src/components/editor/rich-note'
import { useSessionState } from '@/src/lib/hooks/useSessionState'
import {
  putPerformance,
  deletePerformance,
  fetchPerformanceDetail
} from '@/src/lib/api/performances/performances'
import { extractPrChipReferences, makePrChipHTML } from '@/src/components/editor/pr-chip'
import type {
  PerformanceRequestBody,
  PerformanceResponseBody,
  PerformanceSourceType
} from '@/src/lib/api/performances/types'
import type { PerformanceReferenceResponse } from '@/src/lib/api/performances/types'
import ConfirmModal from '@/src/components/modals/confirm-modal'
import { PerformanceCategory } from '@/src/lib/types/perfomance'
import PerformanceGrid from './performace-grid'
import Circle from '../icons/circle-icon'
import { PERFORMANCE_CATEGORIES } from '@/src/lib/constants/performance-categories'
import DualLoader from '@/src/components/loaders/dual-loader'
import { useAppStore } from '@/src/store/user-store'
import { evaluatePerformance } from '@/src/lib/api/performances/performances'
import mapEvaluationToCategories from '@/src/lib/utils/evaluation'

interface ReportSheetProps {
  storageKey: string
  onClose?: () => void
  onDelete?: (id: string) => void
  isReadonly?: boolean
  entityId?: string
  initialCollapsed?: boolean
}

type ReportDraft = {
  id?: string
  title: string
  startDate: string
  endDate: string
  descriptionHtml: string
  contributionHtml: string
  outcomeHtml: string
  updatedAt: number
  isReadonly?: boolean
}

const EMPTY: ReportDraft = {
  id: undefined,
  title: '',
  startDate: '',
  endDate: '',
  descriptionHtml: '',
  contributionHtml: '',
  outcomeHtml: '',
  updatedAt: 0,
  isReadonly: false
}

export default function ReportSheet({
  storageKey,
  onClose,
  onDelete,
  isReadonly: propReadonly,
  entityId,
  initialCollapsed
}: ReportSheetProps) {
  const [draft, setDraft] = useSessionState<ReportDraft>(storageKey)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isRunningAI, setIsRunningAI] = useState(false)
  const [isAiDone, setIsAiDone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [isCollapsed, setIsCollapsed] = useSessionState<boolean>(
    `${storageKey}:collapsed`,
    initialCollapsed ?? true
  )
  const username = useAppStore((s) => s.user?.username) ?? '사용자'

  const safe = draft ?? EMPTY
  const isReadonly = propReadonly ?? false

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const patch = useCallback(
    (p: Partial<ReportDraft>) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        setDraft((prev) => {
          const base = prev ?? EMPTY
          return {
            ...base,
            ...p,
            updatedAt: Date.now()
          }
        })
      }, 30)
    },
    [setDraft]
  )

  const patchNow = useCallback(
    (p: Partial<ReportDraft>) => {
      setDraft((prev) => {
        const base = prev ?? EMPTY
        return { ...base, ...p, updatedAt: Date.now() }
      })
    },
    [setDraft]
  )

  const clearSession = (key: string) => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  // 서버에서 가져온 텍스트에 PR 칩을 복원
  const convertTextToHtmlWithChips = useCallback(
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

  const handleToggleCollapse = async () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    if (!next) return
    if (draft || !entityId) return
    setIsLoading(true)
    try {
      const detail = await fetchPerformanceDetail(entityId)
      const fmt = (s: string | null) => {
        if (!s) return ''
        try {
          return new Date(s).toISOString().split('T')[0]
        } catch {
          return ''
        }
      }
      const nextDraft: ReportDraft = {
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
      setDraft(nextDraft)
    } catch (e) {
      console.error('성과 상세 로드 실패:', e)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * HTML을 최소한의 마크업으로 정리
   */
  const cleanHtml = (html: string): string => {
    const el = document.createElement('div')
    el.innerHTML = sanitize(html)

    // 모든 요소의 style 속성 제거
    el.querySelectorAll('*').forEach((elem) => {
      elem.removeAttribute('style')
      elem.removeAttribute('class')
      // 필요한 data 속성만 유지 (PR 칩용)
      if (elem.tagName !== 'A' || elem.getAttribute('data-type') !== 'github_pr') {
        Array.from(elem.attributes).forEach((attr) => {
          if (
            attr.name.startsWith('data-') &&
            !['data-type', 'data-number', 'data-url', 'data-state', 'data-source-id'].includes(
              attr.name
            )
          ) {
            elem.removeAttribute(attr.name)
          }
        })
      }
    })

    // 빈 span 태그 제거
    el.querySelectorAll('span').forEach((span) => {
      if (!span.textContent?.trim() && !span.querySelector('*')) {
        span.remove()
      }
    })

    return el.innerHTML
  }

  /**
   * HTML 태그를 유지하면서 스타일만 제거하고 PR 칩을 플레이스홀더로 변환
   */
  const toSimpleHtmlWithChipPlaceholders = (html: string) => {
    const el = document.createElement('div')
    el.innerHTML = cleanHtml(html)

    // PR 칩을 플레이스홀더로 변환
    const chips = el.querySelectorAll('a[data-type="github_pr"]')
    chips.forEach((chip) => {
      const sourceId = chip.getAttribute('data-source-id')
      if (sourceId) {
        const placeholder = document.createTextNode(`{pr-chip-${sourceId}}`)
        chip.replaceWith(placeholder)
      }
    })

    // innerHTML을 반환하여 HTML 태그 유지!
    return el.innerHTML
  }

  /**
   * 평문 변환 (서식 완전 제거)
   */
  const toPlainTextWithChipPlaceholders = (html: string) => {
    const el = document.createElement('div')
    el.innerHTML = sanitize(html)

    // PR 칩을 {pr-chip-sourceId} 형태로 변환
    const chips = el.querySelectorAll('a.gh-pr-chip[data-type="github_pr"]')
    chips.forEach((chip) => {
      const sourceId = chip.getAttribute('data-source-id')
      if (sourceId) {
        const placeholder = `{pr-chip-${sourceId}}`
        chip.replaceWith(document.createTextNode(placeholder))
      }
    })

    return (el.textContent || '').trim()
  }

  const handleSave = async () => {
    const currentDraft = draft ?? EMPTY

    // 모든 HTML 필드에서 PR 칩 references 추출
    const allReferences = [
      ...extractPrChipReferences(currentDraft.descriptionHtml),
      ...extractPrChipReferences(currentDraft.contributionHtml),
      ...extractPrChipReferences(currentDraft.outcomeHtml)
    ]

    // 중복 제거
    const uniqueReferences = allReferences
      .filter((ref, index, self) => index === self.findIndex((r) => r.sourceId === ref.sourceId))
      .map((ref) => ({
        sourceType: ref.sourceType as PerformanceSourceType,
        sourceId: ref.sourceId
      }))

    // 서버가 지원하는 형식에 따라 선택
    // 옵션 1: 최소한의 HTML 서식 유지 (bold, italic만)
    const useSimpleHtml = true // 이 값을 서버 지원에 따라 변경

    const requestBody: PerformanceRequestBody = {
      id: currentDraft.id,
      title: currentDraft.title,
      startDate: currentDraft.startDate,
      endDate: currentDraft.endDate,
      // 서버가 간단한 HTML을 지원하면 toSimpleHtmlWithChipPlaceholders 사용
      // 평문만 지원하면 toPlainTextWithChipPlaceholders 사용
      description: useSimpleHtml
        ? toSimpleHtmlWithChipPlaceholders(currentDraft.descriptionHtml)
        : toPlainTextWithChipPlaceholders(currentDraft.descriptionHtml),
      contribution: useSimpleHtml
        ? toSimpleHtmlWithChipPlaceholders(currentDraft.contributionHtml)
        : toPlainTextWithChipPlaceholders(currentDraft.contributionHtml),
      outcome: useSimpleHtml
        ? toSimpleHtmlWithChipPlaceholders(currentDraft.outcomeHtml)
        : toPlainTextWithChipPlaceholders(currentDraft.outcomeHtml),
      references: uniqueReferences
    }

    try {
      const res: PerformanceResponseBody = await putPerformance(requestBody)

      // 서버가 평문을 반환하므로 HTML은 로컬에서만 유지
      setDraft((prev) => {
        const base = prev ?? EMPTY
        return {
          ...base,
          id: base.id ?? res.id,
          // HTML은 그대로 유지 (서식 보존)
          // 서버는 평문만 저장하므로 로컬 HTML을 유지
          isReadonly: true,
          updatedAt: Date.now()
        }
      })

      setShowSaveSuccess(true)
      setTimeout(() => {
        setShowSaveSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('성과 저장 실패:', err)
      throw err
    }
  }

  const handleCancelClick = () => {
    const currentDraft = draft ?? EMPTY
    if (currentDraft.id) {
      setShowDeleteConfirm(true)
    } else {
      handleCancel()
    }
  }

  const handleCancel = async () => {
    clearSession(storageKey)
    setDraft(undefined)
    onClose?.()
  }

  const handleConfirmDelete = async () => {
    const currentDraft = draft ?? EMPTY

    if (currentDraft.id) {
      try {
        await deletePerformance(currentDraft.id)
        onDelete?.(currentDraft.id)
      } catch (err) {
        console.error('성과 삭제 실패:', err)
      }
    }

    setShowDeleteConfirm(false)
    handleCancel()
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleEdit = () => {
    setDraft((prev) => {
      const base = prev ?? EMPTY
      return {
        ...base,
        isReadonly: false,
        updatedAt: Date.now()
      }
    })
  }

  const handleRunAi = async () => {
    if (showGrid) return
    if (isRunningAI) return
    setIsRunningAI(true)
    setIsAiDone(false)
    setShowGrid(false)

    const currentDraft = draft ?? EMPTY
    if (currentDraft.id) {
      try {
        const evaluationData = await evaluatePerformance(currentDraft.id)
        const mapped = mapEvaluationToCategories(evaluationData)
        setCategories(mapped)
        setIsAiDone(true)
        setShowGrid(true)
      } catch (err) {
        console.error('성과 평가 요청 실패:', err)
      } finally {
        setIsRunningAI(false)
      }
    }
  }

  // 응답 기반 전환으로 변경되어 타이머 제거
  useEffect(() => {}, [isRunningAI])

  // 응답 완료 시 바로 그리드 표시 (별도 타이머 제거)
  useEffect(() => {}, [isAiDone])

  const [categories, setCategories] = useState<PerformanceCategory[]>(
    PERFORMANCE_CATEGORIES.map((c) => ({ ...c, icon: <Circle /> }))
  )

  const handleCategoryToggle = (id: string, isExpanded: boolean) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, isExpanded } : cat)))
  }

  return (
    <div
      className={`w-full border border-main-gray rounded-lg mr-5 mb-5 relative ${
        isReadonly ? 'bg-selected-color' : 'bg-white'
      }`}
    >
      {/* 저장 완료 알림 */}
      {showSaveSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          저장 완료
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="삭제 확인"
        message={'이 성과를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.'}
        confirmText="삭제"
        cancelText="취소"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* 접기/펼치기 헤더 */}
      <button
        type="button"
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
          isLoading ? 'cursor-wait' : 'hover:bg-gray-50'
        }`}
        onClick={handleToggleCollapse}
        disabled={isLoading}
        aria-label={`${isLoading ? '로딩 중' : isCollapsed ? '확장' : '축소'}: ${
          safe.title || '제목 없음'
        }`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggleCollapse()
          }
        }}
      >
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {safe.title || '제목 없음'}
          </div>
          <div className="text-xs text-text-gray">
            {safe.startDate ? new Date(safe.startDate).toISOString().split('T')[0] : ''} –{' '}
            {safe.endDate ? new Date(safe.endDate).toISOString().split('T')[0] : ''}
          </div>
        </div>
        <div className="ml-4 text-gray-400">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          ) : (
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : ''}`}
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
      </button>

      {/* 본문: 접힘 영역 */}
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-out border-t border-border-color ${
          isCollapsed ? 'max-h-0' : 'max-h-[5000px]'
        }`}
        aria-expanded={!isCollapsed}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div className="w-1/2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  id="title"
                  type="text"
                  value={safe.title}
                  onChange={(e) => patchNow({ title: e.target.value })}
                  disabled={isReadonly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="프로젝트 제목을 입력하세요"
                  aria-label="프로젝트 제목 입력"
                />
              </div>
            </div>

            {/* 기간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  시작일
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={safe.startDate}
                  onChange={(e) => patch({ startDate: e.target.value })}
                  disabled={isReadonly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  aria-label="시작일 입력"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  종료일
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={safe.endDate}
                  onChange={(e) => patch({ endDate: e.target.value })}
                  disabled={isReadonly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  aria-label="종료일 입력"
                />
              </div>
            </div>
          </div>

          {/* 본문 3섹션: 리치 에디터 */}
          <div className="flex flex-col gap-6 overflow-y-auto">
            <div className="flex flex-col">
              <label className="block text-base font-medium text-gray-700 mb-2">
                설명 (Description)
              </label>
              <RichNote
                value={safe.descriptionHtml}
                onChange={(html) => patch({ descriptionHtml: sanitize(html) })}
                placeholder="설명을 입력하고, 옆 PR을 드래그하여 삽입하세요"
                readonly={isReadonly}
                aria-label="설명 입력"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-base font-medium text-gray-700 mb-2">
                기여 (Contribution)
              </label>
              <RichNote
                value={safe.contributionHtml}
                onChange={(html) => patch({ contributionHtml: sanitize(html) })}
                placeholder="기여 내용을 입력하고, 옆 PR을 드래그하여 삽입하세요"
                readonly={isReadonly}
                aria-label="기여 내용 입력"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-base font-medium text-gray-700 mb-2">
                성과 (Outcome)
              </label>
              <RichNote
                value={safe.outcomeHtml}
                onChange={(html) => patch({ outcomeHtml: sanitize(html) })}
                placeholder="성과를 입력하고, 옆 PR을 드래그하여 삽입하세요"
                readonly={isReadonly}
                aria-label="성과 입력"
              />
            </div>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="px-12 py-3 h-[40px] text-sm text-gray-600 border border-gray-300 leading-none rounded-4xl hover:text-gray-800 hover:bg-main-gray whitespace-nowrap transition-colors"
                  aria-label="삭제"
                >
                  삭제
                </button>
                {isReadonly ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-12  py-3 h-[40px]  border border-main-gray text-sm rounded-4xl leading-none  bg-white hover:bg-main-gray whitespace-nowrap"
                    aria-label="수정"
                  >
                    수정
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-12 py-3 h-[40px] border border-main-gray text-sm rounded-4xl leading-none text-white bg-black whitespace-nowrap"
                    aria-label="저장"
                  >
                    저장
                  </button>
                )}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleRunAi}
                  disabled={isRunningAI}
                  className={`px-12 py-3 h-[40px] rounded-4xl text-sm shadow-md font-medium transition-colors ${
                    isRunningAI
                      ? 'bg-[#E6F0FF] text-[#5C8EFF] cursor-not-allowed'
                      : 'bg-[#C7E3FF] text-[#005CFF] hover:bg-[#1273FF] hover:text-white'
                  }`}
                  aria-label="AI 성과평가 실행하기"
                >
                  {isRunningAI
                    ? isAiDone
                      ? 'AI 성과평가 실행하기'
                      : '분석 중…'
                    : 'AI 성과평가 실행하기'}
                </button>
              </div>
            </div>

            {showGrid && (
              <PerformanceGrid
                categories={categories}
                onCategoryToggle={handleCategoryToggle}
                columns={3}
                gap="md"
              />
            )}

            {/* AI 실행 영역: 그리드가 나타나기 전까지만 표시 */}
            {!showGrid && (
              <div
                className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                  isRunningAI ? 'max-h-[480px]' : 'max-h-0'
                }`}
                aria-live="polite"
                aria-expanded={isRunningAI}
              >
                <div className="mt-8 grid place-items-center rounded-lg p-10">
                  {!isAiDone && <DualLoader label="AI가 성과평가를 준비 중입니다" />}
                  <p className="mt-8 mb-30 text-sm text-black font-medium" aria-live="polite">
                    {isAiDone
                      ? `${username}님의 성과평가가 완료되었습니다!`
                      : '"성과 데이터를 정밀히 분석중입니다......"'}
                  </p>
                </div>
              </div>
            )}
            {/* 본문 컨테이너 종료 */}
          </div>
          {/* p-6 종료 */}
        </div>
        {/* 접힘 영역 종료 */}
      </div>
    </div>
  )
}
