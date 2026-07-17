import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="mb-2 text-xl font-semibold text-foreground">Contacto no encontrado</h1>
      <p className="mb-4 text-muted-foreground">
        No existe ningún contacto con ese identificador.
      </p>
      <Link href="/contacts" className="text-primary hover:underline">
        Volver al listado
      </Link>
    </main>
  )
}
