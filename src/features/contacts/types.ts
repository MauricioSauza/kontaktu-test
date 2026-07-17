export interface Interaction {
  id: string
  channel: string
  direction: 'inbound' | 'outbound'
  created_at: string | number
  content: string
  metadata: Record<string, unknown> | null
}

export interface Contact {
  id: string
  organization_id: string
  full_name: string | null
  phone: string | null
  email: string | null
  lead_source: string | null
  contact_type: string | null
  created_at: string | number
  ai_handoff: boolean
  is_test: boolean
  assigned_agent_id: string | null
  matching_enabled: boolean
  tags: string[] | null
  notes: string | null
  // Not needed for US10 (R3 owns rendering it); shape varies (object|string|null).
  qualification_data: unknown
  interest_preferences: Record<string, unknown> | null
  interactions: Interaction[]
}
