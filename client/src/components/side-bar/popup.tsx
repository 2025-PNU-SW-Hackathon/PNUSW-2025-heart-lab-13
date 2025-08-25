import type { ServiceKey } from '@/src/lib/constants/services'

export interface PopupHandle {
  window: Window | null
  close: () => void
  isClosed: () => boolean
}

export interface PopupOptions {
  width?: number
  height?: number
  centerScreen?: boolean
}

const DEFAULT_OPTIONS: Required<PopupOptions> = {
  width: 600,
  height: 700,
  centerScreen: true
}

export const openPopup = (url: string, name: string, options: PopupOptions = {}): PopupHandle => {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const features = [
    `width=${config.width}`,
    `height=${config.height}`,
    'scrollbars=yes',
    'resizable=yes',
    'status=yes',
    'location=yes',
    'toolbar=no',
    'menubar=no'
  ]

  if (config.centerScreen) {
    const left = window.screen.width / 2 - config.width / 2
    const top = window.screen.height / 2 - config.height / 2
    features.push(`left=${left}`, `top=${top}`)
  }

  const popup = window.open(url, name, features.join(','))

  return {
    window: popup,
    close: () => popup?.close(),
    isClosed: () => !popup || popup.closed
  }
}

export const waitForClose = (handle: PopupHandle, interval = 1000): Promise<void> => {
  return new Promise((resolve) => {
    const checkClosed = setInterval(() => {
      if (handle.isClosed()) {
        clearInterval(checkClosed)
        resolve()
      }
    }, interval)
  })
}

// 유틸: 연결 상태가 true가 될 때까지 폴링
export function waitUntilConnected(
  isConnected: (s: ServiceKey) => boolean,
  selected: ServiceKey,
  loadUserData: () => Promise<void>,
  { intervalMs = 1000, timeoutMs = 120000 } = {}
) {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now()
    const timer = setInterval(async () => {
      try {
        await loadUserData() // 서버 상태 재조회
        if (isConnected(selected)) {
          clearInterval(timer)
          resolve()
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(timer)
          reject(new Error('연동 확인 타임아웃'))
        }
      } catch {
        // 일시 오류는 무시하고 계속 폴링
        if (Date.now() - started > timeoutMs) {
          clearInterval(timer)
          reject(new Error('연동 확인 실패'))
        }
      }
    }, intervalMs)
  })
}
