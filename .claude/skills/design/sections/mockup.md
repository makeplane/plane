# /design — mockup mode

**Mode:** mockup / screen / page / dashboard design. Build output is HTML mockups that settle into `design/<screen>/<screen>.html`.

## When to use

"Mock up the dashboard", "design a login screen", "prototype this page", "make a mockup for the pricing page", "design an admin screen". Any request for a single screen, page, or dashboard as a visual artifact — before or instead of production code.

This mode is the full Consult → Explore → Build experience. Frontend *code* goes to `sections/frontend.md`; design-system tokens to `sections/design-system.md`.

## Workflow — mapped onto the universal spine

The universal Consult → Explore → Build skeleton (SKILL.md) applies. Mechanics specific to mockup mode:

### 1. Consult — design language first, always

1. **Check for an existing language.** If `design/DESIGN.md` exists, read it and adopt it — no invention. Ask only: *"update it, start fresh, or cancel?"* If brand work, also read `design/brand-guidelines.md` + `brand-voice-guidelines.md`.
2. **Gather product context.** Read `README.md` / `package.json` / `src/ app/ pages/ components/` heads; look for plan-creation output. Pre-fill a one-question brief: what the product is, who it's for, project type (web app / dashboard / marketing site / editorial / internal tool), and whether the user wants competitive research or design-from-knowledge. Two rounds of context gathering max — then proceed with assumptions stated.
3. **The memorable-thing question.** Ask: *"What's the one thing someone should remember after seeing this product the first time?"* One sentence. Every design decision downstream serves this.
4. **Research (only if the user opted in).** Run a web search on 5–10 products in the space; if Playwright MCP is available, screenshot the top 3–5 sites and analyze fonts/colors/layout/spacing/aesthetic. Synthesize in three layers: **tried-and-true** (what every product in the category shares — table stakes), **new-and-popular** (what's trending), **first-principles** (where this product should deliberately break convention). Graceful degradation: MCP → WebSearch-only → built-in knowledge.
5. **Propose the complete design language** as one coherent package, with a SAFE/RISK breakdown. SAFE choices = category baseline; RISKS = 2–3 deliberate departures that make the product memorable, each with what-it-is / why-it-works / what-it-costs. Option letters: A) generate preview, B) adjust a section, C) wilder risks, D) start over, E) skip preview and write DESIGN.md.

**Design language building blocks** (use to inform the proposal — do not dump as a menu):

| Axis | Options |
|---|---|
| Aesthetic | brutally minimal, maximalist chaos, retro-futuristic, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco, organic/natural, industrial/utilitarian |
| Decoration | minimal (type does the work) / intentional (subtle texture or grain) / expressive (full layered direction) |
| Layout | grid-disciplined · creative-editorial (asymmetry, overlap) · hybrid (grid for app, creative for marketing) |
| Color | restrained (1 accent + neutrals) · balanced (primary + secondary + semantic) · expressive (color as the primary tool) |
| Motion | minimal-functional · intentional (entrances + state transitions) · expressive (full choreography) |

**Font recommendations by role** — display/hero: Instrument Serif, Bricolage Grotesque, Italiana, Gloock, Erica One, Big Shoulders; body: Instrument Sans, Outfit, Work Sans, Libre Baskerville, Lora; data/tables: Geist Mono, IBM Plex Mono, Red Hat Mono, DM Mono, JetBrains Mono (tabular-nums); code: JetBrains Mono, Geist Mono, IBM Plex Mono. Cross-check the intelligence corpus (`--domain typography`, `--domain google-fonts`) for a pairing before committing.

**Never recommend as primary:** Papyrus, Comic Sans, Lobster, Impact, Jokerman, Bleeding Cowboys, Permanent Marker, Bradley Hand, Brush Script, Hobo, Trajan, Raleway, Clash Display, Courier New-for-body. **Overused (only if the user names them):** Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk — Space Grotesk especially, because every AI tool converges on it. Most of these are absent from the local font kit on purpose.

**Anti-convergence across generations in one project:** vary light/dark, fonts, and aesthetic direction; never propose the same choice twice without justification.

**AI slop anti-patterns** (never include): purple/violet gradients as default, 3-column feature grids with icons in colored circles, centered-everything with uniform spacing, uniform bubbly radius, gradient buttons as primary CTA, stock-photo hero sections, system-ui as primary face, "Built for X" copy patterns.

