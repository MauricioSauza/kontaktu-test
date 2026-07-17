# US10 — Cumplimiento (Compliance) · Spec + Implementation Plan

## Context

Kontaktu's contact ficha must respect consent. The dataset mixes contacts who
initiated contact themselves, contacts imported from another CRM (consent basis
unknown), a test row, and at least one person who **explicitly asked not to be
called**. US10 asks: *señalizar el estado de cumplimiento y bloquear las acciones
que no procedan.*

The app is currently greenfield — only shadcn `ui/*` primitives and the default
page exist. Per the chosen scope, US10 ships as a **self-contained vertical
slice**: a route-handler API (R8), a minimal listing, a minimal contact-detail
header + outreach actions, and the compliance layer on top. Full qualification
rendering (R3) and the interaction timeline (R4) are **out of scope** — other
user stories own those; this header exists only to host the compliance UI.

Stack: Next 16.2.10 (App Router, nonstandard — route handlers verified against
`node_modules/next/dist/docs`), React 19, Tailwind v4, shadcn.

## Decisions (locked with user)

1. **Scope**: self-contained slice (API + listing + minimal detail + compliance).
2. **Consent model**: derived, not a single field (none exists in data).
3. **Block behavior**: hard block, no override. Blocked outreach buttons are
   disabled with a reason tooltip; the permitted channel (email) stays enabled.

## Spec — the compliance model

No `consent` field exists in `contactos.json`, so status is **derived** from
scattered, messy signals. `src/lib/compliance.ts` exposes:

```ts
type ComplianceStatus = 'blocked' | 'test' | 'unverified' | 'ok'
type Channel = 'voice' | 'whatsapp' | 'email' | 'matching' | 'ai_outreach'

interface ComplianceResult {
  status: ComplianceStatus       // primary, by precedence below
  reasons: string[]              // human-readable, shown in banner
  blocked: Channel[]             // disabled actions
  allowed: Channel[]             // enabled actions
  preferredChannel?: Channel     // e.g. 'email' when they asked "solo email"
}

function evaluateCompliance(c: Contact): ComplianceResult
```

**Signal detection** (precedence `blocked > test > unverified > ok`):

| Status | Trigger (any of) | Effect |
|---|---|---|
| `blocked` (do-not-call) | `matching_enabled === false`; a tag matching `/no.?llamar/i`; `notes` or any interaction `content` matching do-not-call phrases (`/dejen de (llamar\|contactar)/i`, `/no me (llam\|contact)/i`, `/solo.*email/i`) | block `voice, whatsapp, ai_outreach, matching`; if an "email only" phrase is present → `allowed:['email']`, `preferredChannel:'email'` |
| `test` | `is_test === true` | block **all** channels + matching (never contact a test row) |
| `unverified` | imported source — normalized `lead_source ∈ {WITEI, CRM}` — or `lead_source == null`; consent basis unknown | **warn, don't block**; actions allowed with an amber caution note |
| `ok` | person-initiated inbound (voice/whatsapp/web/meta) | nothing shown |

Dataset expectations (verify these in the self-check + manually):
- `c-013 Sofía` → `blocked`, reasons include the `no-llamar` tag, the note, and
  the email message; email allowed, voice+whatsapp disabled. *(Also a WITEI
  import, but `blocked` wins by precedence.)*
- `c-014 Prueba` → `test`, everything disabled.
- `c-015 María Dolores` → `unverified` (WITEI import), amber note, actions allowed.
- `c-012` (null source) → `unverified`.
- `c-001 Carmen`, `c-004`, `c-006` → `ok`.

`normalizeSource(lead_source)` maps the raw variants (`VOICE_CALL`, `llamada`,
`VOZ`, `whatsapp`, `WEBSITE`, `META_LEAD_ADS`, `WITEI`, `CRM`, `null`) to a small
enum — reused by the source badge and the `unverified` rule.

## Files

