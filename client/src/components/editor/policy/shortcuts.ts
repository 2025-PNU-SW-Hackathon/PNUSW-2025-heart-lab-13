// src/components/editor/policy/shortcuts.ts
// 키보드 단축규칙 모음 (예: "- " → "• ")

import type React from 'react'

export type ShortcutContext = {
  editor: HTMLElement
  selection: Selection
  emit: () => void
}

export type ShortcutHandler = (e: React.KeyboardEvent, ctx: ShortcutContext) => boolean

const NBSP = '\u00A0'

// 유틸: 현재 커서가 속한 블록 찾기
function getClosestBlock(node: Node, root: HTMLElement): HTMLElement | null {
  let el: Node | null = node
  while (el && el !== root) {
    if (el instanceof HTMLElement) {
      const tag = el.tagName
      if (tag === 'DIV' || tag === 'P' || tag === 'LI') return el
      if (el.parentElement === root) return el
    }
    el = el.parentNode
  }
  return root
}

// 유틸: 블록 시작부터 range 시작까지 텍스트
function getTextFromStartOf(block: HTMLElement, range: Range): string {
  const r = document.createRange()
  r.selectNodeContents(block)
  r.setEnd(range.startContainer, range.startOffset)
  return r.toString()
}

function deletePreviousDash(range: Range) {
  const { startContainer, startOffset } = range
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer as Text
    const value = textNode.nodeValue ?? ''
    if (startOffset > 0 && value.charAt(startOffset - 1) === '-') {
      const r = range.cloneRange()
      r.setStart(textNode, startOffset - 1)
      r.setEnd(textNode, startOffset)
      r.deleteContents()
      return
    }
  }
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    null
  )
  let lastText: Text | null = null
  ;(walker as TreeWalker & { currentNode: Node }).currentNode = range.startContainer
  while (walker.previousNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      lastText = walker.currentNode as Text
      break
    }
  }
  if (lastText) {
    const val = lastText.nodeValue ?? ''
    if (val.endsWith('-')) {
      const r = range.cloneRange()
      r.setStart(lastText, val.length - 1)
      r.setEnd(lastText, val.length)
      r.deleteContents()
    }
  }
}

function insertTextAtSelection(text: string) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  range.deleteContents()
  const textNode = document.createTextNode(text)
  range.insertNode(textNode)
  const after = document.createRange()
  after.setStartAfter(textNode)
  after.collapse(true)
  sel.removeAllRanges()
  sel.addRange(after)
}

// 규칙: "-" + Space → "  • " (앞 2칸 NBSP, 뒤 1칸 NBSP)
export const dashToBullet: ShortcutHandler = (e, { editor, selection, emit }) => {
  if (e.key !== ' ') return false
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  if (!range) return false
  const block = getClosestBlock(range.startContainer, editor) || editor
  const beforeText = getTextFromStartOf(block, range)
  if (!/^\s*-$/.test(beforeText)) return false
  e.preventDefault()
  deletePreviousDash(range)
  insertTextAtSelection(`${NBSP}${NBSP}•${NBSP}`) // NBSP 적용
  emit()
  return true
}

// 규칙: Tab → NBSP 2칸 들여쓰기
export const tabToIndent: ShortcutHandler = (e, { emit }) => {
  if (e.key !== 'Tab') return false
  e.preventDefault()
  insertTextAtSelection(`${NBSP}${NBSP}`)
  emit()
  return true
}

// 기존 단축키 배열에 추가
export const defaultShortcuts: ShortcutHandler[] = [
  dashToBullet,
  tabToIndent // Tab 단축키 추가
]

export function handleKeydownShortcuts(
  e: React.KeyboardEvent,
  ctx: ShortcutContext,
  list: ShortcutHandler[] = defaultShortcuts
) {
  for (const handler of list) {
    const handled = handler(e, ctx)
    if (handled) return true
  }
  return false
}
