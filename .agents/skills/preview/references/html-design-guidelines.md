# HTML Design Guidelines

Guidelines for generating distinctive, high-quality HTML pages. Read this before generating any HTML output.

---

## Anti-Slop: Forbidden Patterns

These patterns are explicitly forbidden — they signal "AI-generated template" and undermine quality. Check every page against this list before delivering.

### Typography — Forbidden Fonts as Primary `--font-body`

- **Inter** — the single most overused AI default
- **Roboto, Arial, Helvetica** — generic system fallbacks promoted to primary
- **system-ui, sans-serif alone** — no character, no intent

**Required:** Pick from the font pairings in `html-libraries.md`. Every generation should use a different pairing from the last.

### Color Palette — Forbidden Accents

- `#8b5cf6`, `#7c3aed`, `#a78bfa` — Tailwind's indigo/violet defaults
- `#d946ef` — fuchsia
- `#06b6d4` + `#d946ef` + `#f472b6` — the cyan + magenta + pink neon gradient combination
- Any palette describable as "Tailwind defaults with purple/pink/cyan accents"

**Forbidden color effects:**
- Gradient text on headings (`background: linear-gradient(...); background-clip: text;`) — screams AI-generated
- Animated glowing box-shadows (`@keyframes glow { box-shadow: 0 0 20px... }`) — always produces AI slop
- Multiple overlapping radial glows in accent colors creating a "neon haze"
- Pulsing/breathing effects on static content
- Continuous animations that run after page load (except progress indicators)

**Required accents (use these):**
- Terracotta + sage (`#c2410c`, `#65a30d`) — warm, earthy
- Teal + slate (`#0891b2`, `#0369a1`) — technical, precise
- Rose + cranberry (`#be123c`, `#881337`) — editorial, refined
- Amber + emerald (`#d97706`, `#059669`) — data-focused
- Deep blue + gold (`#1e3a5f`, `#d4a73a`) — premium, sophisticated

### Section Headers — Forbidden

- Emoji icons in section headers (🏗️ ⚙️ 📁 💻 📅 🔗 ⚡ 🔧 📦 🚀, etc.)
- Section headers that all use the same icon-in-rounded-box pattern

**Required:** Use styled monospace labels with colored dot indicators (`.section-label` + `.ve-card__label` pattern), numbered badges, or asymmetric section dividers. If an icon is genuinely needed, use inline SVG matching the palette.

### Layout — Forbidden

- Perfectly centered everything with uniform padding
- All cards styled identically with the same border-radius, shadow, and spacing
- Every section getting equal visual treatment — no hero/primary vs. secondary distinction
- Symmetric layouts where left and right halves mirror each other

### Template Clichés — Forbidden

- Three-dot window chrome (red/yellow/green dots) on code blocks
- KPI cards where every metric has identical gradient text treatment
- "Neon Dashboard" aesthetic
- Gradient meshes with pink/purple/cyan blobs in the background

### The Slop Test

Before delivering, check: **Would a developer immediately think "AI generated this"?**

Signs of slop:
1. Inter or Roboto font with purple/violet gradient accents
2. Every heading has `background-clip: text` gradient
3. Emoji icons leading every section
4. Glowing cards with animated shadows
5. Cyan-magenta-pink color scheme on dark background
6. Perfectly uniform card grid with no visual hierarchy
7. Three-dot code block chrome

If two or more are present: regenerate with Blueprint, Editorial, Paper/ink, or a specific IDE theme.

---

## Palette Cohesion Principles

**Every generated page must feel like one intentional color story.** This is the single most important readability rule.

1. **Background warmth must match accent warmth.** Terracotta accents need warm cream backgrounds (`#faf7f5`), not cool gray (`#f8f9fa`). Teal accents need cool-tinted backgrounds (`#f0fdfa`). Mixing warm accents on cool backgrounds (or vice versa) creates visual dissonance that makes pages feel generic.

