import { User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Contact } from '@/lib/contacts'
import { getDisplayName, parseFlexibleDate } from '@/lib/contacts'
import { normalizeSource } from '@/lib/compliance'

const SOURCE_LABEL: Record<string, string> = {
  voice: 'Llamada',
  whatsapp: 'WhatsApp',
  website: 'Formulario web',
  meta_ads: 'Meta Ads',
  witei: 'Importado (Witei)',
  crm: 'Importado (CRM)',
  unknown: 'Origen desconocido',
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function ContactHeader({ contact }: { contact: Contact }) {
  const name = getDisplayName(contact)
  const hasRealName = !!contact.full_name?.trim()
  const source = normalizeSource(contact.lead_source)
  const createdAt = parseFlexibleDate(contact.created_at)

  return (
    <div className="flex items-start gap-4">
      <Avatar size="lg">
        <AvatarFallback>
          {hasRealName ? getInitials(name) : <User className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{SOURCE_LABEL[source]}</Badge>
          {contact.phone && <span>{contact.phone}</span>}
          <span>Alta: {createdAt.toLocaleDateString('es-ES')}</span>
        </div>
      </div>
    </div>
  )
}
