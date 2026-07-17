import { Ban, FlaskConical, ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { ComplianceResult } from '@/features/contacts/lib/compliance'

const CHANNEL_LABEL: Record<string, string> = {
  voice: 'llamada',
  whatsapp: 'WhatsApp',
  email: 'email',
  matching: 'matching de propiedades',
  ai_outreach: 'contacto automatizado por IA',
}

const TITLE: Record<Exclude<ComplianceResult['status'], 'ok'>, string> = {
  blocked: 'Contacto bloqueado',
  test: 'Contacto de prueba',
  unverified: 'Consentimiento sin verificar',
}

const ICON = {
  blocked: Ban,
  test: FlaskConical,
  unverified: ShieldAlert,
} as const

export function ComplianceBanner({ result }: { result: ComplianceResult }) {
  if (result.status === 'ok') return null

  const Icon = ICON[result.status]
  const isWarning = result.status === 'unverified'

  return (
    <Alert
      variant={isWarning ? 'default' : 'destructive'}
      className={cn(
        isWarning &&
          'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400'
      )}
    >
      <Icon />
      <AlertTitle>{TITLE[result.status]}</AlertTitle>
      <AlertDescription className={cn(isWarning && 'text-amber-700/90 dark:text-amber-400/90')}>
        <ul className="list-disc pl-4">
          {result.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
        {result.preferredChannel && (
          <p className="mt-1">
            Canal permitido: <strong>{CHANNEL_LABEL[result.preferredChannel]}</strong>
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