**Domain / data**
- `src/lib/contacts.ts` — `Contact` type (only US10-relevant fields), tolerant
  `parseFlexibleDate` (handles ISO, `dd/mm/yyyy`, `dd/mm/yyyy HH:mm`, unix epoch
  seconds — see `c-005`, `c-012`, `c-015`), `getContacts()` / `getContact(id)`
  reading `contactos.json` with a small simulated latency. `qualification_data`
  is ignored here (not needed for US10; note it can be object|string|null).
- `src/lib/compliance.ts` — the model above + `normalizeSource`. Include an
  `assert`-based `demo()`/`__main__`-style self-check (non-trivial regex/branch
  logic gets one runnable check) asserting the dataset rows above.

**API (R8)** — route handlers verified against Next 16 docs; `params` is async,
type ctx with `RouteContext<'/api/contacts/[id]'>`:
- `src/app/api/contacts/route.ts` — `GET` → list (identity + source + last
  interaction date + `evaluateCompliance` status).
- `src/app/api/contacts/[id]/route.ts` — `GET` → one contact + full compliance
  result; `404` when missing.

**Pages** — server components `await fetch()` the handlers (absolute URL via a
`getBaseUrl()` helper using `headers()`), so `loading.tsx` shows during the
simulated latency and `error.tsx` catches failures — R5 states are real:
- `src/app/contacts/page.tsx` + `loading.tsx` — listing; each row shows a
  `<ComplianceBadge>`.
- `src/app/contacts/[id]/page.tsx` + `loading.tsx` + `error.tsx` +
  `not-found.tsx` — detail; calls `notFound()` on 404.

**Components**
- `src/components/compliance/ComplianceBadge.tsx` — small pill for the listing
  (red `blocked`, zinc `test`, amber `unverified`, none for `ok`). Built on
  shadcn `badge`.
- `src/components/compliance/ComplianceBanner.tsx` — detail banner listing
  `reasons` and the allowed channel. Built on shadcn `alert`.
- `src/components/contact/ContactHeader.tsx` — **minimal** identity only: name
  with fallback (`full_name` → readable phone → email → "Contacto sin nombre"),
  initials avatar, normalized source badge, phone, created date. No qualification,
  no timeline.
- `src/components/contact/ContactActions.tsx` — `Llamar`, `WhatsApp`, `Email`
  buttons. Each disabled when its channel is in `blocked`, with a reason tooltip.
  `href` = `tel:` / `https://wa.me/` / `mailto:` when allowed. This is the
  action-gate that enforces the block behavior; the disabling is driven purely by
  `ComplianceResult.blocked`, so any future action reuses the same gate.

**Reuse**: shadcn `badge`, `alert`, `avatar`, `button`, `card`, `separator`,
`skeleton` already exist — use them, add no new deps. `cn()` from `src/lib/utils.ts`.

## Out of scope (state in README)

R3 qualification rendering, R4 timeline, duplicate detection (c-001/c-009),
phone normalization beyond display, matching against `kb-propiedades-voz.json`.
US10 gates *matching* as a channel but doesn't implement the match itself.

## Verification

1. `npm run dev`, open `/contacts` — listing renders with badges; `c-013` red,
   `c-014` zinc, `c-015` amber, most none.
2. `/contacts/c-013` → red banner (tag + note + email-message reasons); `Llamar`
   and `WhatsApp` disabled with tooltip; `Email` enabled with `mailto:`.
3. `/contacts/c-014` → all outreach disabled.
4. `/contacts/c-015` → amber "consentimiento sin verificar (importado)" note;
   actions enabled.
5. `/contacts/c-001` → no banner, all actions enabled.
6. `/contacts/nope` → `not-found.tsx`. Kill the handler / throw → `error.tsx`.
   Slow route → `loading.tsx` (skeleton) visible.
7. Run the `compliance.ts` self-check (assert dataset expectations pass).
