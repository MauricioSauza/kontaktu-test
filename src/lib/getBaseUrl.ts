import { headers } from 'next/headers'

export async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('host')
  const protocol = h.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}
