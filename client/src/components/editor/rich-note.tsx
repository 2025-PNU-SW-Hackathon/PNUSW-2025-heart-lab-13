// src/components/editor/rich-note.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import InlineToolbar from './inline-toolbar'
import { makePrChipHTML, escapeHtml, PrChipData } from './pr-chip'
import {
  defaultPolicy,
  handleKeydownShortcuts,
  getClosestChipElement,
  moveCaretAfterElement,
  moveCaretOutsideChipAtPoint,
  getPreviousAdjacentChip,
  getNextAdjacentChip,
  sanitize as sanitizeHtmlPolicy,
  sanitizeForSave,
  sanitizeExternalHtml
} from './policy'

// ---------- 히스토리(최근 30개) 유틸 ----------
type Snapshot = { html: string; caret: number }

function getCaretTextOffset(root: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0)
  const pre = document.createRange()
  pre.selectNodeContents(root)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length // 루트 시작부터 텍스트 길이
}

function setCaretByTextOffset(root: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let remain = Math.max(0, offset)
  let node: Text | null = null
  while ((node = walker.nextNode() as Text | null)) {
    const len = node.nodeValue?.length ?? 0
    if (remain <= len) {
      const r = document.createRange()
      r.setStart(node, remain)
      r.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
      return
    }
    remain -= len
  }
  // 끝으로 이동
  const r = document.createRange()
  r.selectNodeContents(root)
  r.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(r)
}

class HistoryManager {
  private stack: Snapshot[] = []
  private redo: Snapshot[] = []
  private limit = 30 // 최근 30개만 유지

  push(s: Snapshot) {
    if (this.stack.length && this.stack[this.stack.length - 1].html === s.html) return
    this.stack.push(s)
    if (this.stack.length > this.limit) this.stack.shift()
    this.redo = []
  }
  undo(): Snapshot | null {
    if (this.stack.length <= 1) return null
    const cur = this.stack.pop()!
    this.redo.push(cur)
    return this.stack[this.stack.length - 1]
  }
  redoStep(): Snapshot | null {
    if (!this.redo.length) return null
    const s = this.redo.pop()!
    this.stack.push(s)
    return s
  }
  peek(): Snapshot | null {
    return this.stack.length ? this.stack[this.stack.length - 1] : null
  }
}
// ---------------------------------------------

type Props = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  readonly?: boolean
}

// 외부에서도 쓰기 쉽도록 export
export function sanitize(html: string) {
  return sanitizeHtmlPolicy(html)
}