2. **Text-dim must belong to the same family.** On warm backgrounds, use warm grays (`#8a7e72`, `#a69889`). On cool backgrounds, use cool grays (`#5f8a85`, `#8b949e`). Never use GitHub-style `#6b7280` on warm cream.

3. **Borders should be tinted, not neutral.** Use `rgba(0, 0, 0, 0.07)` or palette-tinted borders instead of flat `#e5e7eb`. Borders should be barely visible — felt, not seen.

4. **Surface layers create depth without fighting.** Define `--surface`, `--surface2`, and `--surface-elevated` as gradations of the same hue, not different colors.

5. **Extend every palette with semantic colors.** Every preset below should also define `--green`, `--red`, `--amber`, `--sage`, `--teal`, `--plum` (and their `*-dim` variants) that harmonize with the base palette. Richer semantic sets prevent monotony without clashing.

---

## 6 Curated Style Presets

Pick one and commit. The constrained presets (Blueprint, Editorial, Paper/Ink, Terminal Mono) are safer — they have specific requirements that prevent defaulting to generic patterns.

**IMPORTANT:** After choosing a preset, extend it with semantic colors (`--green`, `--red`, `--amber`, `--sage`, `--teal`, `--plum` + `*-dim` variants) that harmonize with the base palette. The default palette in `html-css-patterns.md` shows the full semantic structure — replicate that structure for whichever preset you choose.

### Blueprint

Technical drawing feel. Subtle grid background, deep slate/blue palette, monospace labels, precise borders.

```css
:root {
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'SF Mono', monospace;
  --bg: #0d1421;
  --surface: #111d2e;
  --surface-elevated: #162438;
  --border: rgba(100, 160, 220, 0.12);
  --border-bright: rgba(100, 160, 220, 0.22);
  --text: #c8d8e8;
  --text-dim: #607080;
  --accent: #4a90d9;
  --accent-dim: rgba(74, 144, 217, 0.1);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f0f4f8;
    --surface: #ffffff;
    --surface-elevated: #e8eef4;
    --border: rgba(30, 60, 100, 0.1);
    --text: #1a2a3a;
    --text-dim: #5a7090;
    --accent: #1a5fa8;
    --accent-dim: rgba(26, 95, 168, 0.08);
  }
}
```

Background: faint dot grid (`background-image: radial-gradient(circle, var(--border) 1px, transparent 1px); background-size: 24px 24px`). Monospace labels throughout.

### Editorial

Serif headlines (Instrument Serif or Crimson Pro), generous whitespace, muted earth tones or deep navy + gold.

```css
:root {
  --font-body: 'Instrument Serif', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  --bg: #0f1729;
  --surface: #162040;
  --surface-elevated: #1d2b52;
  --border: rgba(200, 180, 140, 0.08);
  --text: #e8e4d8;
  --text-dim: #9a9484;
  --accent: #d4a73a;
  --accent-dim: rgba(212, 167, 58, 0.1);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #faf8f2;
    --surface: #ffffff;
    --surface-elevated: #f5f0e6;
    --border: rgba(30, 30, 50, 0.08);
    --text: #1a1814;
    --text-dim: #7a7468;
    --accent: #b8860b;
    --accent-dim: rgba(184, 134, 11, 0.08);
  }
}
```

### Paper/Ink

Warm cream `#faf7f5` background, terracotta/sage accents, informal feel.

```css
:root {
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'Azeret Mono', 'SF Mono', monospace;
  --bg: #faf6f0;
  --surface: #ffffff;
  --surface-elevated: #fffdf5;
  --border: rgba(60, 40, 20, 0.08);
  --text: #2c2a25;
  --text-dim: #7c756a;
  --accent: #c2410c;
  --accent-dim: rgba(194, 65, 12, 0.08);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1916;
    --surface: #262220;
    --surface-elevated: #3a3430;
    --border: rgba(200, 180, 160, 0.08);
    --text: #f0e8dc;
    --text-dim: #a09888;
    --accent: #e85d2a;
    --accent-dim: rgba(232, 93, 42, 0.1);
  }
}
```

### Terminal Mono

Green/amber on near-black, monospace everything. Developer-native.

```css
:root {
  --font-body: 'Geist Mono', 'SF Mono', Consolas, monospace;
  --font-mono: 'Geist Mono', 'SF Mono', Consolas, monospace;
  --bg: #0a0e14;
  --surface: #12161e;
  --surface-elevated: #222836;
  --border: rgba(80, 250, 123, 0.06);
  --text: #c8d6e5;
  --text-dim: #5a6a7a;
  --accent: #50fa7b;
  --accent-dim: rgba(80, 250, 123, 0.08);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f4f6f8;
    --surface: #ffffff;
    --border: rgba(0, 80, 40, 0.08);
    --text: #1a2332;
    --text-dim: #5a6a7a;
    --accent: #0d7a3e;
    --accent-dim: rgba(13, 122, 62, 0.08);
  }
}
```

Background: faint dot grid. Everything monospace. CRT glow optional (CSS only, no animation).

### Swiss Clean

White, geometric sans, single bold accent, visible grid. Minimal and precise.

```css
:root {
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'SF Mono', monospace;
  --bg: #ffffff;
  --surface: #f8f8f8;
  --surface-elevated: #ffffff;
  --border: rgba(0, 0, 0, 0.08);
  --text: #111111;
  --text-dim: #666666;
  --accent: #0055ff;
  --accent-dim: rgba(0, 85, 255, 0.06);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111111;
    --surface: #1a1a1a;
    --surface-elevated: #2a2a2a;
    --border: rgba(255, 255, 255, 0.08);
    --text: #f0f0f0;
    --text-dim: #888888;
    --accent: #3b82f6;
    --accent-dim: rgba(59, 130, 246, 0.08);
  }
}
```

### Warm Signal

Cream paper, bold sans, terracotta accents. Confident, modern. Same as Paper/Ink but bolder.

Uses Plus Jakarta Sans + Azeret Mono, terracotta `#c2410c` accent. See Paper/Ink preset above — Warm Signal is the same palette with higher contrast headings and stronger section dividers.

---

## Typography Rules

### Font Pairings (12 options — rotate, never repeat consecutively)

| Body / Headings | Mono / Labels | Feel | Use for |
|---|---|---|---|
| DM Sans | Fira Code | Friendly, developer | Blueprint, technical docs |
| Instrument Serif | JetBrains Mono | Editorial, refined | Plan reviews, decision logs |
| IBM Plex Sans | IBM Plex Mono | Reliable, readable | Architecture diagrams |
| Bricolage Grotesque | Fragment Mono | Bold, characterful | Data tables, dashboards |
| Plus Jakarta Sans | Azeret Mono | Rounded, approachable | Status reports, audits |
| Outfit | Space Mono | Clean geometric, modern | Flowcharts, pipelines |
| Sora | IBM Plex Mono | Technical, precise | ER diagrams, schemas |
| Crimson Pro | Noto Sans Mono | Scholarly, serious | RFC reviews, specs |
| Fraunces | Source Code Pro | Warm, distinctive | Project recaps |
| Geist | Geist Mono | Vercel-inspired, sharp | Modern API docs |
| Red Hat Display | Red Hat Mono | Cohesive family | System overviews |
| Libre Franklin | Inconsolata | Classic, reliable | Data-dense tables |

The first 5 pairings are recommended for most use cases.

### Load via Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

Always use `display=swap` for fast rendering. Include system font fallback in `font-family` stack.

### Typography by Content Voice

For prose-heavy pages, match fonts to content voice:

| Voice | Fonts | Best For |
|-------|-------|----------|
| Literary / Thoughtful | Literata, Lora, Newsreader, Merriweather | Essays, personal posts, long-form |
| Technical / Precise | IBM Plex Sans + Mono, Geist + Geist Mono | Documentation, READMEs, API refs |
| Bold / Contemporary | Bricolage Grotesque, Space Grotesk, DM Sans | Product pages, announcements |
| Minimal / Focused | Source Serif 4 + Source Sans 3, Karla + Inconsolata | Tutorials, focused reading |

