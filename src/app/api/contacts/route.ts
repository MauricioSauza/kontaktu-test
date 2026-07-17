import { NextResponse } from 'next/server'
import { getContacts, parseFlexibleDate } from '@/lib/contacts'
import { evaluateCompliance, normalizeSource } from '@/lib/compliance'

export async function GET() {
  const contacts = await getContacts()

  const list = contacts.map((c) => {
    const lastInteraction = c.interactions.length
      ? c.interactions
          .map((i) => parseFlexibleDate(i.created_at))
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : null

    return {
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      source: normalizeSource(c.lead_source),
      lastInteractionAt: lastInteraction?.toISOString() ?? null,
      compliance: evaluateCompliance(c).status,
    }
  })

  return NextResponse.json(list)
}
