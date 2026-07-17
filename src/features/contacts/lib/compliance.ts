import assert from 'node:assert'
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
const DNC_BLOCKED: Channel[] = ['voice', 'whatsapp', 'ai_outreach', 'matching']

const DNC_TAG = /no.?llamar/i
const DNC_PHRASES = [/dejen de (llamar|contactar)/i, /no me (llam|contact)/i]
const EMAIL_ONLY_PHRASE = /solo.*email/i

export function normalizeSource(leadSource: string | null | undefined): NormalizedSource {
  if (!leadSource) return 'unknown'
  switch (leadSource.toLowerCase()) {
    case 'voice_call':
    case 'llamada':
    case 'voz':
      return 'voice'
    case 'whatsapp':
      return 'whatsapp'
    case 'website':
      return 'website'
    case 'meta_lead_ads':
      return 'meta_ads'
    case 'witei':
      return 'witei'
    case 'crm':
      return 'crm'
    default:
      return 'unknown'
  }
}

function textBlobs(c: Contact): string[] {
  return [c.notes, ...c.interactions.map((i) => i.content)].filter(
    (t): t is string => !!t
  )
}

function findDncSignal(c: Contact): { reasons: string[]; emailOnly: boolean } {
  const reasons: string[] = []
  let emailOnly = false

  if (c.matching_enabled === false) {
    reasons.push('matching desactivado para este contacto')
  }
  if (Array.isArray(c.tags) && c.tags.some((t) => DNC_TAG.test(t))) {
    reasons.push('etiquetado como "no llamar"')
  }
  for (const blob of textBlobs(c)) {
    if (DNC_PHRASES.some((re) => re.test(blob))) {
      reasons.push(`mensaje del contacto: "${blob}"`)
    }
    if (EMAIL_ONLY_PHRASE.test(blob)) {
      emailOnly = true
      reasons.push(`pidió contacto solo por email: "${blob}"`)
    }
  }
  return { reasons, emailOnly }
}

/** Precedence: blocked > test > unverified > ok. */
export function evaluateCompliance(c: Contact): ComplianceResult {
  const { reasons, emailOnly } = findDncSignal(c)
  if (reasons.length > 0) {
    return {
      status: 'blocked',
      reasons,
      blocked: DNC_BLOCKED,
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
  if (source === 'witei' || source === 'crm' || source === 'unknown') {
    return {
      status: 'unverified',
      reasons: ['origen importado — base de consentimiento sin verificar'],
      blocked: [],
      allowed: ALL_CHANNELS,
    }
  }

  return { status: 'ok', reasons: [], blocked: [], allowed: ALL_CHANNELS }
}

function fixture(overrides: Partial<Contact>): Contact {
  return {
    id: 'c-000',
    organization_id: 'ORG-0031',
    full_name: null,
    phone: null,
    email: null,
    lead_source: null,
    contact_type: null,
    created_at: '2026-01-01T00:00:00Z',
    ai_handoff: false,
    is_test: false,
    assigned_agent_id: null,
    matching_enabled: true,
    tags: null,
    notes: null,
    qualification_data: null,
    interest_preferences: null,
    interactions: [],
    ...overrides,
  }
}

function demo() {
  const c013 = fixture({
    id: 'c-013',
    lead_source: 'WITEI',
    matching_enabled: false,
    tags: ['no-llamar'],
    notes: 'OJO: pidió por email que dejemos de llamarla — contactar SOLO por email.',
    interactions: [
      {
        id: 'i-1110',
        channel: 'EMAIL',
        direction: 'inbound',
        created_at: '2026-07-06T09:00:00Z',
        content:
          'Por favor, dejen de contactarme por teléfono. Si tienen algo que encaje con lo que busco, escríbanme por email únicamente.',
        metadata: null,
      },
    ],
  })
  const r013 = evaluateCompliance(c013)
  assert.equal(r013.status, 'blocked')
  assert.deepEqual(r013.allowed, ['email'])
  assert.equal(r013.preferredChannel, 'email')
  assert.ok(r013.reasons.length >= 3, 'expects tag + note + message reasons')

  const c014 = fixture({ id: 'c-014', lead_source: 'CRM', is_test: true })
  const r014 = evaluateCompliance(c014)
  assert.equal(r014.status, 'test')
  assert.deepEqual(r014.blocked, ALL_CHANNELS)

  const c015 = fixture({ id: 'c-015', lead_source: 'WITEI' })
  assert.equal(evaluateCompliance(c015).status, 'unverified')

  const c012 = fixture({ id: 'c-012', lead_source: null })
  assert.equal(evaluateCompliance(c012).status, 'unverified')

  for (const [id, source] of [
    ['c-001', 'VOICE_CALL'],
    ['c-004', 'WHATSAPP'],
    ['c-006', 'META_LEAD_ADS'],
  ] as const) {
    const r = evaluateCompliance(fixture({ id, lead_source: source }))
    assert.equal(r.status, 'ok', `${id} should be ok`)
  }

  console.log('compliance.ts self-check: OK')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demo()
}
