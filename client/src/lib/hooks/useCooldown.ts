'use client'

import { useCallback, useEffect, useState } from 'react'

export function useCooldown(key: string) {
  //local storage에 저장될 key 값 받기
  const [remain, setRemain] = useState(0)

  const nowSec = () => Math.floor(Date.now() / 1000) //현재 시각 계산

  const readRemain = useCallback(() => {
    const next = Number(localStorage.getItem(key) || 0)
    return Math.max(0, next - nowSec())
  }, [key]) //저장된 쿨다운 종료 시간 불러와서 남은 시간 초로 계산 후 리턴

  const start = useCallback(
    (seconds: number) => {
      const next = nowSec() + seconds //쿨 다운 시간 추가
      localStorage.setItem(key, String(next))
      setRemain(seconds) // 즉시 UI 반영
    },
    [key]
  ) //쿨다운 종료 시간 설정

  const clear = useCallback(() => {
    localStorage.removeItem(key)
    setRemain(0)
  }, [key]) //local storage 강제 해제 -> 디버깅 용

  useEffect(() => {
    setRemain(readRemain())
  }, [readRemain]) //마운트시 복구

  useEffect(() => {
    if (remain <= 0) return
    const id = setInterval(() => {
      //1초에 한번씩 실행되는 함수 생성
      const sec = readRemain() //읽어오기
      if (sec <= 0) localStorage.removeItem(key) //남은 시간 없으면 -> storage에서 key 값 지움
      setRemain(sec) //제살장
    }, 1000)
    return () => clearInterval(id) //전부 지우기
  }, [remain, readRemain, key]) //의존성 배열 -> 렌더링/이중 렌더링이 바뀔때 불림

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setRemain(readRemain())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, readRemain])

  return { remain, start, clear }
} //다른 탭에서 바뀌면 UI동기화
