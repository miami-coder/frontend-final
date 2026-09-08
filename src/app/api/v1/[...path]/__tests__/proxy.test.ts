import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStore: { value: string | undefined } = { value: undefined }

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (name === 'piyachok_session' ? { value: cookieStore.value } : undefined),
    set: (name: string, value: string) => { if (name === 'piyachok_session') cookieStore.value = value },
  })),
}))

import { GET as proxyGet } from '@/app/api/v1/[...path]/route'

const jsonRes = (body: unknown, status = 200, headers: Record<string, string> = { 'content-type': 'application/json' }) =>
  new Response(JSON.stringify(body), { status, headers })

const makeCtx = (path: string[]) => ({ params: Promise.resolve({ path }) })

beforeEach(() => {
  cookieStore.value = JSON.stringify({ accessToken: 'OLD_AT', refreshToken: 'REF' })
  vi.restoreAllMocks()
})

describe('проксі /api/v1', () => {
  it('додає Authorization з cookie і проксує відповідь', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Headers).get('Authorization')).toBe('Bearer OLD_AT')
      return jsonRes({ data: { ok: 1 } })
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = await proxyGet(new Request('http://l/api/v1/auth/me') as never, makeCtx(['auth', 'me']) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { ok: 1 } })
  })

  it('при 401 робить refresh, оновлює cookie і повторює запит', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes({ error: { code: 'UNAUTHORIZED', message: 'x', details: null } }, 401))
      .mockResolvedValueOnce(jsonRes({ accessToken: 'NEW_AT', refreshToken: 'NEW_RT' }, 201)) // /auth/refresh
      .mockResolvedValueOnce(jsonRes({ data: { id: 'u1' } }))                                  // retry /auth/me
    vi.stubGlobal('fetch', fetchMock)
    const res = await proxyGet(new Request('http://l/api/v1/auth/me') as never, makeCtx(['auth', 'me']) as never)
    expect(res.status).toBe(200)
    expect(cookieStore.value).toBe(JSON.stringify({ accessToken: 'NEW_AT', refreshToken: 'NEW_RT' }))
    const retryInit = fetchMock.mock.calls[2][1] as RequestInit
    expect((retryInit.headers as Headers).get('Authorization')).toBe('Bearer NEW_AT')
  })

  it('мертвий refresh → проксує 401', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes({ error: { code: 'UNAUTHORIZED', message: 'x', details: null } }, 401))
      .mockResolvedValueOnce(jsonRes({ error: { code: 'UNAUTHORIZED', message: 'x', details: null } }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const res = await proxyGet(new Request('http://l/api/v1/auth/me') as never, makeCtx(['auth', 'me']) as never)
    expect(res.status).toBe(401)
  })

  it('без сесії не додає Authorization', async () => {
    cookieStore.value = undefined
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Headers).get('Authorization')).toBeNull()
      return jsonRes({ data: [] })
    })
    vi.stubGlobal('fetch', fetchMock)
    await proxyGet(new Request('http://l/api/v1/venues') as never, makeCtx(['venues']) as never)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})