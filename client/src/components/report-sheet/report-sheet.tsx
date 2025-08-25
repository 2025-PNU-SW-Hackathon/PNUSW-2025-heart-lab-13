'use client'

import { useCallback, useRef, useState } from 'react'
import RichNote, { sanitize } from '@/src/components/editor/rich-note'
import { useSessionState } from '@/src/lib/hooks/useSessionState'
import { putPerformance, deletePerformance } from '@/src/lib/api/performances/performances'
import { extractPrChipReferences } from '@/src/components/editor/pr-chip'
import type {
  PerformanceRequestBody,
  PerformanceResponseBody,
  PerformanceSourceType
} from '@/src/lib/api/performances/types'
import ConfirmModal from '@/src/components/modals/confirm-modal'

interface ReportSheetProps {
  storageKey: string
  onClose?: () => void
  onDelete?: (id: string) => void
  isReadonly?: boolean
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
  isReadonly: propReadonly
}: ReportSheetProps) {
  // ⬇️ initial 미지정: 세션에 있으면 그걸 쓰고, 없으면 undefined
  const [draft, setDraft] = useSessionState<ReportDraft>(storageKey)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      }, 250)
    },
    [setDraft]
  )

  // 추가: 즉시 패치 헬퍼
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

  // HTML을 평문으로 변환하면서 PR 칩을 {pr-chip-sourceId} 형태로 변환
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
    // 최신 상태를 직접 가져오기
    const currentDraft = draft ?? EMPTY

    // 모든 HTML 필드에서 PR 칩 references 추출
    const allReferences = [
      ...extractPrChipReferences(currentDraft.descriptionHtml),
      ...extractPrChipReferences(currentDraft.contributionHtml),
      ...extractPrChipReferences(currentDraft.outcomeHtml)
    ]

    // 중복 제거 (sourceId 기준) 및 타입 변환
    const uniqueReferences = allReferences
      .filter((ref, index, self) => index === self.findIndex((r) => r.sourceId === ref.sourceId))
      .map((ref) => ({
        sourceType: ref.sourceType as PerformanceSourceType,
        sourceId: ref.sourceId
      }))

    const requestBody: PerformanceRequestBody = {
      id: currentDraft.id, // 최초 저장시는 undefined → 서버가 배정
      title: currentDraft.title,
      startDate: currentDraft.startDate,
      endDate: currentDraft.endDate,
      description: toPlainTextWithChipPlaceholders(currentDraft.descriptionHtml),
      contribution: toPlainTextWithChipPlaceholders(currentDraft.contributionHtml),
      outcome: toPlainTextWithChipPlaceholders(currentDraft.outcomeHtml),
      references: uniqueReferences
    }

    try {
      const res: PerformanceResponseBody = await putPerformance(requestBody)
      // 저장 후 단일 업데이트(병합)
      setDraft((prev) => {
        const base = prev ?? EMPTY
        return {
          ...base,
          id: base.id ?? res.id,
          isReadonly: true,
          updatedAt: Date.now()
        }
      })

      // 저장 성공 알림 표시
      setShowSaveSuccess(true)
      setTimeout(() => {
        setShowSaveSuccess(false)
      }, 2000)
    } catch (err) {
      console.error(' 성과 저장 실패:', err)
      throw err
    }
  }

  const handleCancelClick = () => {
    const currentDraft = draft ?? EMPTY

    // 기존 성과인 경우 (ID가 있는 경우) 삭제 확인 다이얼로그 표시
    if (currentDraft.id) {
      setShowDeleteConfirm(true)
    } else {
      // 새 항목인 경우 바로 취소
      handleCancel()
    }
  }

  const handleCancel = async () => {
    // 세션 스토리지에 저장된 초안 삭제
    clearSession(storageKey)
    // 컴포넌트 상태도 초기화(= undefined → safe가 EMPTY로 렌더)
    setDraft(undefined)
    // 시트 닫기
    onClose?.()
  }

  const handleConfirmDelete = async () => {
    const currentDraft = draft ?? EMPTY

    if (currentDraft.id) {
      try {
        await deletePerformance(currentDraft.id)
        // 부모 컴포넌트에 삭제 알림
        onDelete?.(currentDraft.id)
      } catch (err) {
        console.error('❌ 성과 삭제 실패:', err)
        // 삭제 실패 시에도 UI에서는 제거 (사용자 경험 우선)
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

  return (
    <div
      className={`min-h-full w-full border border-main-gray rounded-lg p-6 mr-5 mb-5 relative ${isReadonly ? 'bg-selected-color' : 'bg-white'}`}
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

      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-end justify-between gap-4 mb-4">
          {/* 제목 - 전체 너비의 1/2 정도 */}
          <div className="w-1/2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={safe.title}
              onChange={(e) => patchNow({ title: e.target.value })} // ⬅️ 즉시 업데이트
              disabled={isReadonly}
              className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              placeholder="프로젝트 제목을 입력하세요"
              aria-label="프로젝트 제목 입력"
            />
          </div>

          {/* 버튼들 - 제목 입력창의 하단에 맞춰 정렬 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-main-gray whitespace-nowrap rounded-sm transition-colors"
              aria-label="삭제"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCancelClick()
              }}
            >
              삭제
            </button>
            {isReadonly ? (
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 border border-main-gray text-sm rounded-sm bg-white hover:bg-main-gray whitespace-nowrap"
                aria-label="수정"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleEdit()
                }}
              >
                수정
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 border border-main-gray text-sm rounded-sm hover:bg-main-gray whitespace-nowrap"
                aria-label="저장"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSave()
                }}
              >
                저장
              </button>
            )}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              aria-label="종료일 입력"
            />
          </div>
        </div>
      </div>

      {/* 본문 3섹션: 리치 에디터 */}
      <div className="flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col">
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="description-editor"
          >
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
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="contribution-editor"
          >
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
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="outcome-editor">
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
      </div>
    </div>
  )
}
