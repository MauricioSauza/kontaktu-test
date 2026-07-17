import Link from 'next/link'
import { getBaseUrl } from '@/lib/getBaseUrl'
import { getDisplayName } from '@/features/contacts/lib/contacts'
import { ComplianceBadge } from '@/features/contacts/components/ComplianceBadge'
import type { ComplianceStatus, NormalizedSource } from '@/features/contacts/lib/compliance'
import { SOURCE_LABEL } from '@/features/contacts/lib/compliance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ContactListItem {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  source: NormalizedSource
  lastInteractionAt: string | null
  compliance: ComplianceStatus
}

async function getContactList(): Promise<ContactListItem[]> {
  const baseUrl = await getBaseUrl()
  const res = await fetch(`${baseUrl}/api/contacts`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load contacts')
  return res.json()
}

export default async function ContactsPage() {
  const contacts = await getContactList()

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-foreground">Contactos</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Última interacción</TableHead>
            <TableHead>Cumplimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/contacts/${c.id}`} className="hover:underline">
                  {getDisplayName(c)}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {SOURCE_LABEL[c.source] ?? c.source}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.lastInteractionAt
                  ? new Date(c.lastInteractionAt).toLocaleDateString('es-ES')
                  : '—'}
              </TableCell>
              <TableCell>
                <ComplianceBadge status={c.compliance} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}
