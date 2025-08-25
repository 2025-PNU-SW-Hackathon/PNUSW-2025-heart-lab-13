// src/components/editor/policy/sanitize.ts
import DOMPurify from 'dompurify'
import {
  SANITIZE_SAVE_CONFIG as BASE_SANITIZE_SAVE_CONFIG,
  SANITIZE_EXTERNAL_CONFIG as BASE_SANITIZE_EXTERNAL_CONFIG,
  sanitizeHtml
} from '@/src/lib/sanitize/config'

export const SANITIZE_SAVE_CONFIG = BASE_SANITIZE_SAVE_CONFIG
export const SANITIZE_EXTERNAL_CONFIG = BASE_SANITIZE_EXTERNAL_CONFIG

export const sanitize = (html: string) => sanitizeHtml(html)

export const sanitizeExternalHtml = (html: string): string =>
  DOMPurify.sanitize(html, SANITIZE_EXTERNAL_CONFIG) as unknown as string

export const sanitizeForSave = (html: string): string =>
  DOMPurify.sanitize(html, SANITIZE_SAVE_CONFIG) as unknown as string
