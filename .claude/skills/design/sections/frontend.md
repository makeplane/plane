# /design — frontend mode

**Mode:** website / frontend / component / shadcn / Tailwind / React implementation. Build output is React + shadcn/Tailwind (or plain HTML) code committed to the project.

## When to use

"Build me a landing page", "implement this design in React", "add a pricing card with shadcn", "make a dashboard component", "style this UI with Tailwind", "make it look professional / expensive / premium / award-winning". Distinct from mockup mode: here you ship code, not an artifact mockup. A user asking for Awwwards-grade, luxury, editorial, or agency-quality landing work gets the **premium quality bar** (below) added to the normal bar.

## Workflow — mapped onto the universal spine

Frontend is a Consult-heavy, Build-heavy mode. It does **not** run the multi-version Explore loop (that's mockup mode); direction is settled inside Consult as a brainstorm-and-critique pass, then executed. If the user wants to see direction options before code, run mockup mode first and implement the chosen one here.

### 1. Consult — commit to one bold, non-template direction

1. **Adopt the existing language.** Read `design/DESIGN.md` if it exists — every color and type decision derives from it. For brand-bearing work adopt `design/brand-guidelines.md` + voice guidelines. If no language exists, propose one and write DESIGN.md before any code (per the universal spine).
2. **Ground it in the subject.** If the brief doesn't pin the product down, pin it yourself: one concrete subject, its audience, and the page's single job. The subject's own world — materials, instruments, artifacts, vernacular — is where distinctive choices come from. Build with real content throughout.
3. **Commit to an extreme.** Pick one tone: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, industrial/utilitarian. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity. Then name the one thing the user will remember (the signature element).
4. **Brainstorm the compact token system** (`references/design-process.md`):
   - **Color:** 4–6 named hex values.
   - **Type:** 2+ roles — a characterful display face used with restraint, a complementary body face, a utility face for captions/data.
   - **Layout:** a layout concept in one-sentence prose + ASCII wireframes to compare.
   - **Signature:** the single unique element this page is remembered by.
5. **Self-critique before building.** Re-run the brief: if any part of the plan reads like the generic default you'd produce for any similar page, revise it and say what changed and why. Calibration — AI design clusters around three defaults: (1) warm cream `#F4F1EA` + high-contrast serif + terracotta accent; (2) near-black + one acid accent; (3) broadsheet hairline rules, zero radius, dense columns. All legitimate for some briefs, but they are defaults, not choices. Where the brief leaves an axis free, don't spend the freedom on a default.
6. **UX copy** (from `references/content-strategy.md`): words are design material. Name things by what the user controls ("Save changes", not "Submit"); keep action names stable across the flow ("Publish" → toast "Published"); errors state what went wrong and how to fix it, in the interface's voice; empty states are invitations to act; plain verbs, sentence case, no filler, one job per element.

**Premium check (when the user asked for expensive / Awwwards / agency quality):**

- **Research the industry — deeply.** Study ≥5 real reference sites (mix industry giants + less-famous editorial/cultural operators; the obscure ones carry the unique moves, the famous ones anchor the palette). Record per site: display font, body font, palette hexes, structural DNA, one signature move. Write a 6–10 line "Design reference pull" before coding. Do not copy — combine one move from each.
- **Name the primary structural concept out loud** before any markup — a single noun phrase:

| # | Structural DNA | Shape |
|---|---|---|
| 1 | Index Manuscript | one long editorial column, single typographic rhythm, reads like a manuscript |
| 2 | Sticky Horizontal Diorama | vertical scroll revealing a horizontally-panning scene (`position: sticky` + `translateX`) |
| 3 | Two-Pane Permanent Split | sticky pane + scrolling pane; navigation happens inside a pane |
| 4 | Slide Sequence | full-viewport snap-scrolling slides, each a different composition |
| 5 | Staged Object on a Plinth | single 3D/image subject centered; the rest is orbiting marginalia |
| 6 | Pinned Narrative (scrollytelling) | 2–4-screen pin with discrete content states; used once as the centerpiece |
| 7 | Horizontal Navigation | primary page scroll is horizontal |
| 8 | Sidebar + Column | fixed left sidebar (nav/metadata/footer), right column is the whole site |
| 9 | Chapter Gates | full-viewport dividers between tonal zones; the page changes character |
| 10 | Ledger / Registry | tabular rows dominate; bill-of-lading / ship's-manifest typography |
| 11 | Collage / Grid-Breaker | magazine asymmetric grid with deliberate ruptures |
| 12 | Single Object, No Chrome | just the subject + one sentence; no nav, no footer |
| 13 | Product UI Slate | hero = realistic simulation of the product's own UI |
| 14 | Dashboard Tile Grid | live-feeling dashboard: counters, sparklines, pulsing pips |
| 15 | Conversation Timeline | simulated transcript/chat plays back on scroll |

  Start from the client's central fact; do **not** reuse the DNA used by the previous site in this session; **never** mix two structures into one site (it dilutes both).
- **Vary the nav.** The default three-column top bar reads as a signature after three sites. Options: no nav (Single Object), sidebar-baked nav, bottom-fixed `⌘K` command bar, inline wordmark + secondary strip, horizontal-scroll index, marquee ticker nav, left-vertical nav, status-bar nav with a live pip, marquee strip + slim top bar. Pick what belongs to the brand.
- **Avoid the editorial-luxury default** in tech fields. For AI/tech/dev-tooling, skew white or near-black (not cream), neo-grotesque sans display, monospace as display type, gradient glow edges, shipped UI screenshots, keyboard-shortcut chips, code blocks in the hero — think Vercel, Cursor, Linear, Stripe, Figma, Arc.

### 2. Build — implement per the quality bar

**Scaffolding.**

```bash
npx shadcn@latest init                     # framework, TypeScript, paths, theme prompts
npx shadcn@latest add button card dialog form
python scripts/shadcn_add.py button card --dry-run    # scripted install + dep handling
python scripts/tailwind_config_gen.py --colors brand:#3b82f6 --fonts sans:'Inter,system-ui' --plugins
# Tailwind-only (Vite): npm install -D tailwindcss @tailwindcss/vite → @import "tailwindcss";
```

shadcn components are copy-paste + Radix UI primitives (accessible), TypeScript-first; the CLI writes `components.json`. Catalog coverage: form/input (Button, Input, Select, Checkbox, Date Picker, Form), layout/nav (Card, Tabs, Accordion, Navigation Menu), overlays (Dialog, Drawer, Popover, Toast, Command), feedback (Alert, Progress, Skeleton), display (Table, Data Table, Avatar, Badge). Theming runs on CSS variables + a `.dark` class; dark mode via a next-themes-style toggle that flips the class. Tailwind: `@theme` for custom tokens, `@layer base/components/utilities`, `@apply` only for true repetition, mobile-first breakpoints (sm/md/lg/xl/2xl), container queries for content-sized components.

**The AI-slop blacklist** — never:

| Sins | Examples |
|---|---|
| Typography | Inter/Poppins/Montserrat/Raleway/Space Grotesk/Outfit as primary; one family for everything; uniform 64→32→18→14 hierarchy; centered multi-line text everywhere; default letter-spacing everywhere |
| Color | purple-to-blue gradients; indigo as a brand color without reason; white + one accent + gray SaaS kit; gradient-on-everything; opacity as a substitute for color choice; neon-on-dark "dev portfolio" |
| Layout | hero → 3-col feature grid → testimonials → CTA → footer; predictable section order; symmetric equal-card grids; everything centered in a max-width container; rounded-rect + shadow as the default component; icon+heading+paragraph rows of 3–4; generic hero with two side-by-side buttons; flat static hero |
| Motion | fade-from-below on scroll everywhere; identical transitions; hover = scale/shadow only; spinners instead of skeletons |
| Imagery / decoration | blob shapes, floating geometric shapes, gradient meshes, uniform stock grids, emoji or generic line icons as markers |

**Typography as identity** (premium execution):
- Display/headline: characterful serif/display (Instrument Serif, Crimson Pro, Lora, Gloock, Bricolage Grotesque, Big Shoulders); body: neutral-but-refined (Instrument Sans, Work Sans, IBM Plex Sans); monospace accent for labels/dates/data (IBM Plex Mono, JetBrains Mono, DM Mono, Red Hat Mono). Mix weights dramatically — a 900 headline next to a 300 body.
- `clamp()` fluid type, dramatic scale (headlines ≥8vw on desktop), negative tracking on large headlines (`-0.03em` to `-0.06em`), body line-height 1.6–1.8, tight 0.9–1.1 on headlines, mixed alignment, `max-width` 45–75ch, `text-wrap: balance`, uppercase micro-labels with `0.1em+` tracking. Prefer the local font kit (`assets/fonts/`) via `@font-face` — never a Google Fonts fetch.

**Color as atmosphere:** start black and white, add color only when it earns its place. One dominant hue with intention. Off-whites (`#FAFAF8`, `#F5F0EB`) and near-blacks (`#1A1A1A`, `#0D0D0D`) feel more designed than pure white/black. Monochromatic/analogous palettes with one contrast moment. Dark themes = considered layering with warm/cool tints, not white-on-gray. Color used sparingly hits harder. CSS variables + semantic tokens (never raw hex in components).

**Industry matching (premium reference):** Aerospace/defense → dark grounds (`#0A0A0A`, `#0C1222`), clean sans, minimal silver/blue accents; automotive → deep blacks, dramatic light, geometric sans, metallic accents; fashion/luxury → extreme restraint, serif display, thin sans body, near-black/off-white, no bright accents; food → cream/charcoal/muted earth, editorial serifs, generous whitespace; tech/AI → white or near-black, monospace display, systematic grids; finance/legal → navy/charcoal/forest, traditional serifs, structured grids. Bad choices: orange+white for aerospace, cyan-on-black for everything, same accent color across unrelated industries.

**Structure the blueprint:** start from the structural DNA chosen in Consult, then give each section one idea and no more. A page should be *graspable*: the hero communicates what this is and its single job within 5 seconds (headline + one supporting line + one primary action; value proof right there — a number, a screenshot, a shipped logo strip); features answer "what does it do for me" in subject terms; proof sections (testimonials, process, numbers) earn belief; the closing gives one next step. Keep every section tied to the DNA — a sticky-horizontal site does not suddenly collapse into a three-column feature grid because a template says so. Where the premium reference is explicit: hero text communicates immediately, navigation is obvious, sections flow toward the close.

**Layout within the structural DNA:**
- Break the grid intentionally: full-bleed moments, oversized imagery, asymmetric 60/40 or 70/30 splits. Whitespace as a luxury signal (`8rem`+ between sections). Overlapping elements with `mix-blend-mode`. Sticky labels that accompany scroll. Tabular/ledger rows for lists. Editorial form fields (mono labels over serif inputs, bottom-border only).
- Within a session, do **not** repeat: two "sticky left column + scrolling right" process sections, two 33/67 asymmetric heroes, two "enquiry form + colophon grid" closers. Vary the closing move.

**Motion & scroll:**
- Choreograph: stagger everything (`animation-delay` or sequenced timers); fast entrance 200–300ms + slow settle 500–800ms; easing defines personality — `cubic-bezier(0.16, 1, 0.3, 1)` overshoot, `cubic-bezier(0.77, 0, 0.175, 1)` snappy, `cubic-bezier(0.33, 1, 0.68, 1)` elegant; clip-path reveals; split-text per-word animations; cursor-following or magnetic buttons.
- Scroll-driven techniques (pick 2–3, don't repeat a session centerpiece): parallax layers (background 0.2x / midground 0.5x / content 1.0x / floats 1.2x), horizontal-scroll section (`position: sticky` + `translateX`), scale-on-scroll, text reveal, scroll-linked color transitions, pinned sequences, zoom-through. Libraries (npm project deps): GSAP ScrollTrigger (complex), Framer Motion (React), Locomotive Scroll (smooth + parallax), Lenis (smooth only), CSS `scroll-timeline` (native). Story-beat structure: Hook → Context → Journey → Climax → Resolution.
- Scroll anti-patterns: no scroll hijacking (enhance, don't replace), no animation overload, no desktop-only effects — test on real devices and simplify.

**Micro-details that signal craft:** custom cursor, scroll-progress indicator, smooth scroll, designed loading states (skeletons that match layout), considered hover/active/focus transitions, border-radius used sparingly (0 for editorial/brutalist or very specific radii — never the default 8px everywhere), grain/noise SVG overlay for warmth, `::selection` styled, webkit scrollbar styled.

**Production & accessibility details (premium bar):**
- **Semantic HTML5 + SEO:** landmark elements (`<header>` `<nav>` `<main>` `<section>` `<footer>`), one `<h1>` per page, logical heading hierarchy, descriptive `alt` on every image, `meta` title/description, Open Graph tags, canonical URL, favicon, 404 page. The page degrades with JS disabled.
- **Responsive breakpoints:** systematic 480 / 768 / 1024 / 1440 (mobile-first: base styles then `min-width` overrides); fluid type with `clamp()`; no fixed-px containers on critical content; viewport meta, `overflow-x: hidden` only as a safety net, never the fix.
- **Performance & resilience:** lazy-load below-the-fold images (`loading="lazy"`), `width`/`height` or `aspect-ratio` reserved so layout doesn't shift (CLS < 0.1), WebP/AVIF via `<picture>` with PNG/JPG fallback, self-hosted fonts with `font-display: swap`, `prefers-reduced-motion` honored, `content-visibility` for long sections.
- **Interaction polish:** 150–300ms hover/active transitions with consistent easing, `cursor-pointer` on clickables, visible `:focus-visible` states, focus-visible ring matches the accent, no hover-only affordances (state must be discoverable on touch), sticky nav doesn't cover anchored content (`scroll-margin-top`).
- **Dark mode:** `prefers-color-scheme` or a next-themes-style class toggle flipping CSS variables; contrast re-verified in dark independently — not a filter, a chosen palette.

**Hard-to-implement features** (from the premium reference — these are the differentiators; a user explicitly asking for one gets it, and one per page):
- Animated text: marquee, typewriter, per-letter reveals, hover-word swaps.
- Interactive components: accordion, tabs, draggable carousel, tooltip, context menu.
- Sections that feel alive: endless-moving backgrounds, CSS-only keyframe choreography (meteor streaks, gradient blobs, aurora, stars, particles), hover-driven transformations.
- Dashboard-live elements: counters, sparklines, pulsing pips, progress rings.
- Sticky + scroll-cued moments: sticky panels, scroll progress, pinned sequences, horizontal panes.

**Optional 3D / imagery (static-only).** The discipline is retained; the fetching is not. If the user supplies 3D scenes or photography (self-hosted/downloaded), apply: **topic-literal, not metaphorical** (the object must literally depict the subject — an Earth scene suits a spaceflight company, not a "global reach" family office); **no real-branded products** (a Nike shoe on a fictional brand's site is trademark confusion and collapses the illusion); **verify before committing** (renders, subject nameable in two seconds, mood matches brand); **skeleton layer** under heavy media (never blank white); **layered fallback** (client asset → user scene → curated photography → CSS/SVG illustration → atmospheric background) so the page always has a hero. Nothing fetched from a CDN at runtime.

**Implementation rules (React .jsx):** default export component; always `import React, { useState, useEffect, useRef } from "react"`; no JSX fragments (`<>…</>`) — use spans/divs; `IntersectionObserver` + `useRef`/`useState` for scroll reveals; inline styles or a `<style>` block with CSS variables; desktop-first, then restructure (not shrink) at breakpoints; `clamp()` for fluid spacing.

**Content:** real copy, never placeholder (from `references/content-strategy.md`). The copy decides the feel as much as the layout — treat it as design material.

### 3. Settle

Frontend output is committed code, not an artifact — so "settle" means: run the gate below, then hand off working code in the project tree (not under `design/`). If you produced preview artifacts while iterating, put them in `design/<screen>/` and clean the losers.

## Verification / quality gate

1. **Token validation:** if the project has tokens, `node scripts/tokens/validate-tokens.cjs --dir src/` — no hardcoded hex/RGB/px (≥2 digits)/rem in components; semantic tokens only.
2. **Render check:** view at 375 / 768 / 1024 / 1440; verify contrast independently in light and dark; reduced-motion + largest text size; no horizontal scroll; no content under fixed bars.
3. **UX pre-delivery checklist** (intelligence corpus): no emoji icons (SVG Lucide/Heroicons), `cursor-pointer` on clickables, hover transitions 150–300ms, 4.5:1 text contrast (3:1 secondary on dark), visible focus states, `prefers-reduced-motion`, touch targets ≥44px, one icon family with consistent stroke, tabular figures for data, safe-area compliance.
4. **Anti-slop re-check:** read the blacklist table again against the result. The swap test: would this page be identical if built for a different brief? If yes, it failed.

## Scripts & references

| Asset | Path | Use |
|---|---|---|
| Design intelligence | `scripts/search/search.py` | `python scripts/search/search.py "<product> <industry> <keywords>" --design-system -p "Name"`; domain `--domain style\|color\|typography\|landing\|product\|ux`; stack `--stack nextjs\|react\|shadcn\|vue\|svelte\|astro` |
| shadcn installer | `scripts/shadcn_add.py` | scripted `npx shadcn add` with dependency handling (`--dry-run`, `--list`, `--all`) |
| Tailwind config gen | `scripts/tailwind_config_gen.py` | `--colors NAME:HEX --fonts TYPE:FAMILY --spacing --breakpoints --plugins --framework react\|vue\|svelte\|nextjs` |
| Design process | `references/design-process.md` | brainstorm → plan → critique → build → critique again |
| UX copy rules | `references/content-strategy.md` | copywriting as design material |
| Taste gate | `references/taste-gate.md` | shared anti-slop + taste memory |
| Token spine | `scripts/tokens/` | `generate-tokens.cjs`, `validate-tokens.cjs`, `embed-tokens.cjs`, `html-token-validator.py` |
| Font kit | `assets/fonts/` | local faces for `@font-face` — never CDN |
| Vendored Chart.js | `assets/chart/chart.umd.js` | local `<script>` for data-viz |
| shadcn references | `references/ui-styling/shadcn-{components,theming,accessibility}.md` | component catalog + usage, next-themes provider, ARIA/keyboard/focus |
| Tailwind references | `references/ui-styling/tailwind-{utilities,responsive,customization}.md` | utility patterns, breakpoints/container queries, `@theme`/`@layer`/`@apply` |
| Premium prompt checklist | `references/premium-web-prompt-checklist.md` | the 15-item prompt gate + available libraries |
