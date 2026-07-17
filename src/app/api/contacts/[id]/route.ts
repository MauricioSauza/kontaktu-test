import { NextRequest, NextResponse } from 'next/server'
import { getContact } from '@/lib/contacts'
import { evaluateCompliance } from '@/lib/compliance'

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/contacts/[id]'>
) {
  const { id } = await ctx.params
  const contact = await getContact(id)

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  return NextResponse.json({
    contact,
    compliance: evaluateCompliance(contact),
  })
}
