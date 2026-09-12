# /design — brand mode

Brand identity, voice, messaging, visual guidelines, asset management, and
consistency enforcement. Produces the two documents every other
brand-bearing mode reads — `design/brand-guidelines.md` and
`design/brand-voice-guidelines.md` — and syncs them into the token
spine (`design-tokens.json` / `design-tokens.css`). Merged from the former
`brand` skill (12 references + 4 token scripts) plus its brand-voice
subsystem (6 files).

## When you use (entry triggers)

- "Design a brand / brand identity / brand system"
- "Write brand voice guidelines", "find our voice", "on-brand copy"
- "Build a style guide / brand book / visual identity standards"
- "Define our messaging framework", "brand colors and typography"
- "Check if this is on-brand" (review), "enforce our brand voice on this"
- Brand tasks piggyback on other modes (logo, CIP, banner, social-photos
  all check `design/brand-guidelines.md` first) — run brand before
  them when identity doesn't exist yet.

## Where on the spine

Brand runs **Consult → Build**, no Explore. Guidelines are a synthesized
single artifact, not a variant-explored one — a brand is not two candidate
voices presented side by side. If voice direction is genuinely unclear,
draft the "We Are / We Are Not" table as two alternates inside the draft
(`v1`/`v2`) and pick one at settle; do not generate visual variants.

- **Consult** — read `design/DESIGN.md` if it exists, else gather
  brand context (product, audience, competitors). Adoption rule: if
  `design/brand-guidelines.md` already exists, adopt it — never
  reinvent.
- **Build** — synthesize the guidelines (voice + visual), run the token
  sync, write `brand-guidelines.md` + `brand-voice-guidelines.md`, settle.
- **Verify** — the review loop (Phase 4 below) plus the consistency /
  approval checklists gate the output.

## Output layout (D17 + D19)

```
design/
├── brand-guidelines.md        ← durable visual + voice guideline doc
├── brand-voice-guidelines.md  ← durable voice guideline (We Are / tone matrix)
├── design-tokens.json         ← token source of truth (from sync)
└── design-tokens.css          ← generated CSS variables
```

Never `<harness-config-dir>/brand-voice-guidelines.md`, never `docs/`, never
`final`. The legacy brand skill saved to the harness config dir and its sync
scripts defaulted to
`docs/brand-guidelines.md` — in this bundle the durable docs live in
`design/` and the sync scripts read
`design/brand-guidelines.md` by default. No `docs/` copy needed.

## Prerequisites

- `node` for the `.cjs` token/brand scripts.
- `GEMINI_API_KEY` only if you generate brand mood imagery (optional).
- The token scripts read/write files **relative to the project root** (cwd),
  so run them from the project root.

## Mechanics

### 1. Discover — find brand materials (only when the user doesn't have them)

Run this when the user says "find our style guide", "what brand materials
do we have", "brand content audit". It searches connected enterprise
platforms; no platform connected → ask the user to connect one before
searching.

1. Orient: search → analyze → generate guidelines → save.
2. Check for a local brand override file for company name, enabled
   platforms, known locations.
3. Classify platforms: **document platforms** (Notion, Confluence, Google
   Drive, Box, Microsoft 365) vs **supplementary** (Slack, Gong, Granola,
   Figma — patterns only). Zero document platforms → stop and ask.
4. Run the 4-step discovery algorithm: broad discovery → source triage →
   deep fetch → discovery report.
5. Present the report: sources found, key elements, conflicts, open
   questions.

Search patterns by platform (fold from
`references/brand/brand-voice/discover-search-strategies.md`):

| Platform | Query patterns | Tips |
|---|---|---|
| Notion | "brand guidelines", "style guide", "brand voice", "messaging framework", "pitch deck", "value proposition" | AI Search federates Google Drive/SharePoint/Slack/Jira/Teams — one search covers many |
| Confluence | "brand style guide", "voice and tone guidelines", "email template", "editorial guidelines" | spaces named Marketing/Brand; attachments often hold PDF brand books |
| Box | "Brand Guidelines", "Brand Kit", "Style Guide", "Sales Collateral" | PDFs/Word source-of-truth guides; check recently modified |
| Google Drive | "brand guide", "style guide", "brand voice", "brand standards" | Google Docs/Slides = living brand documents; shared drives |
| M365 / SharePoint | "brand guidelines", "brand book", "editorial guidelines" | Marketing/communications sites first; brand-tagged metadata |
| Slack | #brand, #marketing channels; "tone of voice" | Pinned messages often hold approved decisions; ranks CONVERSATIONAL |
| Gong | won/closed-won calls, top performers | Successful calls define implicit voice; objection-handling patterns |
| Granola | "brand", "positioning", "messaging" meetings | Meeting notes summarize decisions; cross-ref with Gong |
| Figma | "brand design system", "design tokens", "style guide" | Writing guidelines often ship inside design-system docs |

