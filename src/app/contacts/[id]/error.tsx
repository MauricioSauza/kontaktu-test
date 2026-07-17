'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="mb-2 text-xl font-semibold text-foreground">Algo salió mal</h1>
      <p className="mb-4 text-muted-foreground">
        No se pudo cargar la ficha de contacto.
      </p>
      <Button onClick={() => unstable_retry()}>Reintentar</Button>
    </main>
  )
}
