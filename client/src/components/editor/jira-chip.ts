// src/components/editor/jira-chip.ts
import { escapeHtml } from './pr-chip'

export type JiraChipData = {
  id: string
  title: string
  author: string
  epic: string
}

const getTaskIconSvg = (size: number = 14) => {
  const s = String(size)
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="14" rx="2" stroke="#2563EB" stroke-width="1.5"/><path d="M7 9h10M7 12h6" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"/></svg>`
}

export function makeJiraChipHTML(data: JiraChipData) {
  const badgeBg = 'var(--selected-color, #F3F4F6)'
  return (
    `<a contenteditable="false" data-type="jira_task" data-id="${escapeHtml(
      data.id
    )}" data-epic="${escapeHtml(data.epic)}" data-author="${escapeHtml(
      data.author
    )}" class="gh-pr-chip" style="display:inline-flex;align-items:center;gap:8px;padding:2px 6px;border-radius:8px;font-size:13px;line-height:1.45;text-decoration:none;color:#111827;border:1px solid transparent;transition:all .12s ease;cursor:pointer;vertical-align:middle;">` +
    `<span style="display:inline-flex;align-items:center;gap:6px;">` +
    `<span style="display:inline-flex;align-items:center;">${getTaskIconSvg(16)}</span>` +
    `<strong style="font-weight:700;color:#6B7280;">${escapeHtml(data.id)}</strong>` +
    `<span style="font-weight:600;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis;color:#111827;">${escapeHtml(
      data.title
    )}</span>` +
    `</span>` +
    `<span data-badge style="display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:6px;background:${badgeBg};border:1px solid rgba(17,24,39,.06);font-size:12px;line-height:1.35;color:#2563EB;">` +
    `<span style="display:inline-flex;align-items:center;">${getTaskIconSvg(10)}</span>` +
    `${escapeHtml(data.author)} · ${escapeHtml(data.epic)}` +
    `</span>` +
    `</a>`
  )
}
