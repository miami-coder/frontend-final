'use client'

// Глобальна межа помилок рендерингу (конвенція файлів Next.js — error.tsx у корені app).
// reset() повторно рендерить сегмент, що впав
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Щось пішло не так</h1>
      <p className="mt-2 text-stone-500">Сервіс тимчасово недоступний. Спробуйте ще раз.</p>
      <button className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600" onClick={reset}>
        Повторити
      </button>
    </div>
  )
}