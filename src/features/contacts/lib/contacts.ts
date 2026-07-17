import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Contact } from '@/features/contacts/types'
import { formatPhoneDisplay } from '@/features/contacts/lib/normalize-phone'

const SIMULATED_LATENCY_MS = 400

/**
 * Handles: ISO 8601, dd/mm/yyyy, dd/mm/yyyy HH:mm, unix epoch seconds.
 * See c-005 (dd/mm/yyyy), c-012 (epoch seconds), c-015 (both dd/mm/yyyy forms).
 */
export function parseFlexibleDate(input: string | number): Date {
  // c-012: unix epoch seconds (not ms) — e.g. 1782259200.
  if (typeof input === 'number') {
    return new Date(input * 1000)
  }

  // ISO 8601 — e.g. "2026-07-08T10:28:00Z". Native Date parses this natively.
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return new Date(input)
  }

  // c-005/c-012/c-015: dd/mm/yyyy, optionally with " HH:mm" — e.g. "11/07/2026"
  // or "10/07/2026 18:42". Built with Date.UTC so it can't be misread as
  // mm/dd/yyyy by the runtime's locale.
  const match = input.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/
  )
  if (match) {
    const [, day, month, year, hour = '0', minute = '0'] = match
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    )
  }

  // Fallback for any other shape — let the runtime take its best guess.
  return new Date(input)
}

export function getDisplayName(c: Pick<Contact, 'full_name' | 'phone' | 'email'>): string {
  if (c.full_name?.trim()) return c.full_name.trim()
  if (c.phone) return formatPhoneDisplay(c.phone) ?? c.phone
  if (c.email) return c.email
  return 'Contacto sin nombre'
}

let cache: Contact[] | null = null

async function loadContacts(): Promise<Contact[]> {
  if (cache) return cache
  const file = await readFile(
    path.join(process.cwd(), 'src/data/contactos.json'),
    'utf-8'
  )
  cache = JSON.parse(file).contacts as Contact[]
  return cache
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getContacts(): Promise<Contact[]> {
  await delay(SIMULATED_LATENCY_MS)
  return loadContacts()
}

export async function getContact(id: string): Promise<Contact | undefined> {
  await delay(SIMULATED_LATENCY_MS)
  const contacts = await loadContacts()
  return contacts.find((c) => c.id === id)
}
