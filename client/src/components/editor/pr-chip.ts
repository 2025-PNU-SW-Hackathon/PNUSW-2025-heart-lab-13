// src/components/editor/pr-chip.ts
import { getPrIconSvg } from '../icons/github-icon'
import { CHIP, ChipState, stateToColor } from './policy/chips'

export type PrChipData = {
  number: number
  title: string
  url: string
  state?: ChipState
  sourceId?: string
}

export function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function makePrChipHTML(data: PrChipData) {
  const state = (data.state || '').toLowerCase()
  const color = stateToColor(state)
  const badgeBg = 'var(--selected-color, #F3F4F6)'

  // 중요: 템플릿 리터럴 내 줄바꿈은 공백으로 유지
  return `<a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer" contenteditable="false" ${CHIP.data.type}="github_pr" ${CHIP.data.number}="${escapeHtml(String(data.number))}" ${CHIP.data.url}="${escapeHtml(data.url)}" ${CHIP.data.state}="${escapeHtml(state)}" ${CHIP.data.sourceId}="${escapeHtml(data.sourceId || String(data.number))}" class="${CHIP.className}" style="display:inline-flex;align-items:center;gap:8px;padding:2px 6px;border-radius:8px;font-size:13px;line-height:1.45;text-decoration:none;color:#111827;border:1px solid transparent;transition:all .12s ease;cursor:pointer;vertical-align:middle;"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="display:inline-flex;align-items:center;">${getPrIconSvg(state, color, 16)}</span> <strong style="font-weight:700;color:#6B7280;">#${escapeHtml(String(data.number))}</strong> <span style="font-weight:600;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis;color:#111827;">${escapeHtml(data.title)}</span></span> <span data-badge style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;background:${badgeBg};border:1px solid rgba(17,24,39,.06);font-size:12px;line-height:1.35;color:${color};"><span style="display:inline-flex;align-items:center;">${getPrIconSvg(state, color, 10)}</span> ${state ? state[0].toUpperCase() + state.slice(1) : 'PR'}</span></a>`
}

export function extractPrChipReferences(
  html: string
): Array<{ sourceType: string; sourceId: string }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const chips = doc.querySelectorAll(CHIP.selector)

  const references: Array<{ sourceType: string; sourceId: string }> = []
  chips.forEach((chip) => {
    const sourceId = chip.getAttribute(CHIP.data.sourceId)
    if (sourceId) {
      references.push({
        sourceType: 'GITHUB_PULL_REQUEST',
        sourceId
      })
    }
  })

  return references
}
