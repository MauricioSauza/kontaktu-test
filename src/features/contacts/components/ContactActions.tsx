import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Channel, ComplianceResult } from '@/features/contacts/lib/compliance'

// Minimal href-only cleanup (display keeps the raw string) — full phone
// normalization is out of scope for US10, owned by a separate user story.
function cleanDigits(phone: string) {
  return phone.replace(/\D/g, '')
}

interface ActionDef {
  channel: Channel
  label: string
  icon: typeof Phone
  href: string | null
  external?: boolean
}

export function ContactActions({
  phone,
  email,
  compliance,
}: {
  phone: string | null
  email: string | null
  compliance: ComplianceResult
}) {
  const actions: ActionDef[] = [
    {
      channel: 'voice',
      label: 'Llamar',
      icon: Phone,
      href: phone ? `tel:+${cleanDigits(phone)}` : null,
    },
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: phone ? `https://wa.me/${cleanDigits(phone)}` : null,
      external: true,
    },
    {
      channel: 'email',
      label: 'Email',
      icon: Mail,
      href: email ? `mailto:${email}` : null,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const isBlocked = compliance.blocked.includes(action.channel)
        const disabled = isBlocked || !action.href
        const reason = isBlocked
          ? compliance.reasons[0]
          : !action.href
            ? `Sin dato de contacto para ${action.label.toLowerCase()}`
            : undefined
        const Icon = action.icon

        if (disabled) {
          return (
            <Button key={action.channel} variant="outline" size="sm" disabled title={reason}>
              <Icon />
              {action.label}
            </Button>
          )
        }

        return (
          <Button
            key={action.channel}
            variant="outline"
            size="sm"
            render={
              <a
                href={action.href!}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
              />
            }
          >
            <Icon />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
