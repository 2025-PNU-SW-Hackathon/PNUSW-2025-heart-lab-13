// components/panels/notion-panel.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import notionSearchImg from '@/src/lib/image/notion-search.png'
import notionDocumentImg from '@/src/lib/image/notion-document.png'
import { makeNotionChipHTML } from '@/src/components/editor/notion-chip'

type NotionItem = {
  id: string
  title: string
  path?: string
  date?: string
}

const MOCK_ITEMS: NotionItem[] = [
  { id: '1', title: 'Github 1Pager', path: 'Service / … / Github', date: '7월 9일' },
  { id: '2', title: 'Jira 1Pager', path: 'Service / … / Jira', date: '7월 8일' },
  { id: '3', title: 'Notion 1Pager', path: 'Service / … / Notion', date: '7월 8일' },
  { id: '4', title: '계정관리 1Pager', path: 'Service / … / 계정관리', date: '7월 4일' },
  { id: '5', title: '저장 1Pager', path: 'Moti / … / 저장', date: '7월 4일' },
  { id: '6', title: '세션관리 ', path: 'Moti / … / 세션관리', date: '7월 3일' },
  { id: '7', title: '프로젝트 1Pager', path: 'Moti / … / 프로젝트', date: '6월 27일' }
]

const NotionPanel = () => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 필터링 (간단 contains)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_ITEMS
    return MOCK_ITEMS.filter((it) => it.title.toLowerCase().includes(q))
  }, [query])

  // 외부 클릭으로 닫기
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((p) => Math.min((results.length || 1) - 1, p + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((p) => Math.max(-1, p - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        // 선택 동작: 여기서는 단순히 닫기만
        setQuery(results[activeIndex].title)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <section className="w-full" aria-label="Notion 검색 패널">
      <div ref={wrapperRef} className="px-6 ">
        {/* 검색창 + 리스트를 하나의 카드 안에서 확장 */}
        <div
          className={`rounded-lg border border-main-gray bg-white transition-shadow ${open ? 'shadow-md' : 'shadow-sm'}`}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 inline-flex">
              <Image
                src={notionSearchImg}
                alt="검색"
                width={14}
                height={14}
                className="opacity-80"
              />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="이준영의 Notion에서 검색 또는 질문"
              aria-label="Notion 검색"
              className="w-full rounded-lg pl-9 pr-3 py-3 text-xs placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          {/* 결과 리스트: 같은 컨테이너에서 아래로 확장 */}
          {open && (
            <div
              role="listbox"
              className="max-h-100 overflow-auto rounded-b-lg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {results.map((it, idx) => (
                <button
                  key={it.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                  draggable
                  onDragStart={(e) => {
                    const payload = {
                      type: 'notion_doc',
                      title: it.title,
                      imgSrc: notionDocumentImg.src
                    }
                    const html = makeNotionChipHTML(payload)
                    e.dataTransfer.setData('text/html', html)
                    e.dataTransfer.setData('application/json', JSON.stringify(payload))
                    e.dataTransfer.setData('text/plain', it.title)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => {
                    setQuery(it.title)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between text-sm ${idx === activeIndex ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex w-4 h-5 items-center justify-center text-gray-500">
                      <Image
                        src={notionDocumentImg}
                        alt="문서 아이콘"
                        width={16}
                        height={16}
                        className="object-contain"
                        aria-label="문서"
                      />
                    </span>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">{it.title}</div>
                      {it.path && (
                        <div className="text-[12px] text-gray-500 truncate">— {it.path}</div>
                      )}
                    </div>
                  </div>
                  {it.date && <div className="text-xs text-gray-400 ml-4">{it.date}</div>}
                </button>
              ))}
              {results.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">검색 결과가 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default NotionPanel
