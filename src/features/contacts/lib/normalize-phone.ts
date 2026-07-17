/** Dataset is Spain-only (country code 34, 9 national digits). */
export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null

  const stripped = phone.replace(/[^\d+]/g, '')
  let national: string

  if (stripped.startsWith('+34')) {
    national = stripped.slice(3)
  } else if (stripped.startsWith('0034')) {
    national = stripped.slice(4)
  } else if (stripped.startsWith('34') && stripped.length === 11) {
    national = stripped.slice(2)
  } else {
    national = stripped.replace(/^\+/, '')
  }

  if (!/^\d{9}$/.test(national)) return null

  return `+34${national}`
}

export function formatPhoneDisplay(phone: string | null | undefined): string | null {
  const e164 = toE164(phone)
  if (!e164) return null
  const national = e164.slice(3)
  return `+34 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 9)}`
}
