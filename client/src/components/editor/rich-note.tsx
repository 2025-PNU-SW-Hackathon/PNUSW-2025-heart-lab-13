// src/components/editor/rich-note.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import InlineToolbar from './inline-toolbar'
import { makePrChipHTML, escapeHtml, PrChipData } from './pr-chip'
import { makeNotionChipHTML, NotionChipData } from './notion-chip'
import { makeJiraChipHTML, JiraChipData } from './jira-chip'
import {
  defaultPolicy,
  handleKeydownShortcuts,
  getClosestChipElement,
  moveCaretAfterElement,
  moveCaretOutsideChipAtPoint,
  sanitize as sanitizeHtmlPolicy,
  sanitizeForSave,
  sanitizeExternalHtml
} from './policy'

type Props = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  readonly?: boolean
}

export function sanitize(html: string) {
  return sanitizeHtmlPolicy(html)
}

export default function RichNote({ value = '', onChange, placeholder, readonly }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 상태 관리 심플하게
  const isComposingRef = useRef(false)
  const lastEmittedValueRef = useRef('')

  // 툴바 상태
  const [toolbar, setToolbar] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  })

  // 초기값 설정 (마운트 시 한 번만)
  useEffect(() => {
    if (ref.current && value && !lastEmittedValueRef.current) {
      ref.current.innerHTML = value
      lastEmittedValueRef.current = value
    }
  }, [])

  // 외부에서 value가 변경될 때만 업데이트
  useEffect(() => {
    if (!ref.current) return
    // 내부 변경이 아닌 외부 변경일 때만 DOM 업데이트
    if (value !== lastEmittedValueRef.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value
      lastEmittedValueRef.current = value
    }
  }, [value])

  // onChange 호출 - 심플하게
  const emit = useCallback(() => {
    if (!ref.current || !onChange) return
    const currentHtml = ref.current.innerHTML

    // 실제로 변경됐을 때만 호출
    if (currentHtml !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = currentHtml
      onChange(currentHtml)
    }
  }, [onChange])

  // HTML 삽입
  const insertHTMLAtCursor = useCallback(
    (html: string) => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        ref.current?.insertAdjacentHTML('beforeend', html)
        placeCaretAtEnd(ref.current!)
        emit()
        return
      }

      // 칩 안에 커서가 있으면 밖으로
      const anchorChip = getClosestChipElement(sel.anchorNode)
      if (anchorChip) {
        moveCaretAfterElement(anchorChip)
      }

      const range = sel.getRangeAt(0)
      range.deleteContents()

      const frag = range.createContextualFragment(html)
      const lastChild = frag.lastChild
      range.insertNode(frag)

      if (lastChild) {
        range.setStartAfter(lastChild)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }

      emit()
    },
    [emit]
  )

  // 커서를 끝으로
  function placeCaretAtEnd(el: HTMLElement) {
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  // 포맷팅 적용 - 심플하게
  const applyInlineFormat = useCallback(
    (command: 'bold' | 'italic') => {
      if (readonly) return

      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return

      // 선택 영역이 에디터 내부인지 확인
      const range = sel.getRangeAt(0)
      if (!ref.current?.contains(range.commonAncestorContainer)) return

      document.execCommand(command)
      emit()

      // 툴바 숨기고 포커스 유지
      setToolbar((prev) => ({ ...prev, visible: false }))
      ref.current?.focus()
    },
    [readonly, emit]
  )

  // 선택 영역 변경 처리
  const handleSelectionChange = useCallback(() => {
    if (readonly) return

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !ref.current) {
      setToolbar((prev) => ({ ...prev, visible: false }))
      return
    }

    const range = sel.getRangeAt(0)

    // 에디터 밖이거나 선택 영역이 없으면 툴바 숨김
    if (!ref.current.contains(range.commonAncestorContainer) || range.collapsed) {
      setToolbar((prev) => ({ ...prev, visible: false }))
      return
    }

    // 툴바 위치 계산
    const rect = range.getBoundingClientRect()
    const wrapperRect = wrapperRef.current?.getBoundingClientRect()

    if (rect.width > 0 && wrapperRect) {
      setToolbar({
        visible: true,
        x: rect.left + rect.width / 2 - wrapperRect.left,
        y: rect.top - wrapperRect.top - 10
      })
    }
  }, [readonly])

  // 전역 이벤트 리스너
  useEffect(() => {
    if (readonly) return

    const onSelectionChange = () => {
      if (!isComposingRef.current) {
        handleSelectionChange()
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      const toolbarEl = document.getElementById('rn-mini-toolbar')
      if (toolbarEl?.contains(e.target as Node)) return

      if (!wrapperRef.current?.contains(e.target as Node)) {
        setToolbar((prev) => ({ ...prev, visible: false }))
      }
    }

    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mousedown', onMouseDown)

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [readonly, handleSelectionChange])

  // 입력 핸들러들
  const onInput = useCallback(() => {
    if (!isComposingRef.current) {
      emit()
    }
  }, [emit])

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  const onCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    // 컴포지션 종료 후 바로 emit
    setTimeout(emit, 0)
  }, [emit])

  // 붙여넣기
  const onPaste: React.ClipboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault()

      const html = e.clipboardData.getData('text/html')
      const text = e.clipboardData.getData('text/plain')

      const toInsert = html ? sanitizeExternalHtml(html) : escapeHtml(text)
      insertHTMLAtCursor(toInsert)
    },
    [insertHTMLAtCursor]
  )

  // 드래그 앤 드롭
  const onDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()

      // 드롭 위치로 커서 이동
      const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
      if (range) {
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }

      // 칩 밖으로 커서 이동
      moveCaretOutsideChipAtPoint(e.clientX, e.clientY)

      // HTML 데이터 처리
      const htmlPayload = e.dataTransfer.getData('text/html')
      if (htmlPayload) {
        if (htmlPayload.includes('data-type="github_pr"')) {
          insertHTMLAtCursor(sanitizeForSave(htmlPayload))
        } else if (htmlPayload.includes('data-type="jira_task"')) {
          insertHTMLAtCursor(sanitizeForSave(htmlPayload))
        } else if (htmlPayload.includes('data-type="notion_doc"')) {
          insertHTMLAtCursor(sanitizeForSave(htmlPayload))
        } else {
          insertHTMLAtCursor(sanitizeExternalHtml(htmlPayload))
        }
        return
      }

      // JSON 데이터 처리 (PR/Jira/Notion 칩)
      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (jsonData) {
          const data = JSON.parse(jsonData)
          if (data?.type === 'github_pr') {
            const chip = makePrChipHTML(data as PrChipData)
            insertHTMLAtCursor(sanitizeForSave(chip))
            return
          } else if (data?.type === 'jira_task') {
            const chip = makeJiraChipHTML(data as JiraChipData)
            insertHTMLAtCursor(sanitizeForSave(chip))
            return
          } else if (data?.type === 'notion_doc') {
            const chip = makeNotionChipHTML(data as NotionChipData)
            insertHTMLAtCursor(sanitizeForSave(chip))
            return
          }
        }
      } catch {
        // JSON 파싱 실패는 무시
      }

      // 일반 텍스트
      const text = e.dataTransfer.getData('text/plain')
      if (text) {
        insertHTMLAtCursor(escapeHtml(text))
      }
    },
    [insertHTMLAtCursor]
  )

  // 키보드 핸들러
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (isComposingRef.current) return

      const sel = window.getSelection()
      if (!sel || !ref.current) return

      // 단축키 처리
      const handled = handleKeydownShortcuts(
        e as unknown as React.KeyboardEvent,
        { editor: ref.current, selection: sel, emit },
        defaultPolicy.shortcuts
      )
      if (handled) return

      // Backspace로 칩 삭제 - Notion 칩도 포함
      if (e.key === 'Backspace' && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)

        // 커서가 칩 바로 뒤에 있는지 확인
        if (range.collapsed && range.startOffset === 0) {
          const container = range.startContainer
          const prevNode = container.previousSibling || container.parentNode?.previousSibling

          if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE) {
            const element = prevNode as HTMLElement
            // GitHub PR 칩 또는 Notion 칩 삭제
            if (
              element.matches?.('a.gh-pr-chip[data-type="github_pr"]') ||
              element.matches?.('a.gh-pr-chip[data-type="notion_doc"]')
            ) {
              e.preventDefault()
              element.remove()
              emit()
              return
            }
          }
        }
      }

      // Escape로 툴바 닫기
      if (e.key === 'Escape') {
        setToolbar((prev) => ({ ...prev, visible: false }))
      }
    },
    [emit]
  )

  // BeforeInput - 칩 내부 입력 방지
  const onBeforeInput: React.FormEventHandler<HTMLDivElement> = useCallback((e) => {
    const sel = window.getSelection()
    if (!sel) return

    const chip = getClosestChipElement(sel.anchorNode)
    if (chip) {
      e.preventDefault()
      moveCaretAfterElement(chip)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="rn-wrapper relative w-full">
      <div
        ref={ref}
        className={`rn-editor min-h-[96px] w-full px-3 py-2 border border-gray-200 rounded outline-none leading-[1.6] text-[14px] ${
          readonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        contentEditable={!readonly}
        suppressContentEditableWarning
        onInput={readonly ? undefined : onInput}
        onCompositionStart={readonly ? undefined : onCompositionStart}
        onCompositionEnd={readonly ? undefined : onCompositionEnd}
        onBeforeInput={readonly ? undefined : onBeforeInput}
        onKeyDown={readonly ? undefined : onKeyDown}
        onPaste={readonly ? undefined : onPaste}
        onDrop={readonly ? undefined : onDrop}
        onDragOver={readonly ? undefined : (e) => e.preventDefault()}
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
          --selected-color: #f3f4f6;
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
          word-break: break-word;
          white-space: pre-wrap;
        }
        .rn-editor:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .rn-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        /* 모든 칩 공통 스타일 */
        .rn-wrapper .rn-editor a.gh-pr-chip {
          user-select: none;
          -webkit-user-select: none;
          text-decoration: none !important;
        }

        /* GitHub PR 칩 스타일 */
        .rn-wrapper .rn-editor a[data-type='github_pr'].gh-pr-chip:hover,
        .rn-wrapper .rn-editor a[data-type='github_pr'][class*='gh-pr-chip']:hover {
          background-color: var(--selected-color) !important;
          background: var(--selected-color) !important;
          border-color: #e5e7eb !important;
        }
        .rn-wrapper .rn-editor a[data-type='github_pr'].gh-pr-chip:hover span[data-badge],
        .rn-wrapper
          .rn-editor
          a[data-type='github_pr'][class*='gh-pr-chip']:hover
          span[data-badge] {
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

        /* Notion 칩 스타일 */
        .rn-wrapper .rn-editor a[data-type='notion_doc'].gh-pr-chip:hover,
        .rn-wrapper .rn-editor a[data-type='notion_doc'][class*='gh-pr-chip']:hover {
          background-color: var(--selected-color) !important;
          background: var(--selected-color) !important;
          border-color: #e5e7eb !important;
        }
        .rn-wrapper .rn-editor a[data-type='notion_doc'].gh-pr-chip:focus,
        .rn-wrapper .rn-editor a[data-type='notion_doc'][class*='gh-pr-chip']:focus {
          background-color: var(--selected-color) !important;
          background: var(--selected-color) !important;
          border-color: #e5e7eb !important;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* 칩 내부 밑줄 스타일이 외부로 누수되지 않도록 격리 */
        .rn-wrapper .rn-editor a[data-type='notion_doc'] span {
          text-decoration: none !important;
        }
        .rn-wrapper .rn-editor a[data-type='notion_doc']:after {
          content: '';
          display: inline;
          text-decoration: none !important;
        }
      `}</style>
    </div>
  )
}
