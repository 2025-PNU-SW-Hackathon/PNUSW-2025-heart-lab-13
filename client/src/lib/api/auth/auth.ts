const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export interface SignUpBody {
  email: string
  username: string
}

export interface SignInBody {
  email: string
  code: string
}

//회원가입
export async function postSignUp(body: SignUpBody, token: string | null) {
  const res = await fetch(`${API_BASE}/auth/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, token })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() // { userId, username, email }
}

// 로그인
export async function postSignIn(body: SignInBody) {
  const res = await fetch(`${API_BASE}/auth/sign-in`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return
}
