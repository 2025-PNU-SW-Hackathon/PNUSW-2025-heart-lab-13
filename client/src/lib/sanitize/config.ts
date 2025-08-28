// src/lib/sanitize/config.ts
import DOMPurify, { Config as DpConfig } from 'dompurify'

// 저장용: 우리 칩에 필요한 속성들을 보존
export const SANITIZE_SAVE_CONFIG: DpConfig = {
  USE_PROFILES: { html: true },
  ALLOW_DATA_ATTR: true,
  ADD_TAGS: ['svg', 'path', 'rect', 'g'],
  ADD_ATTR: [
    'style',
    'contenteditable',
    'data-type',
    'data-id',
    'data-number',
    'data-url',
    'data-state',
    'data-source-id',
    'target',
    'rel',
    'class',
    'width',
    'height',
    'viewBox',
    'fill',
    'fill-rule',
    'clip-rule',
    'd',
    'xmlns',
    // SVG stroke/positional attributes
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'rx',
    'x',
    'y',
    // img attributes
    'src',
    'alt',
    'loading',
    'decoding'
  ]
}

// 외부 입력(붙여넣기 등) 정화용: 보수적으로
export const SANITIZE_EXTERNAL_CONFIG: DpConfig = {
  USE_PROFILES: { html: true }
}

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, SANITIZE_SAVE_CONFIG)
