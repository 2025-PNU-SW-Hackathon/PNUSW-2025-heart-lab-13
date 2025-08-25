'use client'

import React from 'react'

type BaseModalProps = {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
  overlayClassName?: string
  panelClassName?: string
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  overlayClassName = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50',
  panelClassName = 'bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg'
}: BaseModalProps) {
  if (!isOpen) return null

  return (
    <div
      className={overlayClassName}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName}>{children}</div>
    </div>
  )
}
