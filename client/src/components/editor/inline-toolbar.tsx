'use client'

import React from 'react'

type Props = {
  visible: boolean
  x: number
  y: number
  onBold: () => void
  onItalic: () => void
}

export default function InlineToolbar({ visible, x, y, onBold, onItalic }: Props) {
  if (!visible) return null
  return (
    <div
      id="rn-mini-toolbar"
      role="toolbar"
      aria-label="텍스트 서식 도구"
      className="absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 bg-white shadow-md"
      style={{ left: x, top: y }}
      onMouseDown={(e) => {
        // 마우스 다운 시 포커스 이동으로 인해 selection이 사라지는 것을 방지
        e.preventDefault()
      }}
    >
      <div className="flex items-center">
        <button
          type="button"
          tabIndex={0}
          aria-label="굵게"
          onClick={onBold}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onBold()
          }}
          className="px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          B
        </button>
        <button
          type="button"
          tabIndex={0}
          aria-label="기울임"
          onClick={onItalic}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onItalic()
          }}
          className="px-2 py-1 text-sm italic text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          I
        </button>
      </div>
    </div>
  )
}
