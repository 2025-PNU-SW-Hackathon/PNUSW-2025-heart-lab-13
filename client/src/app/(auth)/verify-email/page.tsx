'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { postSignUp } from '@/src/lib/api/auth/auth'
import AlertModal from '@/src/components/modals/alert-modal'

type Form = { email: string; username: string }

// ─────────────────────────────────────────────
// 1) 바깥(default) 컴포넌트는 Suspense 경계만 렌더
// ─────────────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  )
}

// ─────────────────────────────────────────────
// 2) 실제 로직은 내부 컴포넌트(같은 파일)에서 처리
//    여기서 useSearchParams를 사용
// ─────────────────────────────────────────────
function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [form, setForm] = useState<Form>({ email: '', username: '' })

  const setField =
    <K extends keyof Form>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget?.value ?? ''
      setForm((prev) => ({ ...prev, [key]: value }))
    }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await postSignUp(form, token)
      setShowSuccessModal(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '회원가입 실패'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false)
    router.replace('/sign-in')
  }

  useEffect(() => {
    const e = searchParams.get('email')
    const t = searchParams.get('token')

    if (!e || !t) {
      setReady(false)
      setErrorMessage('유효하지 않은 링크입니다.')
      setShowErrorModal(true)
      return
    }

    setForm((prev) => ({ ...prev, email: e }))
    setToken(t)
    setReady(true)
  }, [searchParams, router])

  const handleErrorConfirm = () => {
    setShowErrorModal(false)
    router.replace('/sign-up')
  }

  if (!ready) return null

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
        <div className="w-full max-w-[420px] px-6">
          <h1 className="mb-10 text-center text-3xl font-extrabold">회원가입</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
          >
            <input
              value={form.email}
              readOnly
              className="mb-3 w-full rounded border border-gray-300 px-4 py-3 text-sm"
            />
            <input
              value={form.username}
              onChange={setField('username')}
              placeholder="이름(닉네임)"
              className="mb-3 w-full rounded border border-gray-300 px-4 py-3 text-sm"
            />

            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mb-6 w-full rounded bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? '가입 중…' : '가입하기'}
            </button>
          </form>
        </div>
      </main>

      <AlertModal
        isOpen={showSuccessModal}
        title="회원가입 완료"
        message="회원가입이 성공적으로 완료되었습니다.\n로그인 페이지로 이동합니다."
        variant="success"
        onConfirm={handleSuccessConfirm}
      />

      <AlertModal
        isOpen={showErrorModal}
        title="오류"
        message={errorMessage}
        variant="error"
        onConfirm={handleErrorConfirm}
      />
    </>
  )
}
