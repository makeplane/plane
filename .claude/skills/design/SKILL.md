---
name: design
description: "One design creation umbrella: mockups, frontend UI, brand identity, design tokens/systems, logos (Gemini), corporate identity programs (CIP), SVG icon sets, banners, social photos, canvas/poster art, themes, HTML presentations, GIFs, UX copy, design handoff, and design-to-code. Every mode runs the same Consult → Explore → Build spine, outputs to design/ with v1/v2 versioning, and validates against the design system. Use when asked to design, mock up, prototype, rebrand, generate a logo/icon/banner/poster, build a design system, create slides, hand off a design, or convert a design to code."
argument-hint: "[type] [what to build] [context]"
metadata:
  author: nextlevelbuilder (base, merged into a single umbrella 2026-08-26)
---

# / Design — creation umbrella

One skill for everything you **create** in the design domain. A single request
dispatches to one of the entry modes below; every mode runs the same
Consult → Explore → Build spine against a shared engine. The review/critique
side of design lives in the separate `design-reviewer` agent, not here.

The main file is an orchestrator — mode content lives in `sections/<mode>.md`
and is read **only when that mode fires** (same pattern as project-plan's
PHASE files). Do not read every section on every call.

## Entry modes — dispatch

| "Design a …" | Mode | Section | Build output |
|---|---|---|---|
| mockup / screen / page / dashboard | **mockup** | `sections/mockup.md` | HTML mockup(s) → settle |
| website / frontend / component / shadcn/Tailwind | **frontend** | `sections/frontend.md` | React + shadcn/Tailwind code |
| slides / deck / pitch / presentation | **presentation** | `sections/presentation.md` | HTML or Markdown deck |
| design system / tokens / CSS vars / component specs | **design-system** | `sections/design-system.md` | tokens.json + design-tokens.css |
| brand / brand voice / guidelines / on-brand copy | **brand** | `sections/brand.md` | brand-guidelines.md + voice |
| logo | **logo** | `sections/logo.md` | SVG/PNG → settle |
| corporate identity / CIP | **cip** | `sections/cip.md` | deliverable set + HTML presentation |
| icon / icon set | **icon** | `sections/icon.md` | SVG set |
| banner / cover / header / hero / ad | **banner** | `sections/banner.md` | exact-size PNG |
| social photo / post image | **social-photos** | `sections/social-photos.md` | multi-platform PNG set |
| poster / art / print / magazine page | **canvas** | `sections/canvas.md` | PNG/PDF |
| theme / "style my deck" | **theme** | `sections/theme.md` | applied theme |
| gif / animation | **animation** | `sections/animation.md` | GIF |
| "convert this Figma/design to code" | **to-code** | `sections/to-code.md` | React code (opt-in, gated) |
| handoff / spec for engineers | **handoff** | `sections/handoff.md` | spec doc |
| microcopy / button / error / empty state | **ux-copy** | `sections/ux-copy.md` | copy block |

Rules of dispatch:

- **One mode per call.** If a request spans modes (logo → CIP → deck), treat it
  as a pipeline and run the modes **in order** — each output feeds the next.
- **Brand + tokens first.** If the request touches color, type, or identity and
  no `design/DESIGN.md` exists yet, the **Consult** phase runs first
  regardless of mode.
- **Ask before guessing.** Ambiguous type → one targeted question (purpose /
  platform / audience / style), then proceed.

## Universal workflow — Consult → Explore → Build

Every mode is a trimmed version of this spine. Read `sections/` for the
mode-specific mechanics; the skeleton is always:

### 1. Consult — design language first, always

- If `design/DESIGN.md` exists → **read it, adopt it**, skip invention.
- If not → gather context (product, audience, space), propose the design
  language (aesthetic, typography, color, spacing, motion) and write
  `design/DESIGN.md` **before any screen is designed**.
- Brand-bearing work also checks for `design/brand-guidelines.md` +
  `brand-voice-guidelines.md` and adopts them.

