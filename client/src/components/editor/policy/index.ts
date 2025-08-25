// src/components/editor/policy/index.ts
import type { ShortcutHandler } from './shortcuts'
import { defaultShortcuts, handleKeydownShortcuts } from './shortcuts'
import {
  SANITIZE_SAVE_CONFIG,
  SANITIZE_EXTERNAL_CONFIG,
  sanitize,
  sanitizeExternalHtml,
  sanitizeForSave
} from './sanitize'

export type Policy = {
  shortcuts: ShortcutHandler[]
  sanitizeSaveConfig: typeof SANITIZE_SAVE_CONFIG
  sanitizeExternalConfig: typeof SANITIZE_EXTERNAL_CONFIG
  sanitize: typeof sanitize
  sanitizeExternalHtml: typeof sanitizeExternalHtml
  sanitizeForSave: typeof sanitizeForSave
}

export const defaultPolicy: Policy = {
  shortcuts: defaultShortcuts,
  sanitizeSaveConfig: SANITIZE_SAVE_CONFIG,
  sanitizeExternalConfig: SANITIZE_EXTERNAL_CONFIG,
  sanitize,
  sanitizeExternalHtml,
  sanitizeForSave
}

export { handleKeydownShortcuts }
export * from './shortcuts'
export * from './sanitize'
export * from './chips'
