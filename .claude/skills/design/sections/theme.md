# /design — theme mode

**Mode:** themes / "style my deck". Build output is an existing artifact (slides, docs, report, landing page) restyled with a chosen or freshly-generated theme.

## When to use

"Style my deck", "theme this presentation", "give this document a theme", "apply a theme to the landing page", "make it consistent". The artifact already exists; the job is to impose one cohesive font-and-color identity on it. If the artifact doesn't exist yet, build it first (presentation / mockup / frontend mode) and then theme it.

## Workflow — mapped onto the universal spine

### 1. Consult — choose the theme

1. **Adopt existing language.** If `design/DESIGN.md` or brand guidelines exist, they override theme defaults for any value they define. A theme then fills the gaps rather than replacing the language.
2. **Show the theme showcase** — display `templates/theme-showcase.pdf` (the visual catalog of all 10 pre-set themes; no modifications, just present). The table below is the data summary of the same set:

| # | Theme | Palette (hex) | Headers / Body | Best used for |
|---|---|---|---|---|
| 1 | Ocean Depths | `#1a2332` `#2d8b8b` `#a8dadc` `#f1faee` | DejaVu Sans Bold / DejaVu Sans | corporate, financial reports, consulting, trust-building |
| 2 | Sunset Boulevard | `#e76f51` `#f4a261` `#e9c46a` `#264653` | DejaVu Serif Bold / DejaVu Sans | warm, vibrant, energetic |
| 3 | Forest Canopy | `#2d4a2b` `#7d8471` `#a4ac86` `#faf9f6` | FreeSerif Bold / FreeSans | natural, grounded, earth tones |
| 4 | Modern Minimalist | `#36454f` `#708090` `#d3d3d3` `#ffffff` | DejaVu Sans Bold / DejaVu Sans | clean, contemporary, grayscale |
| 5 | Golden Hour | `#f4a900` `#c1666b` `#d4b896` `#4a403a` | FreeSans Bold / FreeSans | rich, warm, autumnal |
| 6 | Arctic Frost | `#d4e4f7` `#4a6fa5` `#c0c0c0` `#fafafa` | DejaVu Sans Bold / DejaVu Sans | cool, crisp, winter-inspired |
| 7 | Desert Rose | `#d4a5a5` `#b87d6d` `#e8d5c4` `#5d2e46` | FreeSans Bold / FreeSans | soft, sophisticated, dusty tones |
| 8 | Tech Innovation | `#0066ff` `#00ffff` `#1e1e1e` `#ffffff` | DejaVu Sans Bold / DejaVu Sans | bold, modern, tech |
| 9 | Botanical Garden | `#4a7c59` `#f9a620` `#b7472a` `#f5f3ed` | DejaVu Serif Bold / DejaVu Sans | fresh, organic, garden colors |
| 10 | Midnight Galaxy | `#2b1e3e` `#4a4e8f` `#a490c2` `#e6e6fa` | FreeSans Bold / FreeSans | dramatic, cosmic, deep tones |

3. **Ask which theme** to apply; get explicit confirmation. If none fits, generate a **new theme on-the-fly**: name it like the set (a descriptor of what the font/color combination represents), pick colors + font pairing from the user's description or the artifact's intent, show it for review, then apply.
4. **Font remap note:** theme files name system faces (DejaVu/FreeSans). When the artifact renders with the bundled kit, remap the pair to the closest local face in `assets/fonts/` (e.g. a serif header pair → Crimson Pro / Instrument Serif / Lora; a clean sans pair → Instrument Sans / Work Sans / Outfit; a tech pair → Geist Mono / IBM Plex Mono accents) — keep the *theme's* identity, expressed with bundled fonts.
5. **Audience sanity check.** The theme's "best used for" must match the artifact's audience: a trust-building deck does not get neon tech colors, a startup pitch does not get a dusty-rose museum palette. If the fit is wrong, say so and propose the adjacent theme that fits.

**What a theme file holds** (`templates/themes/*.md`): a name, 4 palette hexes (dark base, accent, mid, light/base — the pairings in the table above), a header/body font pair (named as system faces, remapped at render), and a "best used for" line. A theme is an identity — one palette + one font pairing — never a loose collection of "nice" colors. When creating a custom theme on the fly, produce the same shape: name it, choose 4 hexes that work together (test the dark-bg/light-text pair for contrast before proposing it), pick the font pair, state its best-used-for, and show it for review.

### 1.5 — Apply to the artifact type

The theme lands on every surface of the artifact, consistently:

| Artifact | Theme touches |
|---|---|
| Presentation/deck | cover, section dividers, content slides, charts, closing; one theme end-to-end — a deck that changes character per slide has failed |
| Document/report | title page, TOC, headings, body, tables, figures, footer |
| Landing page / web | nav, hero, headings, cards, buttons, form fields, footer — applied via CSS variables so it stays theme-swappable |
| Brand asset (logo, socials) | accent on light, accent on dark, mono/serif/sans variant per the theme's pair |

For a deck or HTML artifact, chart colors and any data-viz must come from the theme palette (vendored `assets/chart/chart.umd.js`), and if the artifact carries tokens, the theme fills the semantic slots (`var(--color-primary)` etc.) rather than bypassing them.

### 2. Explore — compare candidates on the artifact

Apply the top candidate theme (and, if relevant, one alternative) as **versions of the artifact**: `design/<screen>/v1.html … vN.html` (a deck's HTML, a document's CSS, a landing page). Put them on `design/state/board.html` so the user sees the difference applied to *their* content, not a swatch sheet. Pick one. If only one theme is genuinely suitable, apply it directly without manufacturing a fake alternative.

### 3. Build — apply the theme

1. Read the chosen theme file from `templates/themes/`.
2. Apply its colors and fonts **consistently throughout** the artifact — headings, body, tables, charts, covers, footers. No orphaned default styling. Sweep every page/section for stragglers (a default blue hyperlink, a default font stack in one block) — the sweep is part of the job.
3. Ensure proper contrast and readability (4.5:1 body text; the theme's dark bg/light text pairs verified — e.g. Ocean Depths' cream on navy, Midnight Galaxy's silver on deep purple — independently, not assumed from the light mode).
4. Maintain the theme's visual identity across every page/section — a deck that changes character per slide has failed the theme.
5. **Settle** — delete the losing version(s), rename the survivor (drop `vN`; `final`/`finalized` are forbidden words). If the artifact is a presentation, confirm navigation, token compliance (`var(--color-*)` if it carries tokens), and that Chart.js data-viz uses the vendored `assets/chart/chart.umd.js`.

## Verification / quality gate

1. **Consistency:** one palette, one font pairing, everywhere. Sweep for stray defaults.
2. **Contrast & readability:** every text/surface pair ≥4.5:1; dark themes checked independently (not assumed from light).
3. **Identity:** the artifact reads as "one thing" — the theme's best-used-for context matches the artifact's audience (a trust-building deck doesn't get neon tech colors).
4. **Gate:** taste gate (`references/taste-gate.md`) — theme application is not decoration slop; token compliance when the artifact carries tokens (`scripts/tokens/html-token-validator.py`).

## Scripts & references

| Asset | Path | Use |
|---|---|---|
| Theme showcase | `templates/theme-showcase.pdf` | visual catalog of the 10 themes — show, don't modify |
| Pre-set themes | `templates/themes/*.md` | the 10 themes: palettes, font pairs, best-for |
| Font kit | `assets/fonts/` | bundled faces for font-pair remapping |
| Taste gate | `references/taste-gate.md` | shared quality bar |
| Token validator | `scripts/tokens/html-token-validator.py` | theme applied with tokens stays compliant |
