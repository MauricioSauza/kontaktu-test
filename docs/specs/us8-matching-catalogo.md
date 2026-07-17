# US8 — Matching con el catálogo · Spec + Implementation Plan

## Context

Kontaktu wants the ficha to cross a contact's qualification against the agency's
catalog (`kb-propiedades-voz.json`, 6 properties) and show *which properties fit
and why*. This is the "before calling, what do I have for this person" view.

US8 **builds on the US10 vertical slice** (`src/lib/contacts.ts`,
`/api/contacts`, the `/contacts/[id]` detail page). It adds the one thing US10
deliberately skipped — **parsing the messy `qualification_data`** — plus the
matching engine, a matches API, and the matches UI on the detail page.

Stack: Next 16.2.10 (App Router), React 19, Tailwind v4, shadcn. Route handlers
verified against `node_modules/next/dist/docs`.

## Decisions (locked with user)

1. **Scope**: reuse the US10 slice; add qualification parsing + matching on top.
2. **Algorithm**: weighted score per property; show partial matches with reasons.
3. **Display**: matches-only. Above a score threshold → cards (strong + partial,
   each with per-dimension "why"). Nothing above threshold (incl. no
   qualification, or out-of-catalog zone) → plain "Sin coincidencias". No
   separate gap / near-miss / "fuera de zona" narrative.
4. **Deliberate deviation** (documented): **operation is a hard prerequisite**,
   not a weighted dimension — venta vs alquiler is a categorically different
   product, so a property of the wrong operation is excluded outright. Every
   *other* dimension is weighted per the algorithm choice.

## Spec — parsing the messy qualification

`src/lib/qualification.ts` normalizes the heterogeneous `qualification_data`
(object | JSON-string as in `c-003` | `null`) into a typed shape reused by
matching (and available to other stories):

```ts
interface ParsedQualification {
  operation?: 'sale' | 'rental'   // from qualification.sale/rental key, else interest_preferences.operation
  zones: string[]                 // normalized, accent/case-insensitive compare
  budgetMax?: number              // euros; monthly for rental, total for sale
  bedroomsMin?: number
  hasPets?: boolean
  elevator?: boolean
  garage?: boolean
  terrace?: boolean
  facts: Fact[]                   // raw {key, value, source, updatedAt} passthrough
}

function parseQualification(c: Contact): ParsedQualification
```

Messy-input handling (each gets a unit assert in the self-check):
- `qualification_data` may be an **object, a JSON string, or null** — parse the
  string (`c-003`), tolerate null (`c-004/05/06/11/12`).
- **budget**: `{max: 480000}` | `1400` | `"1.100 €"` | `"1.400"`. `parseBudget`
  strips `€`/spaces and Spanish thousands dots → `1100`, `480000`. (Spanish
  format: `.` = thousands, `,` = decimals.)
- **zones**: `["Majadahonda"]` (array) or `"Las Rozas o Majadahonda"` (string) —
  split on `/`, `,`, `" o "`.
- **operation**: `qualification.sale` block → `sale`; `.rental` → `rental`; else
  `interest_preferences.operation` (`SALE`→sale). Unknown → no matches.
- Extras pulled from qualification keys: `elevator`, `garage`, `terrace`,
  `has_pets` (value may be `true` or free text `"tiene un perro"` → truthy).
- **Human-edited wins**: when a fact has `source: "manual"` it overrides an
  `explicit` value for the same key (R3 hint; e.g. `c-008` budget).

## Spec — the matching engine

`src/lib/matching.ts`, over `src/lib/properties.ts` (loads the 6-property
catalog):

```ts
interface DimScore { key: string; ok: 'yes'|'partial'|'no'|'unknown'; label: string; weight: number }
interface Match { property: Property; score: number; strength: 'strong'|'partial'; dims: DimScore[] }

function matchContact(q: ParsedQualification, props: Property[]): Match[]
```

Algorithm:
1. **Prerequisite**: keep only properties whose `operacion` matches `q.operation`
   (`venta`↔sale, `alquiler`↔rental). Others excluded.
