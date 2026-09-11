# Premium Web — Prompt Checklist & Available Libraries

Preserved verbatim from `premium-web-design` (merged 2026-08-26). Used by
the `frontend` mode's Consult phase when a premium site is being built.

## The prompt must be detailed — a checklist, not a paragraph

When a user (or this skill) drafts a `prompt.md` for a new site, a short
prompt produces short output. The skill produces its best work when the
prompt names every decision explicitly. A **complete prompt** contains
each of the following, in order:

1. **Field-first declaration** — the industry, the specific product inside it, why this field is real (not a dodge for a scene).
2. **Scene / subject match** — Spline URL, what it depicts, what the site's subject is, confirmation they are the same noun, the scene's native backdrop color, the site's ground color, theme-harmony verdict.
3. **Previous scenes used this session** — the list of URLs already used, confirming the new URL is not in it.
4. **Structural DNA** — the chosen concept by name, the previous sites' DNAs, confirmation the new one is distinct.
5. **Design reference pull** — 5+ specific real production sites, for each: the one move we're borrowing, named. For tech/AI, include Vercel, Cursor, Linear, Windsurf as defaults.
6. **Palette** — 4–6 hex values with emotional roles (ground / ink / accent / secondary-accent).
7. **Font stack** — display / body / mono, by name. Reject any of the blacklisted fonts (Inter, Poppins, Montserrat, Raleway, Space Grotesk, Outfit).
8. **Nav pattern** — which of the nav variants from the catalogue this site uses; explicitly not the default top-bar three-column layout unless it's genuinely the right choice.
9. **Brand voice** — 3–5 sentences of voice calibration. How does the copy read? What does this brand NOT say?
10. **Structure — every section** — name, position, what it contains, length. A 6-section prompt yields a 6-section site; a vague "some sections" prompt yields a template.
11. **Specific copy hooks** — at least 3 concrete lines that must appear verbatim on the site (hero headline, a pull quote, a closing line). These anchor tone.
12. **Specific technical hooks** — if tech/AI: keyboard-shortcut chips, fake code blocks, specific pricing tiers, fake CLI commands, fake product names, fake customer logos (marked as illustrative). If luxury: batch numbers, commission registers, specific material provenance.
13. **Motion choreography** — 2–3 specific motion techniques: one hero-entry animation, one scroll-driven behaviour, one micro-interaction. Do not repeat techniques used in previous sites this session.
14. **Critical rules / banned moves** — what this site must NOT do: banned colors, banned structural moves, banned patterns from the previous sites. Explicit.
15. **Render verification checkpoint** — after build, the specific screenshot the builder must take and the specific failure mode to watch for.

A prompt is "done" when every one of those 15 items has a concrete,
specific answer. Vague answers ("warm palette", "some motion", "clean
layout") are rejected — they are the failure mode of the skill.

## Available Libraries

- **Three.js (r128)** — for atmospheric backgrounds only (particles, grids). Import as `import * as THREE from 'three'`. Note: `THREE.CapsuleGeometry` is NOT available in r128. OrbitControls are NOT available — implement camera movement manually.
- **@splinetool/viewer** for `<spline-viewer>` web component — opt-in only, per the frontend mode's static-only Spline posture (never a silent runtime CDN fetch; the user supplies the scene)
- **lucide-react** for icons (but use sparingly — overuse of icons is an AI tell)
- **recharts** for data visualization
- **d3** for complex animations/visualizations
- **lodash** for utilities
- **Tone.js** for audio
