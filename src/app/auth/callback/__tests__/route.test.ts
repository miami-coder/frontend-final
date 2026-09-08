import { beforeEach, describe, expect, it, vi } from 'vitest'

const setSpy = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: setSpy, get: vi.fn(), delete: vi.fn(), has: vi.fn(() => false) })),
}))

import { NextRequest } from 'next/server'
import { GET as callback } from '@/app/auth/callback/route'

beforeEach(() => setSpy.mockClear())

describe('GET /auth/callback', () => {
  it('кладе токени з query в cookie і редіректить на /', async () => {
    const res = await callback(new NextRequest('http://l/auth/callback?access=AT&refresh=RT'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://l/')
    expect(setSpy).toHaveBeenCalledWith('piyachok_session', JSON.stringify({ accessToken: 'AT', refreshToken: 'RT' }), expect.anything())
  })
  it('без параметрів — на логін з error=oauth', async () => {
    const res = await callback(new NextRequest('http://l/auth/callback'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/auth/login?error=oauth')
    expect(setSpy).not.toHaveBeenCalled()
  })
})