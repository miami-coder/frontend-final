import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionTokens, setSessionCookie, refreshTokens, SESSION_COOKIE, sessionCookieOptions, encodeTokens,
} from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

type Ctx = { params: Promise<{ path: string[] }> }

async function forward(req: NextRequest, path: string[], accessToken: string | null): Promise<Response> {
  // search з req.url — однаково працює і для NextRequest, і для plain Request у тестах
  const target = `${BACKEND}/api/v1/${path.join('/')}${new URL(req.url).search}`
  const headers = new Headers()
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  return fetch(target, {
    method: req.method,
    headers,
    body: req.body ?? undefined,
    // @ts-expect-error duplex потрібен для стрімінгового body
    duplex: 'half',
  })
}

async function passthrough(res: Response, newTokens?: string): Promise<NextResponse> {
  const body = await res.arrayBuffer()
  const out = new NextResponse(body, {
    status: res.status,
    headers: res.headers.has('content-type') ? { 'content-type': res.headers.get('content-type')! } : undefined,
  })
  if (newTokens) out.cookies.set(SESSION_COOKIE, newTokens, sessionCookieOptions())
  return out
}

async function handle(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { path } = await ctx.params
  const tokens = await getSessionTokens()

  let backendRes = await forward(req, path, tokens?.accessToken ?? null)

  // Авто-refresh при 401 (окрім самого refresh-ендпоінта — його клієнти не викликають)
  if (backendRes.status === 401 && tokens?.refreshToken && path.join('/') !== 'auth/refresh') {
    const fresh = await refreshTokens(tokens.refreshToken)
    if (fresh) {
      // ротація cookie (можлива лише в route handlers) до повторного запиту
      await setSessionCookie(fresh)
      backendRes = await forward(req, path, fresh.accessToken)
      return passthrough(backendRes, encodeTokens(fresh))
    }
  }
  return passthrough(backendRes)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle