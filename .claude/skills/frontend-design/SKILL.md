---
name: ck:frontend-design
description: Create polished frontend interfaces from designs/screenshots/videos. Use for web components, 3D experiences, replicating UI designs, quick prototypes, immersive interfaces, avoiding AI slop.
license: Complete terms in LICENSE.txt
metadata:
  author: claudekit
  version: "1.0.0"
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

**IMPORTANT**: MUST follow Design Thinking, Frontend Aesthetics Guidelines, Asset & Analysis References, and Anti-Patterns (AI Slop) sections below. DO NOT skip these rules.

## Workflow Selection

Choose workflow based on input type:

| Input | Workflow | Reference |
|-------|----------|-----------|
| Screenshot | Replicate exactly | `./references/workflow-screenshot.md` |
| Video | Replicate with animations | `./references/workflow-video.md` |
| Screenshot/Video (describe only) | Document for devs | `./references/workflow-describe.md` |
| 3D/WebGL request | Three.js immersive | `./references/workflow-3d.md` |
| Quick task | Rapid implementation | `./references/workflow-quick.md` |
| Complex/award-quality | Full immersive | `./references/workflow-immersive.md` |
| Existing project upgrade | Redesign Audit | `./references/redesign-audit-checklist.md` |
| From scratch | Design Thinking below | - |

**All workflows**: Activate `ck:ui-ux-pro-max` skill FIRST for design intelligence.

**Precedence:** When anti-slop rules (below) conflict with `ck:ui-ux-pro-max` recommendations (e.g., Inter font, AI Purple palette, Lucide-only icons), substitute with alternatives from `./references/anti-slop-rules.md` unless the user explicitly requested the conflicting choice.

## Screenshot/Video Replication (Quick Reference)

1. **Analyze** with `ck:ai-multimodal` skill - extract colors, fonts, spacing, effects
2. **Plan** with `ui-ux-designer` subagent - create phased implementation
3. **Implement** - match source precisely
4. **Verify** - compare to original
5. **Document** - update `./docs/design-guidelines.md` if approved

See specific workflow files for detailed steps.

## Design Dials

Three configurable parameters that drive design decisions. Set defaults at session start or let user override via chat:

| Dial | Default | Range | Low (1-3) | High (8-10) |
|------|---------|-------|-----------|-------------|
| `DESIGN_VARIANCE` | 8 | 1-10 | Perfect symmetry, centered layouts, equal grids | Asymmetric, masonry, massive empty zones, fractional CSS Grid |
| `MOTION_INTENSITY` | 6 | 1-10 | CSS hover/active states only | Framer Motion scroll reveals, spring physics, perpetual micro-animations |
| `VISUAL_DENSITY` | 4 | 1-10 | Art gallery — huge whitespace, expensive/clean | Cockpit — tiny paddings, 1px dividers, monospace numbers everywhere |

**Usage:** These values drive specific rules. At `DESIGN_VARIANCE > 4`, centered heroes are overused — force split-screen or left-aligned layouts. At `MOTION_INTENSITY > 5`, embed perpetual micro-animations. At `VISUAL_DENSITY > 7`, remove generic cards and use spacing/dividers.

See `./references/bento-motion-engine.md` for dial-driven SaaS dashboard implementation.

## Design Thinking

Before coding, commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

**Remember:** Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

**Assets**: Generate images with `ck:ai-multimodal`, process with `ck:media-processing`

## Asset & Analysis References

| Task | Reference |
|------|-----------|
| Generate assets | `./references/asset-generation.md` |
| Analyze quality | `./references/visual-analysis-overview.md` |
| Extract guidelines | `./references/design-extraction-overview.md` |
| Optimization | `./references/technical-overview.md` |
| Animations | `./references/animejs.md` |
| Magic UI (80+ components) | `./references/magicui-components.md` |
| Anti-slop forbidden patterns | `./references/anti-slop-rules.md` |
| Redesign audit checklist | `./references/redesign-audit-checklist.md` |
| Premium design patterns | `./references/premium-design-patterns.md` |
| Performance guardrails | `./references/performance-guardrails.md` |
| Bento motion engine (SaaS) | `./references/bento-motion-engine.md` |

Quick start: `./references/ai-multimodal-overview.md`

## Anti-Patterns (AI Slop)

Strongly prefer alternatives to these LLM defaults. Full rules: `./references/anti-slop-rules.md`

**Typography** — Avoid Inter/Roboto/Arial. Prefer: Trending Google Fonts that supports Vietnamese characters, `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi` (search for best matches)

**Font size** — ALWAYS use font size larger than 16px for input fields to avoid zoom on mobile devices.

**Color** — Avoid AI purple/blue gradient aesthetic, pure `#000000`, oversaturated accents. Use neutral bases with a single considered accent.

**Layout** — Avoid 3-column equal card feature rows, centered heroes at high variance, `h-screen`. Use asymmetric grids, split-screen, `min-h-[100dvh]`. Mobile-first approach is a must.

**Content** — Avoid "John Doe", "Acme Corp", round numbers, AI copy clichés ("Elevate", "Seamless", "Unleash"). Use realistic names, organic data, plain specific language.

**Effects** — Avoid neon/outer glows, custom cursors, gradient text on headers (unless you're asked to do so). Use tinted inner shadows, spring physics.

**Components** — Avoid default unstyled shadcn, Lucide-only icons, generic card-border-shadow pattern at high density. Always customize, try Phosphor/Heroicons, use spacing over cards.

**Quick check:** See the "AI Tells" checklist in `./references/anti-slop-rules.md` before delivering any design.

**Performance:** Animation and blur rules in `./references/performance-guardrails.md`

Remember: Claude is capable of extraordinary creative work. Commit fully to distinctive visions.
