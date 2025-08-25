'use client'

import { useEffect } from 'react'
import { SERVICES } from '@/src/lib/constants/services'
import type { ServiceKey } from '@/src/lib/constants/services'
import { useAppStore } from '@/src/store/user-store'
import { prepareOAuth } from '@/src/lib/services/oauth-service'
import { openPopup, waitForClose, waitUntilConnected } from './popup'
import { loadUserData } from '@/src/lib/services/user-service'
import GithubPanel from '../panels/github-panel'
import JiraPanel from '../panels/jira-panel'
import NotionPanel from '../panels/notion-panel'
import { useShallow } from 'zustand/react/shallow'
import clsx from 'clsx'

// 서비스별 패널 컴포넌트
const ServicePanel = ({ service }: { service: ServiceKey }) => {
  if (service === 'Github') return <GithubPanel />
  if (service === 'Jira') return <JiraPanel />
  if (service === 'Notion') return <NotionPanel />

  // Jira, Notion 등 필요시 분기 추가
  return null
}

const Sidebar = () => {
  // 스토어에서 상태와 액션 가져오기
  const { selected, setSelected, isConnected, user } = useAppStore(
    useShallow((store) => ({
      selected: store.selected,
      setSelected: store.setSelected,
      isConnected: store.isConnected,
      user: store.user
    }))
  )

  // 최초 마운트 시 사용자 데이터 로드
  useEffect(() => {
    if (!user) {
      loadUserData().catch((error) => {
        // 401 에러인 경우 무시 (로그인이 안 된 상태)
        if (error instanceof Error && error.message.includes('401')) {
          console.log('로그인되지 않은 상태입니다.')
        }
      })
    }
  }, [user])

  // 컴포넌트 내부
  const handleConnect = async () => {
    if (isConnected(selected)) return
    try {
      const { url } = await prepareOAuth(selected)
      const popup = openPopup(url, `${selected}_oauth`)
      if (!popup.window) {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.')
        return
      }

      // 1) 팝업이 닫힘을 감시
      const closed = waitForClose(popup)

      // 2) 서버 상태가 "연동됨"으로 바뀔 때까지 폴링
      const connected = waitUntilConnected(isConnected, selected, loadUserData, {
        intervalMs: 1200, // 폴링 주기
        timeoutMs: 120000 // 최대 2분
      })

      // 먼저 끝나는 쪽을 기다림
      await Promise.race([closed, connected])

      // 연동 성공했으면 팝업 닫기(열려있다면)
      if (!popup.isClosed() && isConnected(selected)) popup.close()

      // 마지막으로 UI 반영
      await loadUserData()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : '연동 오류')
    }
  }

  return (
    <div
      className="flex h-full flex-col bg-white border-x border-border-color"
      role="complementary"
      aria-label="서비스 연동 사이드바"
    >
      {/* 탭 버튼 - 고정 */}
      <div
        className="flex gap-3 py-4 px-[38px] flex-shrink-0"
        role="tablist"
        aria-label="서비스 선택"
      >
        {SERVICES.map(({ key, label }) => {
          const isServiceConnected = isConnected(key)
          const isSelected = selected === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={clsx(
                'flex-1 basis-0 rounded-sm border px-6 py-2 text-sm transition-colors',
                isSelected && isServiceConnected
                  ? 'bg-black text-white border-black'
                  : isSelected
                    ? 'bg-selected-color text-text-gray'
                    : 'bg-white text-text-gray hover:bg-gray-50'
              )}
              aria-selected={isSelected}
              aria-label={`${label} 탭`}
              tabIndex={0}
              role="tab"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(key)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 본문 영역 - 스크롤 가능 */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {!isConnected(selected) ? (
          <div className="px-6 py-6" aria-label="연동되지 않은 계정">
            <p className="text-sm text-gray-500 text-center mt-12" aria-live="polite">
              &ldquo;{selected}&rdquo; 계정이 아직 연동되지 않았습니다
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="w-full rounded-sm border py-2 bg-white hover:bg-selected-color mt-4"
              aria-label={`${selected} 연동하기`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleConnect()
              }}
            >
              연동하기
            </button>
          </div>
        ) : (
          <div className="flex-1">
            <ServicePanel service={selected} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
