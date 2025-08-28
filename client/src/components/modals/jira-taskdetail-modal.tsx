// components/modals/jira-taskdetail-modal.tsx
'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type JiraTask = {
  id: string
  title: string
  author: string
  epic: string
  createdAt: string
  status: string
}

interface JiraTaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: JiraTask | null
  position: { x: number; y: number }
  origin: { x: number; y: number }
}

const MOVE_THRESHOLD_PX = 30

const JiraTaskDetailModal = ({
  isOpen,
  onClose,
  task,
  position,
  origin
}: JiraTaskDetailModalProps) => {
  // 포인터 이동/ESC 기반 자동 닫기 (Github 모달과 동일 정책)
  useEffect(() => {
    if (!isOpen) return

    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, 120)

    const handlePointerMove = (e: PointerEvent) => {
      if (!armed) return
      const dx = e.clientX - origin.x
      const dy = e.clientY - origin.y
      if (dx * dx + dy * dy >= MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) onClose()
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

  if (!isOpen || !task) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 pointer-events-none" />
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md w-80 pointer-events-auto"
        style={{ left: `${position.x - 170}px`, top: `${position.y + 40}px` }}
        role="dialog"
        aria-label={`Jira task ${task.id} detail`}
        tabIndex={0}
      >
        <div className="space-y-3">
          <div className="text-xs text-gray-400">
            {new Date(task.createdAt).toLocaleDateString()}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {task.id} {task.title}
            </h3>
            <div className="grid grid-cols-3 gap-y-2 text-xs text-gray-700">
              <div className="col-span-1 text-gray-500">담당자</div>
              <div className="col-span-2">{task.author}</div>

              <div className="col-span-1 text-gray-500">상위 항목</div>
              <div className="col-span-2">{task.epic}</div>

              <div className="col-span-1 text-gray-500">상태</div>
              <div className="col-span-2 capitalize">{task.status}</div>
            </div>

            <div className="mt-2">
              <div className="text-[11px] text-gray-500 mb-1">개발</div>
              <div className="flex flex-col gap-1">
                <button
                  className="text-xs text-emerald-700 hover:underline text-left"
                  onClick={onClose}
                  aria-label="브랜치 만들기"
                >
                  ⎇ 브랜치 만들기
                </button>
                <button
                  className="text-xs text-emerald-700 hover:underline text-left"
                  onClick={onClose}
                  aria-label="커밋 만들기"
                >
                  ⎇ 커밋 만들기
                </button>
              </div>
            </div>

            <div className="pt-1 border-t border-gray-100 text-xs text-gray-600">
              보고자: <span className="font-medium">{task.author}</span>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default JiraTaskDetailModal
