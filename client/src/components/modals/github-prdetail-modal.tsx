// components/modals/pr-detail-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  loadPullRequestDetailCached,
  prDetailCache
  // revalidatePullRequestDetail는 아래에서 직접 구현
} from '@/src/lib/services/github-service'
import type { GithubPullDetail } from '@/src/lib/api/github/types'
import { ArrowStateIcon } from '@/src/components/icons/github-icon'
import PrIcon from '@/src/components/icons/github-icon'

interface PrDetailModalProps {
  isOpen: boolean
  onClose: () => void
  owner: string
  repo: string
  prNumber: number
  position: { x: number; y: number } // 모달 박스 위치(anchor)
  origin: { x: number; y: number } // ★ 모달 오픈 당시 포인터 위치
}

const MOVE_THRESHOLD_PX = 30 // 모달 꺼지는 임계 거리(px)

// stale-while-revalidate을 위한 revalidate 함수
const revalidatePullRequestDetail = async (
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> => {
  // loadPullRequestDetailCached는 내부적으로 fetch 후 캐시 갱신
  await loadPullRequestDetailCached(owner, repo, prNumber)
}

const PrDetailModal = ({
  isOpen,
  onClose,
  owner,
  repo,
  prNumber,
  position,
  origin
}: PrDetailModalProps) => {
  const [prDetail, setPrDetail] = useState<GithubPullDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 데이터 로드 (기존 로직 유지)
  useEffect(() => {
    if (!isOpen) {
      setPrDetail(null)
      setError(null)
      setLoading(false)
      return
    }

    // 필수 파라미터 검증
    if (!owner || !repo || !prNumber || !owner.trim() || !repo.trim() || prNumber <= 0) {
      console.warn(`모달 파라미터 부족: owner="${owner}", repo="${repo}", prNumber=${prNumber}`)
      setPrDetail(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        // 1) 캐시 선조회: 있으면 즉시 표시 (fresh 여부 포함)
        const { value, fromCache, fresh } = await loadPullRequestDetailCached(owner, repo, prNumber)
        if (!cancelled) {
          setPrDetail(value)
          setLoading(false)
        }

        // 2) stale-while-revalidate: 캐시가 있었지만 stale이었다면 조용히 최신화
        if (fromCache && !fresh) {
          try {
            await revalidatePullRequestDetail(owner, repo, prNumber)
            const refreshed = prDetailCache.get(`${owner}/${repo}#${prNumber}`)
            if (!cancelled && refreshed?.value) setPrDetail(refreshed.value)
          } catch (revalidateError) {
            console.warn('백그라운드 갱신 실패:', revalidateError)
            // 조용히 무시(이미 캐시 표시 중)
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('PR 상세 정보 로드 실패:', e)
          const errorMessage =
            e instanceof Error ? e.message : 'PR 상세 정보를 불러오지 못했습니다.'
          setError(errorMessage)
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, owner, repo, prNumber])

  // ★ 포인터 이동 거리 기반 자동 닫기
  useEffect(() => {
    if (!isOpen) return

    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, 120) // 즉시 닫힘 방지용 소량 딜레이

    const handlePointerMove = (e: PointerEvent) => {
      if (!armed) return
      const dx = e.clientX - origin.x
      const dy = e.clientY - origin.y
      if (dx * dx + dy * dy >= MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(armTimer)
    }
  }, [isOpen, origin.x, origin.y, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이가 뒤쪽 인터랙션을 막지 않도록 */}
      <div className="fixed inset-0 z-40 pointer-events-none" />
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md w-80 pointer-events-auto"
        style={{ left: `${position.x - 170}px`, top: `${position.y + 40}px` }}
      >
        {loading && <div className="text-sm text-gray-500 py-4">로딩 중...</div>}
        {error && <div className="text-sm text-red-600 py-2">{error}</div>}

        {prDetail && (
          <div className="space-y-3">
            {/* 날짜 - 맨 위에 gray 색으로 */}
            <div className="text-xs text-gray-400">
              {new Date(prDetail.createdAt).toLocaleDateString()}
            </div>

            {/* 아이콘과 PR title */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <PrIcon
                  state={prDetail.state}
                  size={20}
                  className={
                    prDetail.state === 'open'
                      ? 'text-green-500'
                      : prDetail.state === 'merged'
                        ? 'text-purple-500'
                        : 'text-red-500'
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  #{prDetail.number} {prDetail.title}
                </h3>
                {/* Description */}
                <div>
                  <p className="text-xs text-gray-600 overflow-y-auto">
                    {prDetail.description || '설명이 없습니다.'}
                  </p>
                </div>

                {/* Base <- Head 브랜치 (화살표 사용) */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-gray-600 bg-[#DDF4FF] px-2 py-1 rounded">
                    {prDetail.base.ref}
                  </div>
                  <ArrowStateIcon />
                  <div className="text-xs text-gray-600 bg-[#DDF4FF] px-2 py-1 rounded">
                    {prDetail.head.ref}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default PrDetailModal