---

## Quality Checklist

Before delivering any HTML page:

- **Squint test**: Blur your eyes. Can you still perceive hierarchy? Are sections visually distinct?
- **Swap test**: Would replacing fonts and colors with a generic dark theme make this indistinguishable? If yes, push the aesthetic further.
- **Theme toggle (MANDATORY)**: Toggle button MUST be present (first child of `<body>`). Switch between light and dark using the button. Both themes should look intentional, not broken. See `html-css-patterns.md` → "Theme Toggle Button".
- **Information completeness**: Does the page actually convey what was asked? Pretty but incomplete is a failure.
- **No overflow**: Resize the browser. No content should clip or escape its container. Every grid/flex child needs `min-width: 0`. Side-by-side panels need `overflow-wrap: break-word`.
- **Mermaid zoom controls**: Every `.mermaid-wrap` must have zoom controls (+/−/reset/expand), Ctrl/Cmd+scroll zoom, click-and-drag panning, and click-to-expand. See `html-css-patterns.md`.
- **File opens cleanly**: No console errors, no broken font loads, no layout shifts.

---

## Depth Tier System

Vary card depth to signal importance. Hero sections dominate; reference sections stay compact.

```css
/* Default — flat, no shadow */
.ve-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
}

/* Elevated — KPIs, key sections */
.ve-card--elevated {
  background: var(--surface-elevated);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Recessed — code blocks, secondary content */
.ve-card--recessed {
  background: color-mix(in srgb, var(--bg) 70%, var(--surface) 30%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Hero — executive summaries, focal elements */
.ve-card--hero {
  background: color-mix(in srgb, var(--surface) 92%, var(--accent) 8%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  border-color: color-mix(in srgb, var(--border) 50%, var(--accent) 50%);
}
```

Rule: Don't make everything elevated — when everything pops, nothing does.

---

## Content-Type Routing

When deciding how to render content:

| Content type | Approach | Why |
|---|---|---|
| Architecture (text-heavy) | CSS Grid cards + flow arrows | Rich card content needs CSS control |
| Architecture (topology-focused) | **Mermaid** | Visible connections need automatic edge routing |
| Flowchart / pipeline | **Mermaid** | Automatic node positioning |
| Sequence diagram | **Mermaid** | Lifelines need automatic layout |
| Data flow | **Mermaid** with edge labels | Connections need auto-routing |
| ER / schema diagram | **Mermaid** | Relationship lines between entities |
| State machine | **Mermaid** | State transitions with labeled edges |
| Mind map | **Mermaid** | Hierarchical branching |
| Class diagram | **Mermaid** | Inheritance lines with auto-routing |
| C4 architecture | **Mermaid** `graph TD` + `subgraph` | Native C4 hardcodes its own styles |
| Data table | HTML `<table>` | Semantic markup, accessibility, copy-paste |
| Timeline | CSS (central line + cards) | Simple linear layout |
| Dashboard | CSS Grid + Chart.js | Card grid with embedded charts |
| Simple A→B→C flows in slides | CSS Pipeline cards | Mermaid renders too small for simple linear flows |

---

## AI Image Generation

If `/ck:ai-multimodal` skill is available and image generation is appropriate, it can be used for hero banners, conceptual illustrations, and decorative accents that establish the page's visual tone.

**When to use:** Hero banners, conceptual illustrations for abstract systems, educational diagrams benefiting from artistic rendering, decorative accents reinforcing the aesthetic.

**When to skip:** Anything Mermaid or CSS handles well. Generic decoration that doesn't convey meaning. Data-heavy pages where images would distract. Always degrade gracefully — the page should stand on its own with CSS and typography alone.

For `--slides` presentation-grade output, consider invoking `/ck:ui-ux-pro-max` for richer style selection and distinctive font/palette pairing.