Cross-platform rules: track duplicate sources (same doc on multiple
platforms → prefer newest), focus on the last 12 months for non-official
material, and flag any non-official source older than 12 months as
possibly stale.

**Source ranking** (reference `discover-source-ranking.md`):

| Category | Signals | Trust weight |
|---|---|---|
| AUTHORITATIVE | Official brand books/guides, C-suite approved, versioned | 1.0 |
| OPERATIONAL | Templates, playbooks, email sequences in use | 0.8 |
| CONVERSATIONAL | Call transcripts, Slack/meeting patterns | 0.6 |
| CONTEXTUAL | Competitor docs, product specs, design files | 0.3 |
| STALE | superseded versions, pre-rebrand, archived | 0.1 |

Composite score = `(recency × 0.30) + (explicitness × 0.25) + (authority ×
0.20) + (specificity × 0.15) + (consistency × 0.10)`, then × category trust.
Deep-fetch the top 5–15 (all AUTHORITATIVE regardless of score, ≥1 per
category); exclude scores < 0.1. If zero AUTHORITATIVE sources exist,
adapt the weights (CONVERSATIONAL 0.6→0.85, explicitness 0.2→0.5) so
transcripts carry the brand evidence.

### 2. Generate voice guidelines (the core build)

Synthesize from the discovery report, documents, transcripts, or direct
input. Sections (reference
`references/brand/brand-voice/guideline-template.md`):

1. **Executive summary** — 2–3 paragraphs on the brand's distinctive voice.
2. **"We Are / We Are Not" table** — the identity anchor; minimum 4 rows,
   ideally 5–7, each row evidence-backed.

| We Are | We Are Not |
|---|---|
| **Confident** — know the product, stand behind it | **Arrogant** — never talk down or dismiss alternatives |
| **Approachable** — complex topics feel manageable | **Sloppy** — approachable ≠ unprofessional |
| **Direct** — to the point quickly | **Blunt** — directness includes empathy |
| **Data-driven** — claims carry evidence | **Academic** — data tells stories, not lectures |
| **Innovative** — pushes boundaries | **Hype-driven** — real innovation, not buzzwords |

3. **Brand personality** — archetype (e.g., "The Expert Friend"), "if our
   brand were a person", core values in voice.
4. **Messaging framework** — primary value proposition, key message pillars,
   competitive positioning.
5. **Tone-by-context matrix** — voice is constant, tone flexes along three
   dimensions (formality, energy, technical depth):

| Context | Formality | Energy | Technical Depth | Key Principle |
|---|---|---|---|---|
| Cold outreach | Medium | High | Low | Hook fast, earn attention |
| Discovery calls | Medium | Medium-High | Medium | Ask more than tell |
| Demo / presentation | Medium-High | High | High | Show, don't just describe |
| Enterprise proposal | High | Medium | High | ROI and precision |
| Follow-up email | Medium | Medium | Low-Medium | Add new value each touch |
| Social media | Low-Medium | High | Low | Brevity and personality |
| Customer success | Medium | Warm | Medium | Empathy and competence |
| Internal comms | Low | Medium | Varies | Authentic, less polished |

6. **Terminology guide** — must-use / preferred / avoid / never-use terms.
7. **Language patterns** — top phrases, engaging questions, objection
   handling (only if transcript data exists).
8. **Open questions** — every one carries a recommendation ("confirm or
   override"), never a dead end.

**Confidence scoring** (reference `guideline-confidence-scoring.md`):
High = 3+ corroborating sources + explicit guidance; Medium = 1–2 sources or
inferred; Low = single source/conflicting. Present the score with each
section header and show aggregate:
`Voice 30% + Messaging 25% + Tone 20% + Terminology 15% + Language 10%`,
`High=1.0 / Medium=0.6 / Low=0.3`. Low-confidence sections generate
corresponding open questions.

### 3. Enforce voice on content (Phase 3)

Apply loaded guidelines to content generation (email, proposal, deck, social
post):

1. Load guidelines in order — session copy, then
   `design/brand-voice-guidelines.md` — and read the strictness
   setting if present.
2. Analyze the request: type, audience, key messages.
3. Apply **voice constants** (personality, We Are / We Are Not, terminology)
   — voice stays constant across all content.
4. Flex **tone** per the matrix (formality, energy, technical depth).
5. Generate, following terminology and tone guidance.
6. Validate and explain: which guidelines applied, key decisions, any
   adaptations. Flag conflicts with an explained recommendation
   (adapt/override).

**Before/after discipline** (reference
`enforcement-before-after-examples.md`): don't say "off-brand", show the
fixed line. Example pattern — generic "We offer an AI platform that helps
sales teams be more productive" → branded "Your team closed $12M last
quarter — but data shows mid-market teams lose 23% of qualified pipeline to
slow follow-ups. [Product] fixes that." (voice: confident, data-driven,
direct; tone: high energy, medium formality, low technical depth).

