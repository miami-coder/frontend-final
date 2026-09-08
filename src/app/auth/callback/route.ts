import { NextRequest, NextResponse } from 'next/server'
import { setSessionCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const access = req.nextUrl.searchParams.get('access')
  const refresh = req.nextUrl.searchParams.get('refresh')
  if (access && refresh) {
    await setSessionCookie({ accessToken: access, refreshToken: refresh })
    // 302: NextResponse.redirect за замовчуванням дає 307
    return NextResponse.redirect(new URL('/', req.nextUrl.origin), 302)
  }
  return NextResponse.redirect(new URL('/auth/login?error=oauth', req.nextUrl.origin), 302)
}