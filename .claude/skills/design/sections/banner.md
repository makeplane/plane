# /design — banner mode

Banner, cover, header, hero, and ad design across social, display, web, and
print — 22 art-direction styles, exact-size export. Unifies the original
umbrella's Banner section with the former `banner-design` skill into one
workflow: art direction → HTML/CSS composition → Gemini visuals → exact-size
PNG export → side-by-side iteration.

## When you use (entry triggers)

- "Design a banner / cover / header", "Facebook cover", "YouTube channel
  art", "Twitter header"
- "Ad banner for Google/Meta", "website hero banner", "print banner"
- Creative asset generation for a campaign.

Distinct from `social-photos` (posts/images in the feed) — banners are
wide-format headers, covers, and ads.

## Where on the spine

Banner runs the **full spine** (variants matter).

- **Consult** — read `design/DESIGN.md` + `brand-guidelines.md`
  and adopt them; inject brand context into the composition. Gather
  requirements (purpose, platform, content, brand, style, quantity).
- **Explore** — pick 2–3 art-direction styles and build each as an HTML
  composition (`v1`, `v2`, …); iterate on feedback.
- **Build** — export the chosen direction at the exact platform size,
  verify, settle.
- **Verify** — the design-rule gate (below) before settling.

## Output layout (D17 + D19)

```
design/<screen>/
├── v1.html  v2.html …        ← compositions while exploring
├── state/                    ← transient: exported previews, comparison board
└── <screen>.html             ← settled composition
    └── <screen>-<size>.png   ← settled exact-size exports
```

Export to `design/`, never `assets/banners/` as the primary home.
kebab-case filenames `{style}-{width}x{height}.png`; date-prefix
time-sensitive campaigns `{YYMMDD}-{style}-{size}.png`.

## Prerequisites

- For Gemini visuals: `GEMINI_API_KEY` set, `python -m pip install
  google-genai pillow`.
- `python` (Windows) / `python3` (macOS/Linux).
- Screenshot export needs a headless browser — Playwright (npm) or the
  Chrome browser binary (CLI below). All export instructions here are
  generic headless-browser steps, no external design skills required.

## Mechanics

### 1. Gather requirements

Collect via one round of questions: purpose (social cover / ad / hero /
print), platform + size, content (headline, subtext, CTA, logo placement),
brand (existing guidelines? if none, run brand mode first), style
preference (offer the table below if unsure), quantity (default 3).

### 2. Research and art direction

1. Browse design references for art direction inspiration (Pinterest,
   Dribbble, or the platform itself — a human/agent research step, not a
   scripted fetch). Search patterns: `[purpose] banner design [style]`,
   `[platform] cover design inspiration`, `creative banner layout
   [industry]`, `[style] graphic design 2026`, `banner ad design [product]`.
2. Select 2–3 complementary art directions from the 22 styles.

### 3. Design the composition

For each art direction, build an **HTML/CSS composition** sized to the exact
target dimensions:

1. Apply brand context (`node scripts/tokens/inject-brand-context.cjs`).
2. Set the viewport to the exact platform size; self-contained CSS.
3. Use the bundle's local font kit (`assets/fonts/`), not a Google Fonts
   CDN link.
4. Apply the design rules (safe zones, one CTA, max 2 typefaces,
   4.5:1 contrast).

**Generate the visual elements with this skill's own Gemini recipe.** For
backgrounds, patterns, hero visuals, or product shots:

```python
# Inline recipe — paste into a python script (scripts/ are .cjs/.py per mode;
# this is a plain SDK call, not a bundled file)
from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
model = "gemini-2.5-flash-image"          # flash: backgrounds, patterns, fast A/B
# model = "gemini-3-pro-image-preview"   # pro: hero illustrations, 4K detail

resp = client.models.generate_content(
    model=model,
    contents="No text, no letters, no words. [full visual description — "
             "style, lighting, mood, palette, composition]",
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        image_config=types.ImageConfig(aspect_ratio="16:9"),  # match platform
    ),
)
for part in resp.candidates[0].content.parts:
    if getattr(part, "inline_data", None):
        with open("design/state/banner-bg.png", "wb") as f:
            f.write(part.inline_data.data)
```

