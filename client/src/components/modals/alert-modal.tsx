'use client'

import BaseModal from './base-modal'

type Variant = 'success' | 'error' | 'info'

type AlertModalProps = {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  variant?: Variant
}

const variantStyles: Record<Variant, { iconColor: string; button: string }> = {
  success: {
    iconColor: 'text-green-500',
    button: 'border border-border-color text-black hover:bg-main-gray'
  },
  error: {
    iconColor: 'text-red-500',
    button: 'border border-border-color text-black hover:bg-main-gray'
  },
  info: {
    iconColor: 'text-blue-500',
    button: 'border border-border-color text-black hover:bg-main-gray'
  }
}

export default function AlertModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  onConfirm,
  variant = 'info'
}: AlertModalProps) {
  const styles = variantStyles[variant]

  return (
    <BaseModal isOpen={isOpen} onClose={onConfirm}>
      <div className="flex items-center gap-3 mb-4">
        <svg
          className={`w-6 h-6 ${styles.iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {variant === 'success' && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          )}
          {variant === 'error' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          )}
          {variant === 'info' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
            />
          )}
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-2 whitespace-pre-line">{message}</p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-sm transition-colors ${styles.button}`}
        >
          {confirmText}
        </button>
      </div>
    </BaseModal>
  )
}