### 4. Review content against guidelines (review phase)

Accepts pasted content, a file path, or multiple pieces. Determine the
guidelines source automatically, fall back to a general clarity/consistency
review if none. Flag deviations by severity with a concrete before/after fix
for each. Add legal-adjacent flags: unsubstantiated claims, missing
disclaimers.

### 5. Visual identity guidelines

**Color system** (reference `color-palette-management.md`):

```
Primary (1-2)   → CTAs, headers, key elements        ~60-70% of a design
Secondary (2-3) → accents, interactive states         ~20-30%
Neutrals (3-5)   → backgrounds, text, borders
Semantic (4)     → success #22C55E, warning #F59E0B, error #EF4444, info #3B82F6
```

- Document as `| Name | Hex | RGB | HSL | Usage |` tables + CSS variables
  (`--color-primary`, `--color-surface`, …) + Tailwind config mapping.
- WCAG 2.1 contrast: AA 4.5:1 text / 3:1 large text + UI; AAA 7:1 / 4.5:1.
- Compliance rule set: primary 60–70%, secondary 20–30%, accent 5–10%, max
  20% off-palette tolerance; verify with `extract-colors.cjs`.
- Don'ts: 2–3 colors max per component, no pure `#000` text (use `#111`),
  never rely on color alone.

**Typography** (fold `typography-specifications.md`):

| Element | Size (px) | Weight | Line height |
|---|---|---|---|
| Display | 61 | 700 | 1.1 |
| H1 / H2 / H3 | 49 / 39 / 31 | 700 / 600 / 600 | 1.2 / 1.25 / 1.3 |
| Body | 16 | 400 | 1.5–1.6 |
| Caption | 12 | 400 | 1.4 |

- Base 16px, 1.25 ratio (Major Third), max 65–75ch line length.
- Weight pairing: headings 600–700, body 400, links 500, buttons 600.
- All-caps tracking +0.05em; display -0.02em; body 0.
- Accessibility: body ≥16px, small ≥14px, caption ≥12px; 4.5:1 contrast.
- Font pairs: clean modern (Inter/Inter), professional
  (Playfair Display / Source Sans Pro), startup (Poppins / Open Sans),
  editorial (Merriweather / Lato). Prefer the bundle's local font kit
  (`assets/fonts/`), not Google Fonts CDN.

**Logo usage** (fold `logo-usage-rules.md`):

- Variants: full horizontal, stacked, icon-only, wordmark; color variants
  (full, reversed, mono-dark, mono-light).
- Clear space = height of the logo mark; min size digital 120px full / 24px
  icon, print 35mm / 10mm.
- Absolute don'ts: stretch, rotate, drop shadows, gradients, unapproved
  colors, strokes, busy backgrounds, crop, rearrange.
- Formats: SVG (web), PNG (fallback), PDF/EPS (print); keep the
  `assets/logos/` variant folder structure.
- Co-branding: equal visual weight, separation, divider line if needed.

**Messaging framework** (fold `messaging-framework.md`):

```
Mission → Vision → Value Proposition → Positioning → Key Messages → Proof Points
```

Formulas: Mission = "We [action] for [audience] by [method] so they can
[outcome]." Value prop = "For [customer] who [need], [brand] is a [category]
that [benefit]. Unlike [competitors], we [differentiator]." Plus elevator
pitches (10/30/60-second) and a message-per-audience table.

**Asset organization** (fold `asset-organization.md`):

- Naming: `{type}_{campaign}_{description}_{YYYYMMDD}_{variant}.{ext}`
  (e.g., `banner_claude-launch_hero-image_20251209_16-9.png`).
- Registry: `.assets/manifest.json` with `status / platform / content-type /
  format / source` tags; archive, don't delete.
- Validate new assets with `validate-asset.cjs`.

### 6. Token integration and brand update

Write the guidelines as `design/brand-guidelines.md` following
`brand-guideline-template.md` (Quick Reference + Color Palette + Typography
+ Logo Usage + Voice & Tone + Imagery). Then the machine scripts:

