'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/user-provider'
import { Button } from '@/components/ui/button'

export function Header() {
  const { user, logout } = useUser()
  const router = useRouter()

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-600">🍺 Пиячок</Link>
        <nav className="flex gap-4 text-stone-600">
          <Link className="hover:text-brand-600" href="/">Каталог</Link>
        </nav>
        <form
          className="ml-auto hidden sm:block"
          onSubmit={(e) => {
            e.preventDefault()
            const q = new FormData(e.currentTarget).get('q')
            router.push(`/venues?q=${encodeURIComponent(String(q ?? ''))}`)
          }}
        >
          <input
            name="q"
            placeholder="Пошук закладів…"
            aria-label="Пошук закладів"
            className="w-56 rounded-lg border border-stone-300 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
          />
        </form>
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/account" className="text-stone-700 hover:text-brand-600">{user.email}</Link>
            <Button variant="secondary" size="sm" onClick={() => logout()}>Вийти</Button>
          </div>
        ) : (
          <Link href="/auth/login"><Button size="sm">Увійти</Button></Link>
        )}
      </div>
    </header>
  )
}