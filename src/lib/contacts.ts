import { readFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert'

export interface Interaction {
  id: string
  channel: string
  direction: 'inbound' | 'outbound'
  created_at: string | number
  content: string
  metadata: Record<string, unknown> | null
}

export interface Contact {
  id: string
  organization_id: string
  full_name: string | null
  phone: string | null
  email: string | null
  lead_source: string | null
  contact_type: string | null
  created_at: string | number
  ai_handoff: boolean
  is_test: boolean
  assigned_agent_id: string | null
  matching_enabled: boolean
  tags: string[] | null
  notes: string | null
  // Not needed for US10 (R3 owns rendering it); shape varies (object|string|null).
  qualification_data: unknown
  interest_preferences: Record<string, unknown> | null
  interactions: Interaction[]
}

const SIMULATED_LATENCY_MS = 400

/**
 * Handles: ISO 8601, dd/mm/yyyy, dd/mm/yyyy HH:mm, unix epoch seconds.
 * See c-005 (dd/mm/yyyy), c-012 (epoch seconds), c-015 (both dd/mm/yyyy forms).
 */
export function parseFlexibleDate(input: string | number): Date {
  if (typeof input === 'number') {
    return new Date(input * 1000)
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return new Date(input)
  }

  const match = input.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/
  )
  if (match) {
    const [, day, month, year, hour = '0', minute = '0'] = match
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    )
  }

  return new Date(input)
}

export function getDisplayName(c: Pick<Contact, 'full_name' | 'phone' | 'email'>): string {
  if (c.full_name?.trim()) return c.full_name.trim()
  if (c.phone) return c.phone
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

function demo() {
  assert.equal(
    parseFlexibleDate('2026-07-08T10:28:00Z').toISOString(),
    '2026-07-08T10:28:00.000Z',
    'ISO date should parse as-is'
  )
  assert.equal(
    parseFlexibleDate('11/07/2026').toISOString(),
    '2026-07-11T00:00:00.000Z',
    'dd/mm/yyyy should parse (c-005)'
  )
  assert.equal(
    parseFlexibleDate('10/07/2026 18:42').toISOString(),
    '2026-07-10T18:42:00.000Z',
    'dd/mm/yyyy HH:mm should parse (c-015 interaction)'
  )
  assert.equal(
    parseFlexibleDate(1782259200).toISOString(),
    '2026-06-24T00:00:00.000Z',
    'unix epoch seconds should parse (c-012)'
  )
  console.log('contacts.ts self-check: OK')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demo()
}