```bash
# Inject brand context into prompt copy (reads the guidelines; supports a
# custom path)
node scripts/tokens/inject-brand-context.cjs
node scripts/tokens/inject-brand-context.cjs --json
node scripts/tokens/inject-brand-context.cjs design/brand-guidelines.md

# Validate an asset against naming/dimension/size rules
node scripts/tokens/validate-asset.cjs design/<screen>/logo.svg

# Palette / color extraction
node scripts/tokens/extract-colors.cjs --palette
node scripts/tokens/extract-colors.cjs assets/banner.png --brand-file design/brand-guidelines.md
```

**Brand → tokens sync** (`sync-brand-to-tokens.cjs`) extracts
primary/secondary/accent hex values from the guidelines, regenerates the
color scales, and rewrites `design/design-tokens.json` →
`design/design-tokens.css`, shelling out to
`scripts/tokens/generate-tokens.cjs` for the CSS. The script reads
`design/brand-guidelines.md` by default (D17 single source of
truth — no `docs/` copy needed).

```bash
node scripts/tokens/sync-brand-to-tokens.cjs        # design/brand-guidelines.md → tokens
node scripts/tokens/sync-brand-to-tokens.cjs --dry-run
```

Verify the loop: `node scripts/tokens/inject-brand-context.cjs --json` shows
the extracted context (colors, typography, voice, image style).

**Theme presets** (from the former `brand` update command) for quick
guidelines: ocean-professional `#3B82F6 / #F59E0B / #10B981`; electric
creative `#FF6B6B / #9B5DE5 / #00F5D4`; forest-calm `#059669 / #92400E /
#FBBF24`; midnight-purple `#7C3AED / #EC4899 / #06B6D4`; sunset-warm
`#F97316 / #DC2626 / #FACC15`.

## Verify

1. **Both docs exist** — `brand-guidelines.md` and
   `brand-voice-guidelines.md` written under `design/`.
2. **Voice table complete** — ≥4 evidence-backed "We Are / We Are Not"
   rows, tone matrix covers ≥3 contexts, confidence scores assigned, no
   PII in examples, open questions carry recommendations.
3. **Tokens resolve** — `inject-brand-context.cjs --json` shows colors +
   typography; every referenced token exists in `design-tokens.json`.
4. **Consistency checklist** — visual (logo/color/type/imagery) + voice
   (tone/language/messaging) + channel audit rows from
   `consistency-checklist.md` all pass or have a follow-up.
5. **Approval checklist** — visual, accessibility, content, legal rows
   from `approval-checklist.md` gated before "ship".
6. **Settle** — delete any draft variants, keep only the settled docs.

## References

| Topic | File |
|---|---|
| Brand voice — discovery search strategies | `references/brand/brand-voice/discover-search-strategies.md` |
| Brand voice — source ranking | `references/brand/brand-voice/discover-source-ranking.md` |
| Brand voice — guideline template | `references/brand/brand-voice/guideline-template.md` |
| Brand voice — confidence scoring | `references/brand/brand-voice/guideline-confidence-scoring.md` |
| Brand voice — voice constant / tone flexes | `references/brand/brand-voice/voice-constant-tone-flexes.md` |
| Brand voice — before/after examples | `references/brand/brand-voice/enforcement-before-after-examples.md` |
| Visual identity basics | `references/brand/visual-identity.md` |
| Voice framework | `references/brand/voice-framework.md` |
| Messaging framework | `references/brand/messaging-framework.md` |
| Color palette management | `references/brand/color-palette-management.md` |
| Typography specifications | `references/brand/typography-specifications.md` |
| Logo usage rules | `references/brand/logo-usage-rules.md` |
| Asset organization | `references/brand/asset-organization.md` |
| Brand guideline template | `references/brand/brand-guideline-template.md` |
| Brand guidelines starter (fill-in template) | `templates/brand-guidelines-starter.md` |
| Consistency checklist | `references/brand/consistency-checklist.md` |
| Approval checklist | `references/brand/approval-checklist.md` |
| Brand update presets | `references/brand/update.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/tokens/inject-brand-context.cjs` | Extract brand context for prompt injection |
| `scripts/tokens/sync-brand-to-tokens.cjs` | brand-guidelines.md → design-tokens.json/css |
| `scripts/tokens/validate-asset.cjs` | asset naming / size / format validation |
| `scripts/tokens/extract-colors.cjs` | extract + compare image colors vs palette |
| `scripts/tokens/generate-tokens.cjs` | tokens.json → design-tokens.css (called by sync) |

## Inputs

`[discover | generate-guidelines | enforce-voice | review | create | update]
[args]` — e.g., `design brand voice for a fintech SaaS`, `make this post
on-brand`, `find our brand materials`, `update brand colors`.
