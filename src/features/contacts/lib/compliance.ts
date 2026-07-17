import type { Contact } from '@/features/contacts/types'

export type ComplianceStatus = 'blocked' | 'test' | 'unverified' | 'ok'
export type Channel = 'voice' | 'whatsapp' | 'email' | 'matching' | 'ai_outreach'
export type NormalizedSource =
  | 'voice'
  | 'whatsapp'
  | 'website'
  | 'meta_ads'
  | 'witei'
  | 'crm'
  | 'unknown'

export interface ComplianceResult {
  status: ComplianceStatus
  reasons: string[]
  blocked: Channel[]
  allowed: Channel[]
  preferredChannel?: Channel
}

const ALL_CHANNELS: Channel[] = ['voice', 'whatsapp', 'email', 'matching', 'ai_outreach']
const DO_NOT_CONTACT_BLOCKED: Channel[] = ['voice', 'whatsapp', 'ai_outreach', 'matching']

// Sources whose consent basis isn't verified — add a new one here, no other
// code needs to change.
const UNVERIFIED_SOURCES = new Set<NormalizedSource>(['witei', 'crm', 'unknown'])

interface DoNotContactSignal {
  pattern: RegExp
  reason: string
}

// Add a new do-not-contact phrasing by pushing one entry here — no other
// code needs to change.
const DO_NOT_CONTACT_TAG_SIGNALS: DoNotContactSignal[] = [
  { pattern: /no.?llamar/i, reason: 'etiquetado como "no llamar"' },
]

const DO_NOT_CONTACT_TEXT_SIGNALS: DoNotContactSignal[] = [
  { pattern: /dejen de (llamar|contactar)/i, reason: 'pidió que dejen de contactarle' },
  { pattern: /no me (llam|contact)/i, reason: 'pidió que no le contacten' },
]

const EMAIL_ONLY_SIGNAL: DoNotContactSignal = {
  pattern: /solo.*email/i,
  reason: 'pidió contacto solo por email',
}

// Add a new raw lead_source variant by adding one entry here — no other
// code needs to change.
const SOURCE_ALIASES: Record<string, NormalizedSource> = {
  voice_call: 'voice',
  llamada: 'voice',
  voz: 'voice',
  whatsapp: 'whatsapp',
  website: 'website',
  meta_lead_ads: 'meta_ads',
  witei: 'witei',
  crm: 'crm',
}

export function normalizeSource(leadSource: string | null | undefined): NormalizedSource {
  if (!leadSource) return 'unknown'
  return SOURCE_ALIASES[leadSource.toLowerCase()] ?? 'unknown'
}

export const SOURCE_LABEL: Record<NormalizedSource, string> = {
  voice: 'Llamada',
  whatsapp: 'WhatsApp',
  website: 'Formulario web',
  meta_ads: 'Meta Ads',
  witei: 'Importado (Witei)',
  crm: 'Importado (CRM)',
  unknown: 'Origen desconocido',
}

function textBlobs(c: Contact): string[] {
  return [c.notes, ...c.interactions.map((i) => i.content)].filter(
    (t): t is string => !!t
  )
}

function findDoNotContactSignal(c: Contact): { reasons: string[]; emailOnly: boolean } {
  const reasons: string[] = []
  let emailOnly = false

  if (c.matching_enabled === false) {
    reasons.push('matching desactivado para este contacto')
  }

  const tags = c.tags ?? []
  for (const signal of DO_NOT_CONTACT_TAG_SIGNALS) {
    if (tags.some((t) => signal.pattern.test(t))) {
      reasons.push(signal.reason)
    }
  }

  for (const blob of textBlobs(c)) {
    for (const signal of DO_NOT_CONTACT_TEXT_SIGNALS) {
      if (signal.pattern.test(blob)) {
        reasons.push(`${signal.reason}: "${blob}"`)
      }
    }
    if (EMAIL_ONLY_SIGNAL.pattern.test(blob)) {
      emailOnly = true
      reasons.push(`${EMAIL_ONLY_SIGNAL.reason}: "${blob}"`)
    }
  }
  return { reasons, emailOnly }
}

/** Precedence: blocked > test > unverified > ok. */
export function evaluateCompliance(c: Contact): ComplianceResult {
  const { reasons, emailOnly } = findDoNotContactSignal(c)
  if (reasons.length > 0) {
    return {
      status: 'blocked',
      reasons,
      blocked: DO_NOT_CONTACT_BLOCKED,
      allowed: emailOnly ? ['email'] : [],
      preferredChannel: emailOnly ? 'email' : undefined,
    }
  }

  if (c.is_test) {
    return {
      status: 'test',
      reasons: ['contacto de prueba — nunca contactar'],
      blocked: ALL_CHANNELS,
      allowed: [],
    }
  }

  const source = normalizeSource(c.lead_source)
  if (UNVERIFIED_SOURCES.has(source)) {
    return {
      status: 'unverified',
      reasons: ['origen importado — base de consentimiento sin verificar'],
      blocked: [],
      allowed: ALL_CHANNELS,
    }
  }

  return { status: 'ok', reasons: [], blocked: [], allowed: ALL_CHANNELS }
}