**Coherence validation** — when the user overrides one axis, gently flag, never block: brutalist + expressive motion, expressive color + restrained decoration, editorial layout + data-heavy product. Always accept the user's final choice.

6. **Write `design/DESIGN.md`** (before any screen) with: product context, aesthetic direction + mood + reference sites, typography (per-role faces + modular scale), color (approach + hex + semantic + dark-mode strategy), spacing (base 4/8px + density + scale), layout (approach + grid + max width + radius), motion (approach + easing + duration), and a Decisions Log table (date | decision | rationale). Where the generated design system comes from the intelligence engine, see Scripts below.
7. **Optional preview page** (`design/state/preview.html`): dogfood the system — fonts in their proposed roles, color swatches + sample components (primary/secondary/ghost buttons, cards, inputs, alerts), 2–3 realistic product layouts (dashboard table + sidebar; hero + features + testimonial + CTA; form with validation states), light/dark toggle via CSS variables. Local fonts only. If a headless environment can't open it, tell the user the path.
8. **Update the project's CLAUDE.md** (or the existing design note): "Always read DESIGN.md before visual/UI decisions. Flag any deviation in QA."

### 2. Explore — direction-finding (2–4 HTML variants)

1. **Context check:** if the calling flow already set a brief, skip to variants. Otherwise gather the 5 dimensions: who, job-to-be-done, what exists (components/pages in the codebase), user flow (arrive from / go next), edge cases (long names, zero results, errors, mobile, first-time vs power user).
2. **Taste memory.** Read `design/state/taste-profile.json` (persistent, cross-session) and the last 10 `design/state/approved.json` files (per-session, legacy). Summarize top-3 approved per dimension (`confidence * approved_count`, decay 5%/week computed at read time, never rewritten) and top-3 rejections; bias the brief toward approved signals and away from rejections. Conflict handling: if the request contradicts a strong persistent signal, say so and ask whether to update the profile or treat as one-off.
3. **Generate 2–4 variants as HTML.** Pick a screen name (`<screen>` kebab-case). Each variant is a distinct creative direction — give each a lettered name and a one-line visual description before building:
   ```
   A) "Quiet Ledger" — data-dense 12-col grid, monospace accents, near-black
   B) "Editorial Feast" — asymmetric magazine spreads, serif display, cream ground
   C) "Glass Cabin" — light-first, layered surfaces, restrained single accent
   ```
   **Anti-convergence directive (hard):** each variant MUST use a different font family, color palette, and layout approach. If someone could swap the headline between two variants without noticing, one of them failed — regenerate the weaker one. Variants should feel like three different design teams.
4. **Build each variant** at `design/<screen>/vN.html` (v1, v2, …). Use the design intelligence engine (below) to ground each direction: `--design-system` for the baseline, `--domain style|color|typography|landing|ux` to deepen each variant.
5. **Comparison board.** Write `design/state/board.html` that embeds or links the variant files side by side, open it, and run the feedback loop: user comments → regenerate/remix → new board → repeat until one is picked. ask_user_question is only the blocking wait; the board is the chooser. Save the outcome to `design/state/approved.json` (`{approved_variant, feedback, date, screen, branch}`); on explicit rejection note the rejected tags for taste memory.

**Judge every variant against the UX laws** (folded from design-shotgun — observed behavior, not preference):

| Law | Test |
|---|---|
| Don't make me think | Is every page self-evident? No "what do I click?" |
| Clicks don't matter, thinking does | Three mindless clicks beat one that requires thought |
| Omit, then omit again | Half the words, then half of what's left. Kill happy talk and instructions |
| Users scan, not read | Visual hierarchy: prominence = importance; billboards, not brochures |
| Users satisfice | The right choice must be the most visible choice |
| Billboard design | Conventions (logo top-left, search = magnifier); visual hierarchy; clickable things obviously clickable (no hover-only); eliminate shouting/disorganization/clutter; clarity trumps consistency |
| Navigation wayfinding | Every page answers: what site is this, what page am I on, major sections, options, search. Trunk test: cover nav → still oriented |
| Goodwill reservoir | Hiding pricing/contact, punishing format, splash screens, forced tours deplete it; make desired actions obvious, save steps, recover errors easily |
| Mobile = same rules, harder | 44px minimum touch targets, visible affordances, no hover discoverability, priorities in reach |

### 3. Build — finalize, verify, settle

**Input routing:** approved variant exists → pixel-match it (source of truth fidelity beats code elegance — `width: 312px` is correct if the mockup says so). Only DESIGN.md + description → plan-driven. Neither → freeform (ask for screen name, purpose, feel, structure, reference sites).

1. **Design analysis.** Describe the approved visual layout, colors, typography, component structure as the implementation spec. Real content only — extract from the mockup; never "Lorem ipsum" or placeholder text.
2. **Pretext tier routing.** Classify the screen and pick the Pretext API set:

| Design type | Pretext APIs |
|---|---|
| Simple layout (landing, marketing) | `prepare()` + `layout()` |
| Card/grid (dashboard, listing) | `prepare()` + `layout()` |
| Chat/messaging | `prepareWithSegments()` + `walkLineRanges()` |
| Content-heavy (editorial, blog) | `prepareWithSegments()` + `layoutNextLine()` |
| Complex editorial | full engine + `layoutWithLines()` |

3. **Framework detection.** `package.json` shows React/Svelte/Vue? Ask vanilla HTML first pass vs framework component. Default vanilla if none detected.
4. **Write the HTML.** Continue at `design/<screen>/vN.html` until settled. Always include:
   - Local vendored libs — **no CDN**: `<script type="module">import { prepare, layout, prepareWithSegments, walkLineRanges, layoutNextLine, layoutWithLines, clearCache, setLocale } from '<skill-root>/assets/pretext/pretext.js'</script>` and, for charts, `<script src="<skill-root>/assets/chart/chart.umd.js"></script>` (Chart.js 4.4.3, UMD, sets `window.Chart`). `<skill-root>` is this skill's own deployed folder — the agent knows its own harness's skills directory.
   - Local font kit via `@font-face` pointing at `<skill-root>/assets/fonts/*.ttf` (29 OFL families) — never Google Fonts `<link>`/`@import` at runtime.
   - CSS custom properties for DESIGN.md tokens; `document.fonts.ready` gate before the first `prepare()`.
   - Semantic HTML5 (`<header> <nav> <main> <section> <footer>`), heading hierarchy, ARIA, visible focus-visible.
   - Responsive relayout (Pretext, not just media queries) at 375 / 768 / 1024 / 1440.
   - `contenteditable` on text + MutationObserver → re-prepare + re-layout; ResizeObserver on containers; `prefers-color-scheme` for dark mode; `prefers-reduced-motion`.
   - The AI-slop blacklist from `references/taste-gate.md` — none of it.

**Pretext wiring patterns** (use the ones for your tier):

```
API CHEATSHEET:
  prepare(text, font) → handle            // one-time, after fonts.ready; font = CSS shorthand '16px Inter'
  layout(prepared, maxWidth, lineHeight) → { height, lineCount }   // call on every resize, sub-ms
  prepareWithSegments(text, font) → handle                        // enables line-level APIs
  layoutWithLines(segs, maxWidth, lineHeight) → { lines:[{text,width,x,y}], height }  // canvas/SVG
  walkLineRanges(segs, maxWidth, onLine) → void                   // tight-fit / shrinkwrap
  layoutNextLine(segs, state, maxWidth, lineHeight) → { text, width, state } | null    // obstacles
  clearCache() / setLocale(locale?)
```

- **Pattern 1 — basic heights (simple, card/grid):** `await document.fonts.ready` → `prepare()` every `[data-pretext]` → `relayout()` calls `layout(handle, clientWidth, lineHeight)` and sets `el.style.height` → `new ResizeObserver(relayout)` → contenteditable MutationObserver re-prepares on edit.
- **Pattern 2 — shrinkwrap (chat bubbles):** binary-search the tightest width whose `layout()` line count equals `maxWidth`'s.
- **Pattern 3 — text around obstacles (editorial):** `prepareWithSegments`; per line, compute available width minus any obstacle intersecting the y-range, then `layoutNextLine(segs, state, availWidth, lineHeight)`.
- **Pattern 4 — manual lines (complex editorial):** `layoutWithLines` → absolutely-position spans per line.

5. **Live reload:** `python -m http.server 8765 --bind 127.0.0.1 &` (or `python3`); tell the user the URL. Kill the server when the loop ends.
6. **Refinement loop** (max 10 rounds). Show the approved mockup inline for comparison; ask via the interactive ask tool (ask_user_question) — if the ask tool is unavailable, ask the same question in plain text and wait for the answer — then make surgical edit-tool changes only (never regen the whole file — the user may have edited contenteditable text); 2–3 line summary per round. "done"/"looks good" → exit. If Playwright MCP is configured, take automated viewport screenshots at 375 / 768 / 1440 for verification instead of manual browser testing.
7. **Token extraction** — if no DESIGN.md exists, offer to create it from the HTML's CSS custom properties (colors, spacing, font sizes, radius, shadows). If accepted, run it through `scripts/tokens/sync-brand-to-tokens.cjs`.
8. **Settle.** Delete the losing versions. Rename the survivor `vN.html` → `<screen>.html` (drop the version suffix; the words `final`/`finalized` are forbidden). Leave a `settled.json` metadata next to it (`{source_mockup, mode, html_file, pretext_tier, framework, iterations, screen, branch}`).

## Verification / quality gate

Every mockup counts as done only when all of the following pass:

1. **Gate (taste):** read `references/taste-gate.md` — no slop, taste memory honored, anti-convergence held across variants.
2. **Token validation:** if the artifact carries tokens, run `scripts/tokens/html-token-validator.py <file>` (or `validate-tokens.cjs --dir` for code). No hardcoded hex/px in styled elements.
3. **UX quality bar** (from the intelligence corpus — priority order):

| # | Category | Must-have | Anti-pattern |
|---|---|---|---|
| 1 | Accessibility | contrast ≥4.5:1, alt text, keyboard nav, aria-labels | focus ring removal, icon-only buttons without labels |
| 2 | Touch & interaction | ≥44×44 targets, 8px+ gaps, loading feedback | hover-only, 0ms state changes |
| 3 | Performance | WebP/AVIF, lazy loading, reserved space (CLS<0.1) | layout thrashing |
| 4 | Style selection | match product type, consistency, SVG icons | random style mixing, emoji icons |
| 5 | Layout & responsive | mobile-first, systematic breakpoints, no horizontal scroll | fixed px containers, disabled zoom |
| 6 | Typography & color | base 16px, line-height 1.5, semantic color tokens | <12px body, gray-on-gray, raw hex |
| 7 | Animation | 150–300ms, meaning, spatial continuity | decorative-only, animating width/height |
| 8 | Forms & feedback | visible labels, error near field, helper text | placeholder-only, errors only at top |
| 9 | Navigation | predictable back, bottom-nav ≤5, deep linking | overloaded nav, broken back |
| 10 | Charts & data | legends, tooltips, accessible colors | color-only meaning |

   For the full named-guideline checklist (each category expanded into
   concrete rules with platform citations), the When-to-Apply gates, the
   Common Rules for Professional UI tables, and the complete pre-delivery
   checklist, read `references/ux-guidelines-quick-ref.md`.

4. **Rendered visual check:** screenshot or view at 375, 768, 1024, 1440. Watch for text overflow, layout collapse, responsive breakage. Reduced-motion + largest text-size behavior verified.
5. **Pre-delivery checklist:** no emoji-as-icons, cursor-pointer on clickables, hover transitions 150–300ms, 4.5:1 light-mode contrast, visible focus, prefers-reduced-motion, no horizontal scroll, no content under fixed bars.

## Scripts & references

| Asset | Path (relative to skill folder) | Use |
|---|---|---|
| Design intelligence (BM25) | `scripts/search/search.py` | `python scripts/search/search.py "<query>" --design-system -p "Name"` (full system), `--domain <d>` (domain), `--stack <s>` (framework), `-o design` when persisting |
| Intelligence corpus | `data/intelligence/*.csv` | styles, colors, typography, landing, products, ux-guidelines, charts, app-interface, react-performance, icons, google-fonts, ui-reasoning |
| Taste gate | `references/taste-gate.md` | anti-slop, taste memory, anti-convergence |
| UX guidelines quick ref | `references/ux-guidelines-quick-ref.md` | named rules by priority, When-to-Apply, Common Rules, pre-delivery checklist |
| Token spine | `scripts/tokens/{generate,validate,embed}-tokens.*`, `html-token-validator.py` | DESIGN.md → design-tokens.css → validate mockup |
| Font kit | `assets/fonts/` | local `@font-face`; never CDN |
| Pretext (vendored) | `assets/pretext/pretext.js` | text layout; local module import |
| Chart.js (vendored) | `assets/chart/chart.umd.js` | opt-in data-viz; local script tag |
| Design process | `references/design-process.md` | brainstorm → plan → critique → build |
| UX copy rules | `references/content-strategy.md` | word-level guidance for mock copy |
| Frontend process/copy | `references/design-routing.md` | cross-mode routing |
