'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect, useCallback } from 'react'
import { postSignIn } from '@/src/lib/api/auth/auth'

type Props = {
  open: boolean
  onClose: () => void
  email: string
}

export default function CodeModal({ open, onClose, email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const LENGTH = 6 //코드 6자리 고정
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''))
  const inputsRef = useRef<HTMLInputElement[]>([])
  // { email, code } 포맷으로 API 호출
  const handleSignIn = useCallback(
    async (code: string) => {
      setLoading(true)
      setError(null)
      try {
        await postSignIn({ email, code })
        router.replace('/report')
        setDigits(Array(LENGTH).fill(''))
      } catch (e) {
        const message = e instanceof Error ? e.message : '로그인 실패'
        setError(message)
        setDigits(Array(LENGTH).fill(''))
      } finally {
        setLoading(false)
      }
    },
    [email, router] // ← 이 함수가 참조하는 값만 넣기
  )
  //  모든 칸 채워지면 자동 제출
  useEffect(() => {
    const code = digits.join('')

    if (code.length === LENGTH && !loading) {
      handleSignIn(code)
    }
  }, [digits, loading, handleSignIn])

  const handleChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value
    // 한 글자만 유지, 영문/숫자만 허용, 대문자화
    const one = raw
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 1)

    setDigits((prev) => {
      const next = [...prev]
      next[index] = one
      return next
    })

    if (one && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  // 백스페이스 UX: 비어있을 때 이전 칸으로 포커스
  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // 현재 칸에 값이 있으면 그 값만 지움
        setDigits((prev) => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      } else if (index > 0) {
        // 현재 칸이 비어있으면 이전 칸으로 이동하며 그 칸도 지움
        inputsRef.current[index - 1]?.focus()
        setDigits((prev) => {
          const next = [...prev]
          next[index - 1] = ''
          return next
        })
      }
      // 기본 동작(커서 이동 등)은 막아 UX를 일관되게
      e.preventDefault()
    }
  }

  const activeIndexRef = useRef<number>(0) // 포커스 추적

  // 불필요: open 시 0번에 포커스하도록 통일. 필요 시 복원
  // const focusFirstEmpty = () => {
  //   const idx = digits.findIndex((d) => !d)
  //   const target = idx === -1 ? 0 : idx
  //   activeIndexRef.current = target
  //   inputsRef.current[target]?.focus()
  //   return target
  // }

  // 전역(모달 컨텐츠) 붙여넣기: 포커스가 없어도 동작
  const handleGlobalPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // input에 포커스가 있으면 개별 onPaste가 처리하므로 여기선 패스
    const isAnyInputFocused =
      inputsRef.current.findIndex((el) => el === document.activeElement) !== -1
    if (isAnyInputFocused) return

    e.preventDefault()
    e.stopPropagation()

    const pastedRaw = e.clipboardData.getData('text')
    if (!pastedRaw) return
    const pasted = pastedRaw.replace(/\s/g, '') // 공백 제거(선택)

    const start = 0
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < pasted.length && start + i < LENGTH; i++) {
        next[start + i] = pasted[i]
      }
      return next
    })
    const last = Math.min(start + pasted.length, LENGTH) - 1
    inputsRef.current[last]?.focus()
  }

  const handlePaste = () => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const pastedRaw = e.clipboardData.getData('text') || ''
    const pasted = pastedRaw
      .replace(/\s/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
    if (!pasted) return

    // 현재 포커스된 인풋 위치 → 없으면 첫 빈칸
    const focusedIdx = inputsRef.current.findIndex((el) => el === document.activeElement)
    const start = focusedIdx !== -1 ? focusedIdx : 0

    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < pasted.length && start + i < LENGTH; i++) {
        next[start + i] = pasted[i]
      }
      return next
    })

    const last = Math.min(start + pasted.length, LENGTH) - 1
    inputsRef.current[last]?.focus()
  }

  useEffect(() => {
    if (!open) return
    // 모달이 열릴 때 입력칸 리셋 후 첫 칸에 포커스
    setDigits(Array(LENGTH).fill(''))

    const t = setTimeout(() => {
      activeIndexRef.current = 0
      inputsRef.current[0]?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setError(null)
          onClose()
        }
      }}
    >
      <div className="w-full max-w-[720px] rounded-2xl bg-white p-8 shadow-xl">
        {/* 헤더 */}
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold">코드는 이메일에서 확인하세요</h2>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">{email}</span> 로 6자리 코드를 전송했습니다.
          </p>
        </div>
        <div className="mb-3 flex  items-center justify-center">
          {error && (
            <p className=" text-sm text-red-500">코드가 정확하지 않습니다. 다시 입력해주세요.</p>
          )}
        </div>
        {/* 입력 박스 6개 */}
        {loading ? (
          <div className="mb-6 flex flex-col items-center justify-center gap-3 py-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
            <p className="text-sm text-gray-600">확인 중입니다…</p>
          </div>
        ) : (
          <div
            className="mb-6 flex items-center justify-center gap-2"
            onPasteCapture={handleGlobalPaste}
          >
            {Array.from({ length: LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => {
                  if (el) inputsRef.current[i] = el
                }}
                value={digits[i] ?? ''} // 제어 컴포넌트
                onClick={() => setError(null)}
                onChange={handleChange(i)} // 숫자 필터 + 한 글자 유지
                onKeyDown={handleKeyDown(i)} // 백스페이스 UX
                onPaste={handlePaste()} // 복사 붙여넣기
                type="text"
                maxLength={1} // 한 글자 제한(보조용)
                className={`h-16 w-14 rounded-md border
                    text-center text-2xl tracking-widest outline-none
                    ${error ? 'border-red-300 focus:border-red-300' : 'border-gray-300 focus:border-black'}`}
              />
            ))}
          </div>
        )}

        {/* 닫기 버튼 */}
        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={() => {
              setError(null)
              onClose()
            }}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
