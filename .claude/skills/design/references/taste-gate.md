# Taste gate — anti-slop, taste memory, anti-convergence

Read this file before generating **any** design artifact. It is the shared
quality bar across every mode. Merged 2026-08-26 from design-html's AI-slop
blacklist and design-shotgun's taste memory + anti-convergence directive.

## 1. AI slop blacklist — never include

These default to "generic AI output" and read as unprofessional. Each mode's
quality gate rejects them unless the mockup/brief explicitly demands them:

- Purple/blue gradients as the default treatment
- Generic 3-column feature grids
- Center-everything layouts with no visual hierarchy
- Decorative blobs, waves, or geometric patterns not in the source design
- Stock photo placeholder divs
- "Get Started" / "Learn More" generic CTAs not taken from the brief
- Rounded-corner cards with drop shadows as the default component
- Emoji used as visual elements
- Generic testimonial sections
- Cookie-cutter hero sections (left text / right image)

Also from the shotgun quality bar: "forced tours, interstitials" and any
unprofessional or sloppy appearance — a design that looks like a template demo
is a failed design.

## 2. Taste memory

Bias generation toward the user's demonstrated taste, across sessions.

- **Persistent profile:** `design/state/taste-profile.json`
  - Schema v1: `{ dimensions: { fonts, colors, layouts, aesthetics }, sessions: [] }`
  - Each dimension has `approved[]` and `rejected[]` entries of
    `{ value, confidence, approved_count, rejected_count, last_seen }`
  - Confidence decays 5% per week of inactivity — compute at read time,
    never rewrite the file just for decay.
- **Legacy per-session signals:** `design/state/approved.json` files —
  read the last 10 (newest first), extract patterns, merge with the profile.
- **Summarize for the brief:** top-3 approved per dimension by
  `confidence * approved_count`; avoid top-3 rejections.
- **Conflict handling:** if the request contradicts a strong persistent signal
  (e.g. "make it playful" against a strongly-minimal profile), say so:
  "Your taste profile strongly prefers minimal. I'll proceed, but want me to
  update the profile or treat this as one-off?"
- **Write-back:** when the user approves a variant, record it (approved tags:
  font, color, layout style). When they explicitly reject, note it — those
  become future rejections. This is the taste memory loop.

## 3. Anti-convergence directive (hard requirement)

When generating multiple variants, **each variant MUST use a different font
family, color palette, and layout approach.** If two variants look like
siblings — same typographic feel, overlapping color temperature, comparable
layout rhythm — one of them failed. Regenerate the weaker one with a
deliberately different direction.

**Concrete test:** if someone could swap the headline between two variants
without noticing, they're too similar. Variants should feel like they came
from three different design teams.

## 4. Voice constants

Where the artifact carries brand copy, stay in the brand's voice — see
`references/brand/brand-voice/` (voice-constant-tone-flexes.md,
enforcement-before-after-examples.md, guideline-confidence-scoring.md).
No on-brand copy outside the voice range; no off-brand voice that "sounds
clever".

## 5. Where this file lives relative to output

The taste profile is **transient state** under `design/state/` —
it biases generation, but is never a deliverable and never survives a settle
as an artifact.