2. **Weighted dims** (only dimensions the contact *expressed* count; score is
   normalized by the sum of expressed weights, so sparse contacts aren't
   penalized for silence):

   | Dim | Weight | Match rule |
   |---|---|---|
   | zona | .35 | `property.zona` ∈ `q.zones` (normalized) → yes; else no |
   | budget | .25 | `precio ≤ budgetMax` → yes; `≤ ×1.1` → partial; else no |
   | bedrooms | .15 | `habitaciones ≥ bedroomsMin` → yes; else no |
   | pets | .10 | `hasPets` → `admite_mascotas` yes/no; else dim absent |
   | elevator | .05 | `ascensor` vs `q.elevator` |
   | garage | .05 | `plaza_garaje` vs `q.garage` |
   | terrace | .05 | `q.terrace` → `/terraza/i` in `descripcion_corta` (no boolean field in catalog) |

   `score = Σ(weight·dimScore) / Σ(weight of expressed dims)`, dimScore
   yes=1 / partial=0.5 / no=0.
3. **Threshold**: keep `score ≥ 0.5`. `≥ 0.8` → `strong`, else `partial`.
   Sort desc by score. Empty result (incl. no qualification / out-of-catalog
   zone like `c-010`/`c-011` Barcelona) → caller shows "Sin coincidencias".

`dims` is the "why": each entry renders as `✓ Zona Majadahonda`,
`✓ 3 hab (pide mín. 3)`, `⚠ 520.000 € (presupuesto 480.000 €)`,
`✓ admite mascotas`.

## Files

**Domain**
- `src/lib/qualification.ts` — `parseQualification`, `parseBudget`, `parseZones`,
  `Fact` type. `assert`-based self-check for the messy inputs above.
- `src/lib/properties.ts` — `Property` type + `getProperties()` (loads
  `kb-propiedades-voz.json`).
- `src/lib/matching.ts` — `matchContact` + weights/threshold. `assert`-based
  self-check asserting the dataset expectations below.

**API (R8)** — new route, typed `RouteContext<'/api/contacts/[id]/matches'>`,
async `params`, small simulated latency:
- `src/app/api/contacts/[id]/matches/route.ts` — `GET` → `Match[]` for the
  contact (parse qual server-side, run `matchContact`); `404` if contact missing.

**UI** (on the existing US10 `/contacts/[id]` detail page)
- `src/components/matching/MatchesSection.tsx` — fetches the matches route;
  loading (skeleton) / empty ("Sin coincidencias") / list states.
- `src/components/matching/MatchCard.tsx` — property summary (título, zona,
  precio, hab/baños/m²) + `strength` badge (`Encaje fuerte` / `Encaje parcial`
  + score %) + the `dims` reasons list with ✓/⚠ markers.

**Reuse**: shadcn `card`, `badge`, `separator`, `skeleton`; `cn()` from
`src/lib/utils.ts`; `Contact`/data access from US10's `src/lib/contacts.ts`. No
new deps.

## Dataset expectations (self-check + manual)

- `c-001 Carmen` (sale, Majadahonda, 480k, 3 hab, terraza, perro) → **MIR-2041**
  (venta Majadahonda 465k 3 hab, terraza+pet in desc) = `strong`, top. **MIR-2057**
  (520k) partial or excluded (over budget). Pozuelo/rental props excluded.
- `c-003 Antonio` (JSON-**string** qualification, rental, Las Rozas, 1400, 2 hab)
  → **MIR-2044** (alquiler Las Rozas 1350, 2 hab) matches. Proves string parsing.
- `c-007 Marta` (sale, Majadahonda, 550k, garaje, ascensor, planta alta) →
  **MIR-2057** (Majadahonda 520k, garaje, ascensor) strong.
- `c-004` / `c-006` (no qualification) → `[]` → "Sin coincidencias".
- `c-010` (rental, Sant Cugat — not in catalog) → `[]`.
- `parseBudget("1.100 €") === 1100`, `parseBudget("480.000") === 480000`,
  `parseZones("Las Rozas o Majadahonda").length === 2`.

## Out of scope (state in README)

Matching filters/search in the listing (US6), voice-agent `buscar_propiedades`
tool (bonus), editing a matched fact (US5), and any write-back of matches.

## Verification

1. `npm run dev`, open `/contacts/c-001` → matches section: MIR-2041 as
   "Encaje fuerte" at top with ✓ reasons; over-budget props partial/absent.
2. `/contacts/c-003` → MIR-2044 matches (confirms JSON-string qualification parsed).
3. `/contacts/c-007` → MIR-2057 strong.
4. `/contacts/c-004` and `/contacts/c-010` → "Sin coincidencias".
5. Slow matches route → skeleton; contact 404 → route returns 404.
6. Run the `qualification.ts` + `matching.ts` self-checks (asserts pass).
