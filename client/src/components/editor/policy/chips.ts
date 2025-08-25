// src/components/editor/policy/chips.ts
// 칩(Chip) 탐지/커서 이동/인접칩 탐색 + 공통 상수/유틸(중복 제거)

export const CHIP = {
  selector: 'a.gh-pr-chip[data-type="github_pr"]',
  className: 'gh-pr-chip',
  data: {
    // data-* 속성 키 이름 (DOM getAttribute와 일치)
    type: 'data-type',
    number: 'data-number',
    url: 'data-url',
    state: 'data-state',
    sourceId: 'data-source-id'
  } as const
} as const

export type ChipState = 'open' | 'closed' | 'merged' | string

export function stateToColor(state: string) {
  const s = (state || '').toLowerCase()
  if (s === 'merged') return '#7C3AED'
  if (s === 'open') return '#059669'
  return '#EF4444'
}

export function isChipElement(el: Node | null): el is HTMLElement {
  return !!(el instanceof HTMLElement && el.matches(CHIP.selector))
}

// 가장 가까운(조상) 칩 요소를 찾기
export function getClosestChipElement(node: Node | null): HTMLElement | null {
  let el: Node | null = node
  while (el) {
    if (el instanceof HTMLElement && el.matches(CHIP.selector)) return el
    el = el.parentNode
  }
  return null
}

// 커서를 특정 요소 '뒤'로 이동
export function moveCaretAfterElement(el: HTMLElement) {
  if (!el || !el.isConnected) return
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStartAfter(el)
  range.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(range)
}

// 커서를 특정 요소 '앞'으로 이동
export function moveCaretBeforeElement(el: HTMLElement) {
  if (!el || !el.isConnected) return
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStartBefore(el)
  range.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(range)
}

// 포인터 좌표 기준 칩 좌/우 절반을 나눠 바깥쪽으로 커서 배치
export function moveCaretOutsideChipAtPoint(clientX: number, clientY: number) {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  const chip = el?.closest(CHIP.selector) as HTMLElement | null
  if (!chip) return false
  const rect = chip.getBoundingClientRect()
  const placeAfter = clientX >= rect.left + rect.width / 2
  if (placeAfter) {
    moveCaretAfterElement(chip)
  } else {
    moveCaretBeforeElement(chip)
  }
  return true
}

// 인접 칩 탐색(형제가 없으면 부모로 올라가 재시도)
function findAdjacentChip(node: Node | null, dir: 'prev' | 'next'): HTMLElement | null {
  let cur: Node | null = node
  while (cur) {
    // 1) 같은 레벨의 형제 먼저 확인
    const sib =
      cur.nodeType === Node.TEXT_NODE
        ? dir === 'prev'
          ? (cur as ChildNode).previousSibling
          : (cur as ChildNode).nextSibling
        : cur instanceof HTMLElement
          ? dir === 'prev'
            ? cur.previousElementSibling
            : cur.nextElementSibling
          : null

    if (sib) return isChipElement(sib) ? (sib as HTMLElement) : null

    // 2) 형제가 없다면 한 단계 위로 올라가 재시도
    cur = cur.parentNode
  }
  return null
}

// 커서 컨테이너 기준 "이전/다음"에 인접한 칩
export const getPreviousAdjacentChip = (node: Node | null) => findAdjacentChip(node, 'prev')
export const getNextAdjacentChip = (node: Node | null) => findAdjacentChip(node, 'next')

// JS 호버 리스너는 제거(중복). CSS :hover로만 처리.