export default function RichNote({ value, onChange, placeholder, readonly }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 미니 툴바 상태
  const [toolbar, setToolbar] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  })

  // 선택 상태 관리 개선
  const savedSelectionRef = useRef<{
    range: Range
    containerElement: HTMLElement
  } | null>(null)

  // 히스토리 & 디바운스 타이머
  const historyRef = useRef(new HistoryManager())
  const debounceRef = useRef<number | null>(null)
  const scheduleCheckpoint = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => pushCheckpoint(), 250)
  }
  const pushCheckpoint = () => {
    if (!ref.current) return
    historyRef.current.push({
      html: ref.current.innerHTML,
      caret: getCaretTextOffset(ref.current)
    })
  }

  // 최초 값 주입
  useEffect(() => {
    if (!ref.current) return
    if (typeof value === 'string' && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value
    }
    // 초기 스냅샷 1회
    pushCheckpoint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 외부 value 변경 동기화(선택적으로 유지)
  useEffect(() => {
    if (!ref.current) return
    if (typeof value === 'string' && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value
      pushCheckpoint()
    }
  }, [value])

  const emit = () => {
    if (!ref.current || !onChange) return
    onChange(ref.current.innerHTML)
  }

  function insertHTMLAtCursor(html: string) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      ref.current?.insertAdjacentHTML('beforeend', html)
      placeCaretAtEnd(ref.current!)
      emit()
      return
    }
    // 칩 내부로 들어가려는 삽입을 방지: 선택이 칩 내부면 칩 뒤로 이동
    const anchorChip = getClosestChipElement(sel.anchorNode)
    if (anchorChip) {
      moveCaretAfterElement(anchorChip)
    }
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const frag = range.createContextualFragment(html)
    const last = frag.lastChild
    range.insertNode(frag)
    if (last) {
      range.setStartAfter(last)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    emit()
  }

  function placeCaretAtEnd(el: HTMLElement) {
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  // -------- 선택 상태 관리 개선 --------
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !ref.current) return false

    const range = sel.getRangeAt(0)
    // 에디터 내부의 선택인지 확인
    if (!ref.current.contains(range.commonAncestorContainer)) return false

    savedSelectionRef.current = {
      range: range.cloneRange(),
      containerElement: ref.current
    }
    return true
  }, [])

  const restoreSelection = (): boolean => {
    const sel = window.getSelection()
    if (!sel || !savedSelectionRef.current) return false

    try {
      // 저장된 범위가 여전히 유효한지 확인
      const { range, containerElement } = savedSelectionRef.current
      if (
        !containerElement.contains(range.startContainer) ||
        !containerElement.contains(range.endContainer)
      ) {
        return false
      }

      sel.removeAllRanges()
      sel.addRange(range)
      return true
    } catch (error) {
      console.warn('Selection restoration failed:', error)
      return false
    }
  }

  // -------- 인라인 포맷팅(볼드/이탤릭) 개선 --------
  const applyInlineFormat = (command: 'bold' | 'italic') => {
    if (readonly) return

    // 저장된 선택 복원 시도
    const restored = restoreSelection()
    if (!restored) {
      console.warn('Could not restore selection for formatting')
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    // contentEditable 내에서만 동작하는지 재확인
    if (!ref.current || !ref.current.contains(sel.anchorNode)) return

    try {
      document.execCommand(command)
      emit()
      pushCheckpoint()
    } catch (error) {
      console.warn('Format command failed:', error)
    }

    // 포맷팅 적용 후 선택 해제하고 커서를 선택 영역 끝으로 이동
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      range.collapse(false) // 선택 끝으로 커서 이동
      sel.removeAllRanges()
      sel.addRange(range)

      // 현재 커서 위치에서 포맷팅 상태 초기화
      // 빈 텍스트 노드를 삽입하여 포맷팅 컨텍스트를 리셋
      const textNode = document.createTextNode('\u200B') // Zero Width Space
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      sel.removeAllRanges()
      sel.addRange(range)

      // Zero Width Space 즉시 제거
      setTimeout(() => {
        if (textNode.parentNode) {
          textNode.parentNode.removeChild(textNode)
        }
      }, 0)
    }

    // 툴바 숨기기
    setToolbar((prev) => ({ ...prev, visible: false }))

    // 에디터에 포커스 다시 설정
    if (ref.current) {
      ref.current.focus()
    }
  }

  // -------- 툴바 표시/숨김 로직 개선 --------
  const showToolbarAt = useCallback((clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top - 10 // 툴바를 선택 영역 위쪽으로 10px 띄움

    setToolbar({ visible: true, x, y })
  }, [])

  const handleSelectionChange = useCallback(() => {
    if (readonly) return

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !ref.current) {
      setToolbar((prev) => ({ ...prev, visible: false }))
      return
    }

    const range = sel.getRangeAt(0)

    // 에디터 외부 선택이면 툴바 숨김
    if (!ref.current.contains(range.commonAncestorContainer)) {
      setToolbar((prev) => ({ ...prev, visible: false }))
      return
    }

    // 선택이 비어있으면 툴바 숨김
    if (range.collapsed) {
      setToolbar((prev) => ({ ...prev, visible: false }))
      return
    }

    // 현재 선택 저장
    saveCurrentSelection()

    // 툴바 표시 위치 계산
    const rect = range.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      showToolbarAt(rect.left + rect.width / 2, rect.top)
    }
  }, [readonly, saveCurrentSelection, showToolbarAt])

  useEffect(() => {
    if (readonly) return

    // 선택 변경 이벤트
    const onSelectionChange = () => {
      // 약간의 지연을 두어 안정성 확보
      requestAnimationFrame(handleSelectionChange)
    }

    document.addEventListener('selectionchange', onSelectionChange)

    // ESC 키로 툴바 숨김
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToolbar((prev) => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('keydown', onKeyDown)

    // 툴바 외부 클릭으로 숨김
    const onMouseDown = (e: MouseEvent) => {
      const toolbarEl = document.getElementById('rn-mini-toolbar')
      if (toolbarEl && toolbarEl.contains(e.target as Node)) return

      if (!wrapperRef.current || !wrapperRef.current.contains(e.target as Node)) {
        setToolbar((prev) => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('mousedown', onMouseDown)

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [readonly, handleSelectionChange])

  // 붙여넣기: 외부 HTML만 정화, 내부 칩은 우리가 생성
  const onPaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    const toInsert = html ? sanitizeExternalHtml(html) : escapeHtml(text)
    insertHTMLAtCursor(toInsert)
    pushCheckpoint()
  }

  // 드롭: text/html → application/json → text/plain 순서
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 드롭 지점으로 커서 이동
    const documentWithCaretRange = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null
    }
    const range =
      documentWithCaretRange.caretRangeFromPoint?.(e.clientX, e.clientY) ||
      caretRangeFromPointPolyfill(e, ref.current!)
    if (range) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }

    // 드롭 포인트가 칩 위라면 칩 앞/뒤로 강제 정렬 (칩 내부 깨짐 방지)
    moveCaretOutsideChipAtPoint(e.clientX, e.clientY)

    // 1) text/html (우리가 onDragStart에서 싣는 칩 완성본)
    const htmlPayload = e.dataTransfer.getData('text/html')
    if (htmlPayload) {
      if (htmlPayload.includes('data-type="github_pr"')) {
        insertHTMLAtCursor(sanitizeForSave(htmlPayload))
        pushCheckpoint()
        return
      }
      insertHTMLAtCursor(sanitizeExternalHtml(htmlPayload))
      pushCheckpoint()
      return
    }

    // 2) application/json
    const raw = e.dataTransfer.getData('application/json') || ''
    try {
      const data = JSON.parse(raw)
      if (data?.type === 'github_pr') {
        const chip = makePrChipHTML({
          number: data.number,
          title: data.title,
          url: data.url,
          state: data.state,
          sourceId: data.sourceId
        } as PrChipData)
        insertHTMLAtCursor(sanitizeForSave(chip))
        pushCheckpoint()
        return
      }
    } catch {
      /* noop */
    }

    // 3) 최후: 일반 텍스트
    const txt = e.dataTransfer.getData('text/plain')
    if (txt) {
      insertHTMLAtCursor(escapeHtml(txt))
      pushCheckpoint()
    }
  }

  // 칩 내부 입력 차단 및 인접 칩 삭제 허용
  const onBeforeInput: React.FormEventHandler<HTMLDivElement> = (e) => {
    const sel = window.getSelection()
    if (!sel) return
    const chip = getClosestChipElement(sel.anchorNode)
    if (!chip) return
    // 칩 내부로의 어떤 입력도 차단하고 커서를 칩 뒤로 이동
    e.preventDefault()
    moveCaretAfterElement(chip)
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // 한글 IME 등 조합 중일 때는 커스텀 편집 명령을 건드리지 않음
    if (
      (e as unknown as { isComposing?: boolean }).isComposing ||
      (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing
    )
      return

    const sel = window.getSelection()
    if (!sel || !ref.current) return

    // Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
    const isMac =
      typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
    const mod = isMac ? e.metaKey : e.ctrlKey
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      const snap = e.shiftKey ? historyRef.current.redoStep() : historyRef.current.undo()
      if (snap && ref.current) {
        ref.current.innerHTML = snap.html
        setCaretByTextOffset(ref.current, snap.caret)
        emit()
      }
      return
    }

    // 정책 단축키 처리
    const handled = handleKeydownShortcuts(
      e as unknown as React.KeyboardEvent,
      { editor: ref.current, selection: sel, emit },
      defaultPolicy.shortcuts
    )
    if (handled) {
      // 단축키는 보통 "단어 경계" 동작 → 즉시 저장
      pushCheckpoint()
      return
    }

    // 백스페이스: 커서 앞이 칩이면 칩을 통째로 삭제
    if (e.key === 'Backspace') {
      const targetChip = getPreviousAdjacentChip(sel.anchorNode!)
      if (targetChip) {
        e.preventDefault()
        targetChip.parentNode?.removeChild(targetChip)
        emit()
        pushCheckpoint()
        return
      }
    }

    // Delete: 커서 뒤가 칩이면 칩을 통째로 삭제
    if (e.key === 'Delete') {
      const targetChip = getNextAdjacentChip(sel.anchorNode!)
      if (targetChip) {
        e.preventDefault()
        targetChip.parentNode?.removeChild(targetChip)
        emit()
        pushCheckpoint()
        return
      }
    }

    // "단어 경계" 키: 스페이스/엔터/구두점 → 입력 반영 후 스냅샷 예약
    if (e.key === ' ' || e.key === 'Enter' || ['.', ',', '!', '?', ';', ':'].includes(e.key)) {
      scheduleCheckpoint()
    }
  }

  return (
    <div ref={wrapperRef} className="rn-wrapper relative w-full">
      <div
        ref={ref}
        className={`rn-editor min-h-[96px] w-full px-3 py-2 border border-gray-200 rounded outline-none leading-[1.6] text-[14px] ${readonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        contentEditable={!readonly}
        suppressContentEditableWarning
        onInput={
          readonly
            ? undefined
            : () => {
                emit()
              }
        }
        onBeforeInput={readonly ? undefined : onBeforeInput}
        onKeyDown={readonly ? undefined : onKeyDown}
        onPaste={readonly ? undefined : onPaste}
        onDrop={readonly ? undefined : onDrop}
        onDragOver={readonly ? undefined : (e) => e.preventDefault()}
        onContextMenu={readonly ? undefined : (e) => e.preventDefault()}
        data-placeholder={readonly ? '' : placeholder || '여기에 입력하세요…'}
        spellCheck={false}
        tabIndex={readonly ? -1 : 0}
        aria-label={readonly ? '읽기 전용 텍스트' : '리치 텍스트 에디터'}
        role="textbox"
        aria-readonly={readonly}
        aria-multiline="true"
      />
      {!readonly && (
        <InlineToolbar
          visible={toolbar.visible}
          x={toolbar.x}
          y={toolbar.y}
          onBold={() => applyInlineFormat('bold')}
          onItalic={() => applyInlineFormat('italic')}
        />
      )}
      <style jsx>{`
        .rn-wrapper {
          width: 100%;
          --selected-color: #f3f4f6; /* CSS 변수 정의 */
        }
        .rn-editor {
          min-height: 96px;
          width: 100%;
          padding: 10px 12px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          outline: none;
          line-height: 1.6;
          font-size: 14px;
        }
        .rn-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        /* ★ PR 칩 호버 효과: 인라인 스타일 오버라이드 없이 CSS만으로 */
        .rn-wrapper .rn-editor a[data-type='github_pr'].gh-pr-chip:hover,
        .rn-wrapper .rn-editor a[data-type='github_pr'][class*='gh-pr-chip']:hover {
          background-color: var(--selected-color) !important;
          background: var(--selected-color) !important;
          border-color: #e5e7eb !important;
        }
        .rn-wrapper .rn-editor a[data-type='github_pr'].gh-pr-chip:hover [data-badge],
        .rn-wrapper .rn-editor a[data-type='github_pr'][class*='gh-pr-chip']:hover [data-badge] {
          background-color: #f3f4f6 !important;
          background: #f3f4f6 !important;
          border-color: rgba(17, 24, 39, 0.12) !important;
        }
        .rn-wrapper .rn-editor a[data-type='github_pr'].gh-pr-chip:focus,
        .rn-wrapper .rn-editor a[data-type='github_pr'][class*='gh-pr-chip']:focus {
          background-color: var(--selected-color) !important;
          background: var(--selected-color) !important;
          border-color: #e5e7eb !important;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

// 드롭 커서 폴리필(간단히 끝으로 이동)
function caretRangeFromPointPolyfill(e: React.DragEvent, root: HTMLElement) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.selectNodeContents(root)
  range.collapse(false)
  sel?.removeAllRanges()
  sel?.addRange(range)
  return range
}
