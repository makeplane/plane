# /design — social-photos mode

Multi-platform social media image design — Instagram/Facebook/Twitter/LinkedIn/
Pinterest/YouTube/TikTok/Threads — via HTML/CSS compositions rendered to
exact-size PNGs. Merged from the original umbrella's Social Photos section
plus `references/social-photos-design.md`.

## When you use (entry triggers)

- "Design social media images", "post images for Instagram/Facebook"
- "Instagram story templates", "LinkedIn post graphics", "Pinterest pins"
- A set of platform-sized images for one campaign ("a launch post for IG +
  X + LinkedIn").

Distinct from `banner` (wide-format covers/headers/ads) — this mode makes
feed posts, stories, thumbnails, and pins.

## Where on the spine

Social photos run the **full spine** (variants matter — concept variety).

- **Consult** — read `design/DESIGN.md` + `brand-guidelines.md`
  and adopt them. Parse the brief: subject, platforms, style, brand
  context, content elements, quantity (default 3). **Orchestrate first:**
  build the platform × size task matrix up front, track each export as a
  unit of work, and parallelize independent designs (different platforms
  with no shared element) rather than serializing them.
- **Explore** — generate 3–5 concept ideas varying composition, color, and
  typography; present for approval before designing.
- **Build** — one HTML file per approved idea × size, export, verify,
  settle.
- **Verify** — the visual-QA loop (below) before settling.

## Output layout (D17 + D19)

```
design/<screen>/
├── idea-1-ig-post-1080x1080.html …   ← compositions while exploring
├── state/                            ← transient exports, comparison board
└── <screen>/
    ├── <screen>-ig-post-1080x1080.png  …  ← settled exports
    └── social-photos-report.md          ← design decisions (NOT plans/reports/)
```

Never `plans/reports/`, never a random `output/` dump — everything under
`design/`. Filenames kebab-case: `{concept}-{platform}-{w}x{h}.png`.

## Mechanics

### 1. Analyze requirements

Parse the prompt for: subject/topic, target platforms (default IG Post 1:1
+ Story 9:16), visual style, brand context (read `brand-guidelines.md` if
it exists), content elements (headline, subtext, CTA, icons/images),
quantity.

### 2. Generate ideas

Create 3–5 concepts that match the brief, follow platform best practices,
and vary in composition/color/typography (taste-gate anti-convergence).
Present via a question and wait for approval before designing.

### 3. Design one HTML file per concept × size

For each approved idea × each target size, create a self-contained HTML file
at the exact pixel dimensions:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={WIDTH}, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: {WIDTH}px; height: {HEIGHT}px; overflow: hidden; }
    .canvas { width: {WIDTH}px; height: {HEIGHT}px; position: relative;
              background: [brand gradient/solid/image]; }
    /* Design tokens from design/design-tokens.css */
  </style>
</head>
<body><div class="canvas"><!-- content layers --></div></body>
</html>
```

HTML design rules:

- **Viewport** — exact pixel dimensions matching the target size.
- **Self-contained** — inline all CSS; fonts from the bundle's local font
  kit (`assets/fonts/`), never a Google Fonts CDN link.
- **No scrolling** — everything fits in one viewport.
- **High contrast** — readable at thumbnail size; WCAG AA 4.5:1.
- **Brand-aligned** — brand colors/fonts from `inject-brand-context.cjs`.
- **Safe zones** — critical content within the central 80%.
- **Typography floor** — ≥48px headline, ≥24px body at 1080px width.

If the concept needs a photographic or illustrative background, generate it
with this skill's own Gemini recipe (same as banner mode): Flash
`gemini-2.5-flash-image` for backgrounds/patterns, Pro
`gemini-3-pro-image-preview` for hero/product visuals, prompt always ends
"no text, no letters, no words" since text is overlaid in HTML.

### 4. Export screenshots

Serve the HTML (e.g., `python -m http.server`), then capture each at its
exact target size with a headless browser. **Always add a 3–5s delay after
load** so fonts/images settle, and use `deviceScaleFactor: 2` for
retina-quality output.

**Playwright:**

```javascript
// export-social.mjs
import { chromium } from "playwright";
const [w, h] = [1080, 1920];                     // exact target
const page = await (await chromium.launch()).newPage();
await page.setViewportSize({ width: w, height: h, deviceScaleFactor: 2 });
await page.goto("http://localhost:8765/idea-1-ig-story-1080x1920.html");
await page.waitForTimeout(5000);
await page.screenshot({ path: "design/state/idea-1-ig-story-1080x1920.png" });
await page.browser().close();
```

**Chrome headless CLI:**

```bash
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1080,1920 --virtual-time-budget=5000 \
  --screenshot="design/state/idea-1-ig-story-1080x1920.png" \
  "http://localhost:8765/idea-1-ig-story-1080x1920.html"
