'use client'

import BaseModal from './base-modal'

type ConfirmModalProps = {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({
  isOpen,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onCancel}>
      <div className="flex items-center gap-3 mb-4">
        <svg
          className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-gray-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 border border-border-color hover:bg-main-gray rounded-sm transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-sm transition-colors ${
            danger
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </BaseModal>
  )
}
