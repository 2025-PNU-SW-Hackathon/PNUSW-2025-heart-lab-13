// src/components/editor/notion-chip.ts
import { escapeHtml } from './pr-chip'

export type NotionChipData = {
  title: string
  imgSrc: string
}

export const makeNotionChipHTML = (data: NotionChipData): string => {
  const safeTitle = escapeHtml(data.title)
  const safeSrc = escapeHtml(data.imgSrc)

  // 칩을 a 태그로 변경하고 클래스명을 일관성 있게 맞춤
  // contenteditable="false"를 추가하여 내부 수정 방지
  // 밑줄 스타일을 칩 내부로만 제한
  return `<a href="#" contenteditable="false" data-type="notion_doc" class="gh-pr-chip notion-chip" style="display:inline-flex;align-items:center;gap:8px;padding:2px 8px;border-radius:8px;font-size:13px;line-height:1.45;color:#111827;border:1px solid transparent;transition:all .12s ease;cursor:default;vertical-align:middle;text-decoration:none !important;user-select:none;-webkit-user-select:none;white-space:nowrap;">
    <img src="${safeSrc}" alt="문서" width="16" height="16" style="display:inline-block;object-fit:contain;opacity:.9;flex:0 0 auto;" loading="lazy" decoding="async"/>
    <span style="font-weight:600;color:#6B7280;display:inline-block;flex:0 0 auto;">Notion</span>
    <span style="font-weight:600;max-width:420px;overflow:hidden;text-overflow:ellipsis;color:#111827;display:inline-block;line-height:1;border-bottom:1px solid #9CA3AF;padding-bottom:0;text-decoration:none !important;">${safeTitle}</span>
  </a>`
}
