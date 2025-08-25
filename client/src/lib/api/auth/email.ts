const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** 이메일 인증 코드 발송 */
export async function postEmailVerification(email: string) {
  const res = await fetch(`${API_BASE}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!res.ok) throw new Error(await res.text())
  return
}

/** 이메일 인증 코드 확인 */
export async function postEmailCode(email: string) {
  const res = await fetch(`${API_BASE}/auth/sign-in/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!res.ok) throw new Error(await res.text())
  return
}
