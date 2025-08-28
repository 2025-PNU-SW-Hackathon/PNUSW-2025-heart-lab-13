// components/panels/jira-panel.tsx
'use client'

import { useState, Fragment, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { TaskIcon, JAvatarIcon, KAvatarIcon, MAvatarIcon } from '../icons/jira-icons'
import JiraTaskDetailModal from '@/src/components/modals/jira-taskdetail-modal'
import { YearMonthListbox } from '@/src/components/date/year-month-listbox'
import { YearMonthValue } from '@/src/lib/utils/date'
import { isEmptyYM } from '@/src/lib/utils/date'

// 프로젝트 목록
const mockProjects = [
  { id: 'proj1', name: '성과관리 MVP' },
  { id: 'proj2', name: 'PLATFORM' },
  { id: 'proj3', name: 'INFRA' },
  { id: 'proj4', name: '모바일 앱' },
  { id: 'proj5', name: '웹 대시보드' }
]

const mockTasks = [
  {
    id: 'JIRA-101',
    title: 'Github 연동 칩 생성',
    author: '이준영 ',
    epic: 'MVP-4',
    createdAt: '2025-08-26',
    status: 'in-progress'
  },
  {
    id: 'JIRA-102',
    title: '성과 작성 시트 관리 기능',
    author: '이준영 ',
    epic: 'MVP-8',
    createdAt: '2025-08-25',
    status: 'done'
  },
  {
    id: 'JIRA-103',
    title: '성과 모델 생성',
    author: '김륜영',
    epic: 'MVP-13',
    createdAt: '2025-08-24',
    status: 'todo'
  },
  {
    id: 'JIRA-105',
    title: '조회 API 필터 인터페이스',
    author: '문진서',
    epic: 'MVP-26',
    createdAt: '2025-08-22',
    status: 'done'
  },
  {
    id: 'JIRA-104',
    title: '수정 서비스 로직 생성',
    author: '김륜영',
    epic: 'MVP-15',
    createdAt: '2025-08-23',
    status: 'in-progress'
  },
  {
    id: 'JIRA-106',
    title: 'sign-in 이메일 인증 기능',
    author: '문진서',
    epic: 'MVP-24',
    createdAt: '2025-08-22',
    status: 'done'
  },
  {
    id: 'JIRA-107',
    title: 'rich note 수정',
    author: '이준영 ',
    epic: 'MVP-11',
    createdAt: '2025-08-26',
    status: 'in-progress'
  }
]

export default function JiraPanel() {
  const [projectSelected, setProjectSelected] = useState<string>('성과관리 MVP')
  const [tasks, setTasks] = useState(mockTasks)
  // 단계적 로딩: 1) 프로젝트 드롭다운 2) 하단(날짜/버튼/리스트)
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingRest, setLoadingRest] = useState(true)
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [modalOrigin, setModalOrigin] = useState<{ x: number; y: number } | null>(null)
  const [modalTaskId, setModalTaskId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // 최초 마운트 시: 프로젝트 표시와 동시에 날짜 필터/초기화도 활성화
  useEffect(() => {
    const t = setTimeout(() => {
      setLoadingProject(false)
      setLoadingRest(false)
    }, 300)
    return () => clearTimeout(t)
  }, [])

  // 날짜 필터
  const [fromYM, setFromYM] = useState<YearMonthValue>({})
  const [toYM, setToYM] = useState<YearMonthValue>({})
  const canResetDate = !isEmptyYM(fromYM) || !isEmptyYM(toYM)

  // 프로젝트 변경 시 데이터 필터링 (시뮬레이션)
  const handleProjectChange = (projectName: string) => {
    setProjectSelected(projectName)
    setLoadingRest(true)
    setTimeout(() => {
      if (projectName === 'All Projects') {
        setTasks(mockTasks)
      } else {
        // 실제로는 API 호출로 해당 프로젝트의 태스크를 가져올 것
        setTasks(mockTasks.filter((task) => task.epic.includes('MVP')))
      }
      setLoadingRest(false)
    }, 200)
  }

  // 호버 모달 핸들러
  const handleTaskHover = (event: React.MouseEvent, taskId: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = { x: rect.left + rect.width / 2, y: rect.top }
    const pointer = { x: event.clientX, y: event.clientY }
    const timeout = setTimeout(() => {
      setModalPosition(position)
      setModalOrigin(pointer)
      setModalTaskId(taskId)
      setModalOpen(true)
    }, 500)
    setHoverTimeout(timeout)
  }

  const handleTaskLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalTaskId(null)
    setModalOrigin(null)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  return (
    <section className="w-full">
      <div
        className="px-6 border-b border-main-gray mb-3 justify-center items-center flex flex-col"
        aria-label="프로젝트 선택 및 필터"
      >
        {/* 프로젝트 드롭다운: 단계적 로딩 적용 */}
        {/* 로딩 중에는 Headless UI 컴포넌트 사용하지 않음 */}
        {loadingProject ? (
          <div className="relative w-full">
            <div className="flex w-full items-center justify-between rounded border border-main-gray px-3 py-2 mb-3 text-sm opacity-50">
              <span className="pl-2 text-gray-500">Jira loading...</span>
              <ChevronUpDownIcon className="h-4 w-4 flex-none opacity-60" />
            </div>
          </div>
        ) : (
          <Listbox value={projectSelected} onChange={handleProjectChange}>
            {({ open }) => (
              <div className="relative w-full">
                <Listbox.Button className="flex w-full items-center justify-between rounded border border-main-gray px-3 py-2 mb-3 text-sm">
                  <span className="pl-2">{projectSelected || '프로젝트 선택'}</span>
                  <ChevronUpDownIcon className="h-4 w-4 flex-none opacity-60" />
                </Listbox.Button>
                <Transition as={Fragment} show={open}>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
                    <Listbox.Option
                      value="All Projects"
                      className={({ active }) =>
                        `flex cursor-pointer items-center px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`
                      }
                    >
                      {projectSelected === 'All Projects' && (
                        <CheckIcon className="mr-1 h-4 w-4 text-emerald-600" />
                      )}
                      All Projects
                    </Listbox.Option>
                    {mockProjects.map((project) => (
                      <Listbox.Option
                        key={project.id}
                        value={project.name}
                        className={({ active }) =>
                          `flex cursor-pointer items-center px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`
                        }
                      >
                        {projectSelected === project.name && (
                          <CheckIcon className="mr-1 h-4 w-4 text-emerald-600" />
                        )}
                        {project.name}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>
        )}

        {/* 날짜 필터: 프로젝트 다음 단계에서 표시 */}
        {loadingRest ? (
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
        ) : (
          <div className="w-full h-fit flex justify-between mb-3" aria-label="기간 필터">
            <YearMonthListbox
              value={fromYM}
              onChange={setFromYM}
              isFromField={true}
              toValue={toYM}
            />
            <span className="mx-[6px] inline-flex select-none items-center text-[16px] leading-none text-[#888] font-normal">
              ∼
            </span>
            <YearMonthListbox value={toYM} onChange={setToYM} isToField={true} fromValue={fromYM} />
          </div>
        )}

        {loadingRest ? (
          <button
            className="mb-8 w-full rounded bg-gray-300 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
            disabled
          >
            날짜 초기화
          </button>
        ) : (
          <button
            className="mb-8 w-full rounded bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
            disabled={!canResetDate}
            onClick={() => {
              setFromYM({})
              setToYM({})
            }}
          >
            날짜 초기화
          </button>
        )}
      </div>

      {/* 태스크 리스트: 마지막 단계에서 표시 */}
      <div aria-label="태스크 리스트">
        {loadingRest ? (
          <div className="px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-row py-3 gap-5 border-b border-main-gray">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tasks.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">
                해당 프로젝트에 태스크가 없습니다.
              </p>
            )}
            {tasks.length > 0 && (
              <ul className="divide-y divide-main-gray">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="group flex flex-row px-4 py-3 relative gap-5"
                    onMouseEnter={(e) => handleTaskHover(e, task.id)}
                    onMouseLeave={handleTaskLeave}
                    draggable
                    onDragStart={(e) => {
                      const dragData = {
                        type: 'jira_task',
                        id: task.id,
                        title: task.title,
                        epic: task.epic,
                        author: task.author
                      }
                      e.dataTransfer.setData('application/json', JSON.stringify(dragData))
                      e.dataTransfer.setData('text/plain', `${task.id}: ${task.title}`)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-row gap-2 items-center justify-center">
                        <TaskIcon />
                        <div className="text-sm font-semibold group-hover:underline underline-offset-2">
                          {task.title}
                        </div>
                      </div>
                      <p className="text-xs inline-flex items-center gap-2 ">
                        {task.author.trim() === '이준영' && <JAvatarIcon />}
                        {task.author.trim() === '김륜영' && <KAvatarIcon />}
                        {task.author.trim() === '문진서' && <MAvatarIcon />}
                        <span className="underline underline-offset-2 decoration-main-gray">
                          {task.author}
                        </span>
                      </p>
                      <p className="text-xs">{task.epic}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <JiraTaskDetailModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        position={modalPosition}
        origin={modalOrigin || { x: 0, y: 0 }}
        task={(() => {
          if (!modalOpen || !modalTaskId) return null
          const t = tasks.find((it) => it.id === modalTaskId) || null
          return t
        })()}
      />
    </section>
  )
}