Model choice:

| Use case | Model | Notes |
|---|---|---|
| Backgrounds, gradients, patterns | Flash `gemini-2.5-flash-image` | 2K, fast |
| Hero illustrations, product shots | Pro `gemini-3-pro-image-preview` | 4K, detailed |
| Photorealistic scenes, complex art | Pro | best quality |
| Quick iterations, A/B variants | Flash | fast |

Aspect ratios to match the platform: `1:1`, `16:9`, `9:16`, `3:4`, `4:3`,
`2:3`, `3:2`. Twitter header ≈ 3:1 (use 3:2 crop), Instagram story = 9:16.
Prompt rules: be descriptive (style, lighting, mood, palette), include art
direction ("minimalist flat design", "cyberpunk neon", "editorial
photography"), and always state "no text, no letters, no words" — text is
overlaid in the HTML step so it stays crisp and editable.

Then overlay text, CTA, and logo on the generated visual in the HTML/CSS
composition.

### 4. Export to exact-size PNG

Serve the HTML (e.g., `python -m http.server`) and capture each banner at
its exact pixel dimensions.

**Playwright (preferred — no separate browser installs needed):**

```javascript
// export-banner.mjs
import { chromium } from "playwright";
const [w, h] = [1500, 500];                    // exact target
const page = await (await chromium.launch()).newPage();
await page.setViewportSize({ width: w, height: h });
await page.goto("http://localhost:8765/banner-v1-minimalist.html");
await page.waitForTimeout(5000);               // fonts/images settle
await page.screenshot({ path: "design/state/banner-v1-minimal-1500x500.png" });
await page.browser().close();
```

**Chrome headless CLI (zero dependencies):**
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  # mac
# Windows: "/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1500,500 --virtual-time-budget=5000 \
  --screenshot="design/state/banner-v1-1500x500.png" \
  "http://localhost:8765/banner-v1-minimal.html"
```

Key flags: `--virtual-time-budget=5000` waits 5s virtual time for assets;
`--hide-scrollbars` prevents scrollbar artifacts; `--window-size=WxH` sets
the exact pixel dimensions. With Chrome MCP: open the file, set viewport to
target dimensions, wait 3–5s, screenshot full page.

If the export exceeds ~5MB, compress (e.g., resize/compress via PIL or
ImageMagick) before it ships.

### 5. Present and iterate

Show all exported options side by side. For each: art-direction style name,
PNG preview, key rationale, file path + dimensions. Iterate on feedback;
regenerate the weaker variants with a deliberately different direction
(taste gate anti-convergence) until the user approves.

## Size quick reference (fold `references/banner-sizes-and-styles.md`)

**Social media:**

| Platform | Type | Size (px) | Aspect |
|---|---|---|---|
| Facebook | Cover (desktop) | 820 × 312 | ~2.6:1 |
| Facebook | Cover (mobile) | 640 × 360 | ~16:9 |
| Facebook | Event cover | 1920 × 1080 | 16:9 |
| Twitter/X | Header | 1500 × 500 | 3:1 |
| Twitter/X | Ad banner | 800 × 418 | ~2:1 |
| LinkedIn | Company cover | 1128 × 191 | ~6:1 |
| LinkedIn | Personal banner | 1584 × 396 | 4:1 |
| YouTube | Channel art | 2560 × 1440 | 16:9 |
| YouTube | Safe area | 1546 × 423 | ~3.7:1 |
| Instagram | Story | 1080 × 1920 | 9:16 |
| Instagram | Post | 1080 × 1080 | 1:1 |
| Pinterest | Pin | 1000 × 1500 | 2:3 |

**Web / display ads (Google Display Network):**

| Name | Size (px) | Notes |
|---|---|---|
| Medium Rectangle | 300 × 250 | highest CTR |
| Leaderboard | 728 × 90 | top of page |
| Wide Skyscraper | 160 × 600 | sidebar |
| Half Page | 300 × 600 | premium |
| Large Rectangle | 336 × 280 | high performer |
| Mobile Banner | 320 × 50 | mobile default |
| Large Mobile | 320 × 100 | mobile hero |
| Billboard | 970 × 250 | desktop hero |

**Website:** full-width hero 1920 × 600–1080; section banner 1200 × 400;
blog header 1200 × 628; email header 600 × 200.

**Print:** roll-up 850 × 2000 mm; step-and-repeat 8 ft × 8 ft; vinyl outdoor
6 ft × 3 ft; trade show 33 × 78 in.

## 22 art-direction styles

Minimalist · Bold Typography · Gradient/Color Wash · Photo-Based ·
Illustrated/Hand-Drawn · Geometric/Abstract · Retro/Vintage · Glassmorphism
· 3D/Sculptural · Neon/Cyberpunk · Duotone · Editorial/Magazine ·
Collage/Mixed Media · Retro Futurism · Expressive/Anti-Design ·
Digi-Cute/Kawaii · Tactile/Sensory · Data/Infographic · Dark Mode/Moody ·
Flat/Solid Color · Nature/Organic · Motion-Ready/Kinetic.

Top picks by brief: Minimalist → SaaS, tech; Bold Typography →
announcements; Gradient → modern brands; Photo-Based → lifestyle, e-com;
Geometric → tech, fintech; Glassmorphism → SaaS, apps; Neon/Cyberpunk →
gaming, events.

## Design rules

- **Visual hierarchy (3-zone rule)**: top = logo / value prop; middle =
  supporting message + visuals; bottom = CTA.
- **Safe zones**: critical content in the central 70–80% of the canvas;
  no text/CTA within 50–100px of edges. YouTube safe area 1546 × 423 inside
  2560 × 1440.
- **CTA**: one per banner, high contrast, bottom-right, min 44px height,
  action verbs ("Get", "Start", "Download", "Claim").
- **Typography**: max 2 typefaces, min 16px body, ≥32px headline, min
  4.5:1 contrast, max 7 words/line.
- **Text ratio**: under 20% text for ads (Meta penalizes heavy text);
  social covers 60/40 image-to-text; print 70pt+ headlines for 3–5 m viewing.
- **Print**: 300 DPI (150 DPI large format), 3–5 mm bleed, CMYK, 1pt per
  foot viewing distance.

## Verify

1. **Exact size** — export matches the target px (visual check of the PNG).
2. **Safe zones** — critical content inside 70–80%, no clipped text/CTA.
3. **CTA** — one, ≥44px, high contrast, correct placement.
4. **Typography** — max 2 fonts, contrast ≥4.5:1, headline ≥32px.
5. **Text ratio** — under 20% for paid ads.
6. **Taste gate** — not a template look; variants not convergent.
7. **Settle** — delete losing compositions, rename the survivor
   `design/<screen>/<screen>.html` (+ exports).

## References

| Topic | File |
|---|---|
| Banner sizes & art-direction styles (full) | `references/banner-sizes-and-styles.md` |
| Brand context injection (token scripts) | `references/brand/…` + `scripts/tokens/inject-brand-context.cjs` |
| Taste gate | `references/taste-gate.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/tokens/inject-brand-context.cjs` | inject brand colors/type/voice into the HTML composition |
| `scripts/tokens/extract-colors.cjs` | verify exported banner colors against the brand palette |
| Inline Gemini recipe (this section) | generate background/hero visuals (flash/pro) |

## Inputs

`[platform] [style] [dimensions]` — e.g., "Facebook cover, minimalist",
"Google display banner for a SaaS launch", "website hero 1920×800".
