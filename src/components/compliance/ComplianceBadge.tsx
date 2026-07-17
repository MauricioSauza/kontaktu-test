import { Ban, FlaskConical, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ComplianceStatus } from '@/lib/compliance'

const CONFIG: Partial<
  Record<ComplianceStatus, { label: string; icon: typeof Ban; className: string }>
> = {
  blocked: {
    label: 'No llamar',
    icon: Ban,
    className: 'bg-destructive/10 text-destructive',
  },
  test: {
    label: 'Prueba',
    icon: FlaskConical,
    className: 'bg-muted text-muted-foreground',
  },
  unverified: {
    label: 'Sin verificar',
    icon: ShieldAlert,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
}

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const config = CONFIG[status]
  if (!config) return null

  const Icon = config.icon
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