### 2. Explore — direction-finding (only where direction matters)

Runs for mockup, logo, cip, banner, presentation, canvas, theme. Not for
tokens/copy/handoff/to-code (no variants — see their sections).

- Generate 2–4 **versions** (`v1`, `v2`, …) of the target artifact using the
  shared engine (intelligence + taste gate + font kit).
- Compare on a comparison board (`design/state/board.html`), iterate
  with user feedback, **pick one**.
- Anti-slop gate: reject obvious clichés; if the first variants all converge on
  the same idea, force at least one divergent direction.

### 3. Build — finalize, verify, settle

- Produce the chosen version, named `design/<screen>/v1.html`
  (or `.svg`/`.png`/`.md` per mode). **Never name anything `final` or
  `finalized`** — versioning only.
- Verify: token compliance (if the artifact carries design tokens), quality
  rubric for the mode, visual check of the rendered output.
- **Settle:** delete the losing versions, rename the survivor to
  `<screen>.html` (drop the version suffix) — the screen name is the identity.

## Shared engine

All modes use these. Paths are relative to this skill's folder (deployed to
`.claude/skills/design/`).

| Engine | What it gives you | Where |
|---|---|---|
| **Design intelligence** | BM25 searchable corpus — styles, colors, industries, layout patterns, copy formulas, UX reasoning | `data/intelligence/*.csv`, query via `scripts/search/search.py "query"` |
| **Token spine** | brand → tokens → validated `design-tokens.css`; generate/validate/embed | `scripts/tokens/` (`generate-tokens.cjs`, `validate-tokens.cjs`, `embed-tokens.cjs`, `slide-token-validator.py`, `html-token-validator.py`, `sync-brand-to-tokens.cjs`, `extract-colors.cjs`, `inject-brand-context.cjs`, `validate-asset.cjs`) |
| **Taste gate** | anti-slop blacklist, anti-convergence, voice constants | `references/taste-gate.md` |
| **Comparison board** | HTML board + feedback loop for Explore | board HTML into `design/state/` |
| **Font kit** | 29 locally bundled OFL families (54 TTFs) | `assets/fonts/` |
| **Vendored libs** | `@chenglou/pretext` (text layout) and Chart.js v4.4.3 (opt-in data-viz) — **no CDN calls at runtime** | `assets/pretext/`, `assets/chart/` |
| **Slide engine** | search + generate + background from CSV corpus | `scripts/slides/` |
| **GIF builder** | PIL-based GIF assembly (Slack-spec aware) | `scripts/gif/` |
| **Code gen** | coderio (pinned) for Figma→code — opt-in, warns first | `scripts/to-code/` |

## Output layout — everything lives in `design/`

```
<project>/design/
├── DESIGN.md              ← confirmed design language (Consult). Locked before Build.
├── brand-guidelines.md    ← brand mode
├── brand-voice-guidelines.md
├── design-tokens.json / design-tokens.css
├── <screen>/
│   ├── v1.html  v2.html …   ← versions while exploring/settling
│   └── <screen>.html        ← the settled artifact (version suffix dropped)
├── state/                  ← transient: comparison board, previews, feedback
└── reviews/                ← design-reviewer reports (this skill never writes here)
```

No `.claude/designs/`, no `planning/mockups/`. **`design/` is the only
output root** for every mode. Transient exploration artifacts are created under
`state/` and may be cleaned on settle; the settled `<screen>/<screen>.html` and
the design language files are durable.

## Global rules

1. **Design language first.** No screen/code before DESIGN.md exists or is
   written by Consult. If the plan or the design disagree, surface it — never
   silently favor one.
2. **Version, never "final".** `v1`, `v2`, …; settle deletes losers and drops
   the version suffix. The words `final`/`finalized` are forbidden in artifact
   names.
