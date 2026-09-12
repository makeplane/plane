# Design Routing Guide

When to use each mode of the consolidated `design` skill. The skill is one
umbrella — a request dispatches to a single mode (see SKILL.md "Entry modes —
dispatch"); modes pipeline when a request spans them (logo → CIP → deck).

## Mode Overview

| Mode | Purpose | Key files |
|-------|---------|-----------|
| brand | Brand identity, voice, assets | `sections/brand.md` + `references/brand/` (11 + brand-voice/ 6) + `scripts/tokens/` |
| design-system | Token architecture, specs | `sections/design-system.md` + `references/design-system/` (7) + `scripts/tokens/` |
| frontend | Component implementation (shadcn/Tailwind) | `sections/frontend.md` + `references/ui-styling/` (7) + `scripts/shadcn_add.py`, `tailwind_config_gen.py` |
| logo | AI logo generation (55 styles / 55 palettes / 55 industries) | `sections/logo.md` + `references/logo-*.md` + `scripts/logo/` |
| cip | Corporate Identity Program (50 deliverables) | `sections/cip.md` + `references/cip-*.md` + `scripts/cip/` |
| presentation | HTML presentations with Chart.js | `sections/presentation.md` + `references/slides-*.md` + `scripts/slides/` |
| banner | Banners for social, ads, web, print (22 styles) | `sections/banner.md` + `references/banner-sizes-and-styles.md` |
| icon | SVG icon generation (15 styles, Gemini 3.1 Pro) | `sections/icon.md` + `references/icon-design.md` + `scripts/icon/` |
| social-photos | Multi-platform post images | `sections/social-photos.md` + `references/social-photos-design.md` |
| canvas | Poster / art / print / magazine page | `sections/canvas.md` + `references/ui-styling/canvas-design-system.md` |
| theme | Deck theme presets | `sections/theme.md` + `templates/themes/` (10) + `templates/theme-showcase.pdf` |
| animation | GIF assembly | `sections/animation.md` + `scripts/gif/` |
| to-code | Figma → code (opt-in, gated) | `sections/to-code.md` + `scripts/to-code/` |
| handoff | Spec for engineers | `sections/handoff.md` |
| ux-copy | Microcopy / button / error / empty state | `sections/ux-copy.md` |

## Routing by Task Type

### Brand Identity Tasks
**→ `/design brand`**

- Define brand colors and typography
- Create logo usage guidelines
- Establish brand voice and tone
- Organize and validate assets
- Create messaging frameworks
- Audit brand consistency

### Token System Tasks
**→ `/design design-system`**

- Create design tokens JSON
- Generate CSS variables
- Define component specifications
- Map tokens to Tailwind config
- Validate token usage in code
- Document state and variants

### Implementation Tasks
**→ `/design frontend`**

- Add shadcn/ui components
- Style with Tailwind classes
- Implement dark mode
- Create responsive layouts
- Build accessible components

### Logo Design Tasks
**→ `/design logo`**

- Create logos with AI (Gemini Flash/Pro)
- Search logo styles, color palettes, industry guidelines
- Generate design briefs
- Explore 55 styles (minimalist, vintage, luxury, geometric, etc.)

### Corporate Identity Program Tasks
**→ `/design cip`**

- Generate CIP deliverables (business cards, letterheads, signage, vehicles, apparel)
- Create CIP briefs with industry/style analysis
- Generate mockups with/without logo (Gemini Flash/Pro)
- Render HTML presentations from CIP mockups

### Presentation Tasks
**→ `/design presentation`**

- Create strategic HTML presentations
- Data visualization with Chart.js (vendored, opt-in)
- Apply copywriting formulas to slide content
- Use layout patterns and design tokens

### Banner Design Tasks
**→ `/design banner`**

- Design banners for social media (Facebook, Twitter, LinkedIn, YouTube, Instagram)
- Create ad banners (Google Ads, Meta Ads)
- Website hero banners and headers
- Print banners and covers
- 22 art direction styles (minimalist, bold typography, gradient, glassmorphism, etc.)

### Icon Design Tasks
**→ `/design icon`**

- Generate SVG icons with AI (Gemini 3.1 Pro Preview)
- Batch icon variations in multiple styles
- Multi-size export (16px, 24px, 32px, 48px)
- 15 styles: outlined, filled, duotone, rounded, sharp, gradient, etc.
- 12 categories: navigation, action, communication, media, commerce, data

## Routing by Question Type

| Question | Mode |
|----------|-------|
| "What color should this be?" | brand |
| "How do I create a token for X?" | design-system |
| "How do I build a button component?" | frontend |
| "Is this on-brand?" | brand |
| "Should I use a CSS variable here?" | design-system |
| "How do I add dark mode?" | frontend |
| "Create a logo for my brand" | logo |
| "Generate business card mockups" | cip |
| "Create a pitch deck" | presentation |
| "Design brand identity package" | cip |
| "What logo style fits my industry?" | logo |
| "Design a Facebook cover" | banner |
| "Create ad banners for Google" | banner |
| "Make a website hero banner" | banner |
| "Generate a settings icon" | icon |
| "Create SVG icons for my app" | icon |
| "Design an icon set" | icon |

## Multi-Mode Workflows

### New Project Setup

```
1. brand → Define identity
   - Colors, typography, voice

2. design-system → Create tokens
   - Primitive, semantic, component

3. frontend → Implement
   - Configure Tailwind, add components
```

### Design System Migration

```
1. brand → Audit existing
   - Extract brand colors, fonts

2. design-system → Formalize tokens
   - Create three-layer architecture

3. frontend → Update code
   - Replace hardcoded values
```

### Component Creation

```
1. design-system → Reference specs
   - Button states, sizes, variants

2. frontend → Implement
   - Build with shadcn/ui + Tailwind
```

## Mode Dependencies

```
brand
    ↓ (colors, typography)
design-system
    ↓ (tokens, specs)
frontend
    ↓ (components)
Application Code
```

## Quick Commands

**Brand:**
```bash
node <this skill's own deployed folder>/scripts/tokens/inject-brand-context.cjs
node <this skill's own deployed folder>/scripts/tokens/validate-asset.cjs <path>
```

**Tokens:**
```bash
node <this skill's own deployed folder>/scripts/tokens/generate-tokens.cjs -c tokens.json
node <this skill's own deployed folder>/scripts/tokens/validate-tokens.cjs -d src/
```

**Components:**
```bash
npx shadcn@latest add button card input
```

## When to Use Multiple Modes

Use **all modes** when:
- Complete brand package from scratch (logo → CIP → presentation)

Use **brand + design-system + frontend** when:
- Design system setup and implementation

Use **logo + cip** when:
- Complete brand identity package with deliverable mockups

Use **logo + cip + presentation** when:
- Brand pitch: generate logo, create CIP mockups, build pitch deck

Use **banner + brand** when:
- Social media presence: branded banners across all platforms

Use **icon + design-system** when:
- Custom icon set matching design tokens and component specs

Use **brand + design-system** when:
- Defining design language without implementation

Use **design-system + frontend** when:
- Implementing existing brand in code
- Building component library
