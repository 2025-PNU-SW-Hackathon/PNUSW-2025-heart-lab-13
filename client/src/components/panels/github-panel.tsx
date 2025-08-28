// components/panels/github-panel.tsx
'use client'

import { useState, useEffect, Fragment, useRef } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import {
  loadGithubOrganizations,
  loadOrganizationPullRequests,
  PullRequestCache
} from '@/src/lib/services/github-service'
import type { GithubOrg, GithubPull } from '@/src/lib/api/github/types'
import PrDetailModal from '../modals/github-prdetail-modal'
import { makePrChipHTML } from '@/src/components/editor/pr-chip'
import PrIcon from '../icons/github-icon'
import { YearMonthListbox } from '@/src/components/date/year-month-listbox'
import { YearMonthValue } from '@/src/lib/utils/date'
import { isEmptyYM, isFilledYM } from '@/src/lib/utils/date'

// URL에서 owner/repo 추출
function extractOwnerRepo(url: string): { owner: string; repo: string } {
  if (!url || typeof url !== 'string') {
    console.warn(`유효하지 않은 URL: ${url}`)
    return { owner: '', repo: '' }
  }
  try {
    let m = url.match(
      /(?:github\.com|api\.github\.com\/repos)\/([^\/\?#]+)\/([^\/\?#]+)\/pull[s]?\/\d+/
    )
    if (!m) m = url.match(/\/([^\/\?#]+)\/([^\/\?#]+)\/pull[s]?\/\d+/)
    if (!m || m.length < 3) {
      console.warn(`GitHub URL 파싱 실패: "${url}" - 예상 형식: github.com/owner/repo/pull/123`)
      return { owner: '', repo: '' }
    }
    return { owner: m[1].trim(), repo: m[2].trim() }
  } catch (error) {
    console.error(`GitHub URL 파싱 중 오류: ${url}`, error)
    return { owner: '', repo: '' }
  }
}

export default function GithubPanel() {
  /* ---------- 조직 상태 ---------- */
  const [orgs, setOrgs] = useState<GithubOrg[]>([])
  const [orgSelected, setOrgSelected] = useState<string>('') // login/slug
  const [orgLoading, setOrgLoading] = useState(true)
  const [orgError, setOrgError] = useState<string | null>(null)
  // 날짜 선택 상태
  const [fromYM, setFromYM] = useState<YearMonthValue>({})
  const [toYM, setToYM] = useState<YearMonthValue>({})
  const canResetDate = !isEmptyYM(fromYM) || !isEmptyYM(toYM)

  /* ---------- PR 상태 ---------- */
  const [prs, setPrs] = useState<GithubPull[]>([])
  const [prLoading, setPrLoading] = useState(false)
  const [prError, setPrError] = useState<string | null>(null)

  /* ---------- 캐시 ---------- */
  const prCache = useRef(new PullRequestCache())

  /* ---------- 모달 상태 ---------- */
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [modalOrigin, setModalOrigin] = useState<{ x: number; y: number } | null>(null) // ★ 추가
  const [modalPrNumber, setModalPrNumber] = useState<number | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // 1) 조직 목록 로드
  useEffect(() => {
    ;(async () => {
      try {
        const { organizations, firstOrgLogin } = await loadGithubOrganizations()
        setOrgs(organizations)
        setOrgSelected(firstOrgLogin ?? '')
        setOrgError(null)
      } catch (error) {
        setOrgError(error instanceof Error ? error.message : '조직 정보를 불러오지 못했습니다.')
      } finally {
        setOrgLoading(false)
      }
    })()
  }, [])

  // 2) 조직 선택 → PR 로드
  useEffect(() => {
    if (!orgSelected) return

    const fromFilled = isFilledYM(fromYM)
    const toFilled = isFilledYM(toYM)

    const opts = {
      ...(fromFilled && toFilled ? { fromYM, toYM } : {}) // bothEmpty면 전체 검색(옵션 제거)
    }

    const run = async () => {
      setPrLoading(true)
      setPrError(null)
      try {
        const { pullRequests } = await loadOrganizationPullRequests(orgSelected, opts)
        prCache.current.set(orgSelected, pullRequests)
        setPrs(pullRequests)
      } catch (e) {
        setPrError(e instanceof Error ? e.message : 'PR 정보를 불러오지 못했습니다.')
      } finally {
        setPrLoading(false)
      }
    }
    run()
  }, [orgSelected, fromYM, toYM])

  // 모달 핸들러
  const handlePrHover = (event: React.MouseEvent, prNumber: number) => {
    if (hoverTimeout) clearTimeout(hoverTimeout)

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = { x: rect.left + rect.width / 2, y: rect.top }
    const pointer = { x: event.clientX, y: event.clientY } // ★ 오픈 당시 포인터 좌표

    const timeout = setTimeout(() => {
      setModalPosition(position)
      setModalOrigin(pointer) // ★ 저장
      setModalPrNumber(prNumber)
      setModalOpen(true)
    }, 500)
    setHoverTimeout(timeout)
  }

  const handlePrLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalPrNumber(null)
    setModalOrigin(null) // ★ 정리
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  // 로딩/에러/빈 상태일 때도 동일한 레이아웃 구조 유지
  if (orgLoading) {
    return (
      <section className="w-full">
        <div className="px-6 border-b border-main-gray mb-3 justify-center items-center flex flex-col">
          {/* 로딩 중에도 드롭다운과 같은 구조 유지 */}
          <div className="flex w-full items-center justify-between rounded border border-main-gray px-3 py-2 mb-3 text-sm">
            <span className="pl-2 text-gray-500">Org loading…</span>
            <ChevronUpDownIcon className="h-4 w-4 flex-none opacity-60" />
          </div>

          {/* 날짜 필터 영역도 유지 */}
          <div className="w-full h-fit flex justify-between mb-3">
            <div className="flex-1 rounded border border-main-gray px-3 py-2 text-sm text-gray-400">
              From
            </div>
            <span className="mx-[6px] inline-flex select-none items-center text-[16px] leading-none text-[#888] font-normal">
              ∼
            </span>
            <div className="flex-1 rounded border border-main-gray px-3 py-2 text-sm text-gray-400">
              To
            </div>
          </div>

          <button
            className="mb-8 w-full rounded bg-gray-300 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
            disabled
          >
            날짜 초기화
          </button>
        </div>
      </section>
    )
  }

  if (orgError) return <p className="mt-6 text-sm text-red-600">{orgError}</p>
  if (!orgs.length)
    return <p className="mt-6 text-sm text-gray-500">속한 Organization이 없습니다.</p>

  return (
    <section className="w-full ">
      <div
        className="px-[34px]  border-b border-main-gray  justify-center items-center flex flex-col"
        aria-label="Org 선택 드롭다운 + filter"
      >
        {/* Organization 드롭다운: login(=slug) 사용 */}
        <Listbox value={orgSelected} onChange={setOrgSelected}>
          {({ open }) => (
            <div className="relative w-full">
              <Listbox.Button className="flex w-full items-center justify-between rounded border border-main-gray px-3 py-2 mb-3 text-sm ">
                <span className="pl-2">{orgSelected || 'Organization 선택'}</span>
                <ChevronUpDownIcon className="h-4 w-4 flex-none opacity-60" />
              </Listbox.Button>
              <Transition as={Fragment} show={open}>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
                  {orgs.map((org, idx) => (
                    <Listbox.Option
                      key={`${org.name}-${idx}`}
                      value={org.name}
                      className={({ active }) =>
                        `flex cursor-pointer items-center px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`
                      }
                    >
                      {orgSelected === org.name && (
                        <CheckIcon className="mr-1 h-4 w-4 text-emerald-600" />
                      )}
                      {org.name}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
        <div
          className="w-full h-fit flex flex-col justify-between gap-[10px] mb-[37px]"
          aria-label="기간 필터"
        >
          <div className="flex">
            <YearMonthListbox
              value={fromYM}
              onChange={setFromYM}
              isFromField={true}
              toValue={toYM}
            />
            <span
              className="mx-[6px] inline-flex select-none items-center 
             text-[16px] leading-none text-[#888] font-normal"
            >
              ∼
            </span>
          </div>
          <div className="flex">
            <YearMonthListbox value={toYM} onChange={setToYM} isToField={true} fromValue={fromYM} />
            <button
              className="w-full ml-[24px]  h-[45px] bg-black rounded-[5px] disabled:bg-gray-300"
              disabled={!canResetDate}
              onClick={() => {
                // 둘 다 빈 객체로 초기화
                setFromYM({})
                setToYM({})
              }}
              aria-disabled={!canResetDate}
            >
              <span className="text-white text-sm font-normal">초기화</span>
            </button>
          </div>
        </div>
      </div>

      <div aria-label="PR 리스트">
        {prLoading && (
          <div className="px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-row py-4 gap-5 border-b border-main-gray">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        {prError && <p className="text-sm text-red-600">{prError}</p>}
        {!prLoading && !prError && prs.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">최근 30일 PR이 없습니다.</p>
        )}

        {!prLoading && !prError && prs.length > 0 && (
          <ul className="divide-y divide-main-gray">
            {prs.map((pr) => {
              const prNumber = pr.number

              const dragData = {
                type: 'github_pr',
                number: prNumber,
                title: pr.title,
                url: pr.url,
                state: pr.state, // 'open' | 'closed' | 'merged'
                sourceId: pr.sourceId
              }

              return (
                <li
                  key={pr.url} // id 대신 url 사용
                  className="flex flex-row px-4 py-4 relative gap-5"
                  onMouseEnter={(e) => handlePrHover(e, prNumber)}
                  onMouseLeave={handlePrLeave}
                  draggable
                  onDragStart={(e) => {
                    // 드롭 호환성 최상: 완성된 칩 HTML을 text/html로도 실어둠
                    const chipHtml = makePrChipHTML({
                      number: prNumber,
                      title: pr.title,
                      url: pr.url,
                      state: pr.state,
                      sourceId: pr.sourceId
                    })
                    e.dataTransfer.setData('text/html', chipHtml)

                    // 보조 포맷
                    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
                    e.dataTransfer.setData('text/plain', `${pr.title} (#${prNumber}) ${pr.url}`)
                    e.dataTransfer.effectAllowed = 'copy'

                    // 고스트 이미지는 기존대로
                    const ghost = document.createElement('div')
                    ghost.textContent = `#${prNumber} ${pr.title}`
                    ghost.style.position = 'fixed'
                    ghost.style.top = '-9999px'
                    ghost.style.padding = '4px 8px'
                    ghost.style.border = '1px solid #e5e7eb'
                    ghost.style.borderRadius = '8px'
                    ghost.style.background = '#fff'
                    ghost.style.boxShadow = '0 1px 6px rgba(0,0,0,0.12)'
                    document.body.appendChild(ghost)
                    e.dataTransfer.setDragImage(ghost, 0, 0)
                    requestAnimationFrame(() => setTimeout(() => ghost.remove(), 0))
                  }}
                >
                  <div className="pt-1">
                    <PrIcon state={pr.state} size={20} />
                  </div>
                  <div className="flex-col">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline"
                    >
                      #{prNumber} {pr.title}
                    </a>
                    <p className="text-xs text-text-gray">
                      {pr.assignees.map((a) => a.name).join(', ')} ·{' '}
                      {new Date(pr.createdAt).toISOString().split('T')[0]}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* PR 상세 모달: owner/repo는 URL에서 파싱, prNumber는 위에서 계산 */}
        <PrDetailModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          position={modalPosition}
          origin={modalOrigin || { x: 0, y: 0 }}
          {...(() => {
            if (!modalOpen || !modalPrNumber) {
              return { owner: '', repo: '', prNumber: 0 }
            }

            const target = prs.find((p) => p.number === modalPrNumber)
            if (!target) {
              console.warn(`PR을 찾을 수 없음: prNumber=${modalPrNumber}`)
              return { owner: '', repo: '', prNumber: modalPrNumber }
            }

            const { owner, repo } = extractOwnerRepo(target.url || '')
            if (!owner || !repo || !modalPrNumber) {
              console.warn('모달 파라미터가 유효하지 않음 - 모달을 닫습니다.')
              setTimeout(handleModalClose, 0)
              return { owner: '', repo: '', prNumber: 0 }
            }

            return { owner, repo, prNumber: modalPrNumber }
          })()}
        />
      </div>
    </section>
  )
}