3. **One mode per call**, modes pipeline when the request spans them.
4. **Every artifact passes the gate** for its mode: token validation (when
   tokens exist), the taste gate, and a rendered/visual check before it counts
   as done.
5. **No CDN at runtime.** Vendored libs only. `GEMINI_API_KEY` env var is the
   only external credential, used by the Gemini generators (`scripts/logo/`,
   `scripts/cip/`, `scripts/icon/`). Nothing fetched silently at runtime.
6. **Don't fetch, don't exfiltrate.** No hardcoded URLs fetched at runtime;
   reference docs are for humans, not for HTTP calls.
7. **Windows first-class.** Use `python` (Windows) or `python3`
   (macOS/Linux). The skill is deployed to Windows projects.

## Scripts quick map

| Script | Purpose |
|---|---|
| `scripts/search/search.py` | BM25 search over the intelligence corpus |
| `scripts/logo/{search,generate,core}.py` | logo style/color/industry search + Gemini logo gen |
| `scripts/cip/{search,generate,render-html,core}.py` | CIP deliverables + mockups + HTML presentation |
| `scripts/icon/generate.py` | Gemini SVG icon generation (text-output model) |
| `scripts/tokens/generate-tokens.cjs` | tokens.json → design-tokens.css |
| `scripts/tokens/validate-tokens.cjs` | validate token usage in code |
| `scripts/tokens/sync-brand-to-tokens.cjs` | brand → tokens pipeline |
| `scripts/tokens/validate-asset.cjs` | asset compliance check |
| `scripts/slides/generate-slide.py` | slide from CSV corpus |
| `scripts/slides/search-slides.py` | slide strategy/layout search |
| `scripts/gif/gif_builder.py` | GIF assembly (PIL) |
| `scripts/to-code/coderio-skill.mjs` | Figma → code (opt-in, gated) |
| `scripts/shadcn_add.py`, `scripts/tailwind_config_gen.py` | frontend scaffolding |

## References

| Topic | File |
|---|---|
| Design routing (fuller matrix) | `references/design-routing.md` |
| Taste gate (anti-slop, anti-convergence, voice) | `references/taste-gate.md` |
| UX guidelines quick reference (named rules, When-to-Apply, Common Rules, pre-delivery checklist) | `references/ux-guidelines-quick-ref.md` |
| Logo guides (style/color/prompt/psychology) | `references/logo-*.md` |
| CIP guides (design/deliverable/style/prompt) | `references/cip-*.md` |
| Icon design | `references/icon-design.md` |
| Banner sizes & styles | `references/banner-sizes-and-styles.md` |
| Social photos | `references/social-photos-design.md` |
| Slides (create/layout/template/copy/strategies) | `references/slides-*.md` |
| Brand (11 files + brand-voice/ 6) | `references/brand/` |
| Marp (syntax/themes/advanced) | `references/marp/` |
| Frontend process + content strategy | `references/design-process.md`, `references/content-strategy.md` |
| Premium web prompt checklist (15-item gate) + available libraries | `references/premium-web-prompt-checklist.md` |
| Design-system references (token architecture, primitive/semantic/component tokens, component specs, states & variants, tailwind integration) | `references/design-system/` |
| shadcn + Tailwind references (components, theming, accessibility, utilities, responsive, customization) | `references/ui-styling/` |
| Design tokens starter | `templates/design-tokens-starter.json` |
| Brand guidelines starter | `templates/brand-guidelines-starter.md` |
| Marp + theme-factory themes | `templates/marp/`, `templates/themes/` |

## Prerequisites

- **Python** (`python` on Windows) with `google-genai` + `pillow` for image
  generation: `python -m pip install google-genai pillow`.
- **GEMINI_API_KEY** — https://aistudio.google.com/apikey (logo / CIP / icon /
  social-photos only; all other modes run without it).
- `node` for the `.cjs` token/brand scripts.
- `to-code` mode additionally requires `npx coderio` (pinned) — gated, warns
  before running, and it is the only mode that writes application code.
