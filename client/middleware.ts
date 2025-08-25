// /middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1) 쿠키 확인
  const token = req.cookies.get('w_auth')?.value
  const isAuth = Boolean(token)

  // 2) 경로별 제어
  const { pathname } = req.nextUrl
  if (!isAuth && pathname.startsWith('/report')) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  if (isAuth && (pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/report', req.url))
  }

  // 3) 통과
  return NextResponse.next()
}

// 4) 어느 경로에 적용할지
export const config = {
  matcher: ['/report', '/sign-in', '/sign-up']
}
