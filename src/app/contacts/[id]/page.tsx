import { notFound } from 'next/navigation'
import { getBaseUrl } from '@/lib/getBaseUrl'
import type { Contact } from '@/lib/contacts'
import type { ComplianceResult } from '@/lib/compliance'
import { ContactHeader } from '@/components/contact/ContactHeader'
import { ContactActions } from '@/components/contact/ContactActions'
import { ComplianceBanner } from '@/components/compliance/ComplianceBanner'
import { Card } from '@/components/ui/card'

interface ContactDetailResponse {
  contact: Contact
  compliance: ComplianceResult
}

async function getContactDetail(id: string): Promise<ContactDetailResponse | null> {
  const baseUrl = await getBaseUrl()
  const res = await fetch(`${baseUrl}/api/contacts/${id}`, { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load contact')
  return res.json()
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getContactDetail(id)
  if (!data) notFound()

  const { contact, compliance } = data

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card className="flex flex-col gap-4 p-5">
        <ContactHeader contact={contact} />
        <ComplianceBanner result={compliance} />
        <ContactActions phone={contact.phone} email={contact.email} compliance={compliance} />
      </Card>
    </main>
  )
}