```

**Chrome MCP:** open each HTML, set the viewport to exact dimensions, wait
3–5s, screenshot full page.

### 5. Verify and fix

Visually inspect each exported PNG (Chrome MCP or open the file):

1. Fonts rendered (not falling back to system fonts).
2. No text overflow, clipping, or misalignment.
3. Elements inside safe zones (central 80%); no off-canvas content.
4. Contrast ≥ WCAG AA 4.5:1; readable at thumbnail size.
5. Colors match brand palette.

Fix issues in the HTML source → re-export → re-verify until clean.

### 6. Report (metadata, not narrative)

Write `design/<screen>/social-photo-report.md` with the
design decisions: requirements, platforms, variations, chosen style, color
palette rationale, typography, layout approach, output-file table
(`| file | size | platform | preview |`), why-it-works reasoning, and
A/B-test recommendations. This is the durable record; the transient HTML
and exports live alongside it.

### 7. Organize

Apply the asset-naming convention (`{type}_{campaign}_{description}_{date}
_{variant}.{ext}` from `references/brand/asset-organization.md`) and move
approved exports to the project asset folder; tag entries in
`.assets/manifest.json` (platform, size, concept). Archive old versions —
never delete.

## Platform sizes

| Platform | Type | Size (px) | Aspect |
|---|---|---|---|
| Instagram | Post | 1080 × 1080 | 1:1 |
| Instagram | Story / Reel | 1080 × 1920 | 9:16 |
| Instagram | Carousel | 1080 × 1350 | 4:5 |
| Facebook | Post | 1200 × 630 | ~1.9:1 |
| Facebook | Story | 1080 × 1920 | 9:16 |
| Twitter/X | Post | 1200 × 675 | 16:9 |
| Twitter/X | Card | 800 × 418 | ~1.91:1 |
| LinkedIn | Post | 1200 × 627 | ~1.91:1 |
| LinkedIn | Article | 1200 × 644 | ~1.86:1 |
| Pinterest | Pin | 1000 × 1500 | 2:3 |
| YouTube | Thumbnail | 1280 × 720 | 16:9 |
| TikTok | Cover | 1080 × 1920 | 9:16 |
| Threads | Post | 1080 × 1080 | 1:1 |

## Platform best practices

- **Instagram** — visual-first, minimal text (<20%), strong colors,
  lifestyle feel.
- **Facebook** — informative, more text ok, eye-catching in feed.
- **Twitter/X** — bold headlines, dark/light-mode contrast, clear message.
- **LinkedIn** — professional, clean, data-driven, thought-leadership.
- **Pinterest** — vertical, text overlay, how-to style.
- **YouTube** — face close-ups, bright colors, readable small.
- **TikTok** — trendy, energetic, bold typography, youth-oriented.

## Art-direction styles (reuse from banner)

| Style | Best for |
|---|---|
| Minimalist | SaaS, tech, luxury |
| Bold Typography | Announcements, quotes |
| Gradient Mesh | Modern brands, apps |
| Photo-Based | Lifestyle, e-commerce |
| Geometric | Tech, fintech |
| Glassmorphism | SaaS, modern apps |
| Flat Illustration | Education, health |
| Duotone | Creative, editorial |
| Collage | Fashion, culture |
| 3D / Isometric | Tech, product |

## Typography hierarchy (at 1080px width)

| Element | Min size | Weight |
|---|---|---|
| Headline | 48px | Bold/Black |
| Subheadline | 32px | Semibold |
| Body | 24px | Regular |
| Caption | 18px | Regular/Light |
| CTA | 28px | Bold |

## Verify

1. **Exact size** — every export matches its target px.
2. **QA checklist** — fonts rendered, no overflow/clipping, safe zones
   respected, contrast ≥4.5:1, palette correct.
3. **Taste gate** — concepts not convergent; no slop.
4. **Metadata written** — `social-photo-report.md` present under
   `design/<screen>/`.
5. **Settle** — delete losing concept files; keep the survivor's exports
   + report.

## References

| Topic | File |
|---|---|
| Social photos design guide | `references/social-photos-design.md` |
| Banner styles (shared art direction) | `references/banner-sizes-and-styles.md` |
| Brand asset organization / naming | `references/brand/asset-organization.md` |
| Taste gate | `references/taste-gate.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/tokens/inject-brand-context.cjs` | inject brand colors/type/voice into the HTML compositions |
| `scripts/tokens/extract-colors.cjs` | verify exported PNG colors against the brand palette |
| Inline Gemini recipe (this section) | generate photographic/illustrative backgrounds (flash/pro) |
| Export (Playwright / Chrome CLI / Chrome MCP) | exact-size retina PNG capture (generic headless-browser steps) |

## Inputs

`[subject] [platforms] [style] [quantity]` — e.g., "IG + FB launch post",
"a LinkedIn thought-leadership graphic", "3 Pinterest pins".
