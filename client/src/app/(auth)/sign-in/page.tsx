'use client'

import { useState } from 'react'
import Link from 'next/link'
import CodeModal from '@/src/components/modals/code-modal'
import { postEmailCode } from '@/src/lib/api/auth/email'
import { useCooldown } from '@/src/lib/hooks/useCooldown'

export default function SignInPage() {
  const [form, setForm] = useState({ email: '', code: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { remain, start } = useCooldown('cooldown:send-code')

  const isEmailEmpty = !form.email.trim()

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.currentTarget.value })

  const handelCode = async () => {
    if (remain > 0 || loading) return

    try {
      setLoading(true)
      setError(null)
      await postEmailCode(form.email)
      start(60) //성공시 1분 쿨다운
      setOpen(true)
    } catch (err: unknown) {
      // 기존 로직 유지: message를 JSON.parse 시도
      let parsed: { statusCode?: number; message?: string } | null = null
      const msg = err instanceof Error ? err.message : ''

      try {
        parsed = msg ? JSON.parse(msg) : null
      } catch {
        // message가 JSON이 아니면 무시하고 아래 분기 사용
      }

      if (parsed?.statusCode === 404) {
        setError('등록되지 않은 이메일입니다. 다시 확인해주세요.')
      } else if (parsed?.message) {
        setError(parsed.message)
      } else {
        const fallback = msg || '이메일 코드 발송 실패'
        setError(fallback)
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
      <div className="w-full max-w-[420px] px-6">
        <h1 className="mb-10 text-center text-3xl font-extrabold">Moti</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault() // 새로고침 방지
            handelCode() // 버튼과 동일한 로직 실행
          }}
        >
          <input
            value={form.email}
            onClick={() => setError(null)}
            onChange={handleChange('email')}
            type="text"
            placeholder="이메일"
            className="mb-3 w-full rounded border border-gray-300 px-4 py-3 text-sm"
          />

          <button
            type="submit"
            disabled={loading || isEmailEmpty || remain > 0}
            className="mb-6 w-full rounded bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {remain > 0 ? `재전송 (${remain}s)` : loading ? '전송 중…' : '인증코드 보내기'}
          </button>
        </form>

        {/* 보조 링크: 쿨다운 중이라도 이미 받은 코드를 입력할 수 있게 */}
        <div className="mb-8 text-sm text-gray-600">
          이미 코드를 받으셨나요?{' '}
          <button
            onClick={() => setOpen(true)}
            className="underline disabled:opacity-50"
            disabled={!remain}
          >
            코드 입력하기
          </button>
        </div>

        <CodeModal open={open} email={form.email} onClose={() => setOpen(false)} />

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <Link href="/sign-up" className="hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </main>
  )
}
