'use client'

import { useState } from 'react'
import Link from 'next/link'
import { postEmailVerification } from '@/src/lib/api/auth/email'
import AlertModal from '@/src/components/modals/alert-modal'

export default function SignUpPage() {
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const handleEmailVerification = async () => {
    if (emailLoading) return

    if (!email) {
      setError('이메일을 입력해 주세요.')
      setShowErrorModal(true)
      return
    }

    setEmailLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await postEmailVerification(email)
      setSuccess('인증 메일이 발송되었습니다.\n 이메일을 확인해주세요.')
      setShowSuccessModal(true)
    } catch (err: unknown) {
      // 기존 형태 유지하면서 안전하게 내로잉
      const msg = err instanceof Error ? err.message : ''
      let parsed: { statusCode?: number; message?: string } | null = null
      try {
        parsed = msg ? JSON.parse(msg) : null
      } catch {
        // message가 JSON이 아니면 parsed는 null로 둠
      }

      if (parsed?.statusCode === 422) {
        setError('이미 존재하는 이메일입니다.')
      } else if (parsed?.message) {
        setError(parsed.message)
      } else {
        setError(msg || '이메일 인증 요청에 실패했습니다.')
      }
      setShowErrorModal(true)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false)
  }

  const handleErrorConfirm = () => {
    setShowErrorModal(false)
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
        <div className="w-full max-w-[420px] px-6">
          <h1 className="mb-10 text-center text-3xl font-extrabold">회원가입</h1>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleEmailVerification()
            }}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              type="email"
              placeholder="이메일"
              className="mb-3 w-full rounded border border-gray-300 px-4 py-3 text-sm"
            />

            <button
              type="submit"
              className="mb-6 w-full rounded bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
              disabled={emailLoading}
            >
              인증 요청
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            이미 계정이 있나요?{' '}
            <Link href="/sign-in" className="hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </main>

      <AlertModal
        isOpen={showSuccessModal}
        title="인증 메일 발송 완료"
        message={success || ''}
        variant="success"
        onConfirm={handleSuccessConfirm}
      />

      <AlertModal
        isOpen={showErrorModal}
        title="오류"
        message={error || ''}
        variant="error"
        onConfirm={handleErrorConfirm}
      />
    </>
  )
}
