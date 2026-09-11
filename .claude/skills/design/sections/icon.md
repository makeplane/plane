# /design — icon mode

SVG icon-set generation with Gemini 3.1 Pro Preview — 15 styles, 12
categories, single / batch / multi-size output. The model returns **SVG as
text** (SVG is XML), so no image-generation API is needed. Merged from the
original umbrella's built-in Icon section plus `references/icon-design.md`
and `scripts/icon/generate.py`.

## When you use (entry triggers)

- "Design an icon set", "make a settings gear icon", "SVG icons for my app"
- "Generate icon variations in outlined/filled/duotone"
- Icon style decisions reuse the same knowledge base as logo (outlined vs.
  filled vs. gradient, etc.).

## Where on the spine

Icon runs **Consult → Explore → Build** like logo, but lighter: an icon set
is small and cheap, so iteration is fast.

- **Consult** — read `design/DESIGN.md` + `brand-guidelines.md`
  and adopt them (stroke weight, corner radius, palette, style). If the
  user only says "icon set", pick a coherent style family (all outlined,
  all rounded, …) — a set is one style, not a grab bag.
- **Explore** — generate 2–3 interpretations of the same icon (`--batch`)
  and/or the full set in one style; compare, pick.
- **Build** — generate the settled set (all icons, consistent style +
  stroke), export required sizes, settle.
- **Verify** — the SVG rubric (below) before settling.

## Output layout (D17 + D19)

```
design/<screen>/
├── v1/  v2/ …      ← variant dirs while exploring
└── <screen>/
    ├── <name>_<style>_01.svg …   ← settled icons (one per concept)
    └── <name>_<style>_24px.svg … ← multi-size exports
```

Never a random `./icons` cwd dump — `--output-dir` must point under
`design/`. Settled icons may additionally copy to the project's
`assets/icons/` for use in code.

## Prerequisites

- `GEMINI_API_KEY` set; `python -m pip install google-genai`.
- `python` (Windows) / `python3` (macOS/Linux).
- Model `gemini-3.1-pro-preview` (text-output; the script reads its
  response as SVG text).

## Mechanics

### 1. Generate a single icon

```bash
python scripts/icon/generate.py --prompt "settings gear" --style outlined
python scripts/icon/generate.py --prompt "shopping cart" --style filled --color "#6366F1"
python scripts/icon/generate.py --name "dashboard" --category navigation --style duotone
python scripts/icon/generate.py --prompt "user profile" --output design/icons
```

### 2. Batch variations

```bash
python scripts/icon/generate.py --prompt "cloud upload" --batch 4 --output-dir design/icons
python scripts/icon/generate.py --prompt "notification bell" --batch 6 --style outlined \
  --output-dir design/icons
```

### 3. Multi-size export

```bash
python scripts/icon/generate.py --prompt "user profile" --sizes "16,24,32,48" \
  --output-dir design/icons
```

### 4. Inspect the style/category tables

```bash
python scripts/icon/generate.py --list-styles
python scripts/icon/generate.py --list-categories
```

### CLI options

| Option | Description | Default |
|---|---|---|
| `--prompt` / `--name` | description / filename slug (one required) | — |
| `--style` | 15 styles (below) | — |
| `--category` | 12 categories for context | — |
| `--color` | primary hex color | `currentColor` |
| `--size` | display size in px | 24 |
| `--viewbox` | SVG viewBox size | 24 |
| `--output` / `--output-dir` | single file / batch dir | auto / `./icons` |
| `--batch` | number of variations | — |
| `--sizes` | comma-separated sizes, e.g. `"16,24,32,48"` | — |

### 15 styles (fold `data/icon/styles.csv`)

| Style | Stroke | Fill | Best for |
|---|---|---|---|
| outlined | 2px | none | UI interfaces, web apps |
| filled | 0 | solid | Mobile apps, nav bars |
| duotone | 0 | dual (primary + 30% secondary) | Marketing, landing pages |
| thin | 1–1.5px | none | Luxury, editorial |
| bold | 3px | none | Headers, hero sections |
| rounded | 2px | none | Friendly apps, health |
| sharp | 2px | none | Tech, fintech, enterprise |
| flat | 0 | solid | Material design, Google-style |
| gradient | 0 | gradient | Modern brands, SaaS |
| glassmorphism | 1px | semi-transparent | Modern UI, overlays |
| pixel | 0 | solid | Gaming, retro |
| hand-drawn | varies | none | Artisan, creative |
| isometric | 1–2px | partial | Tech docs, infographics |
| glyph | 0 | solid | System UI, compact |
| animated-ready | 2px | varies | Interactive UI, onboarding |

### 12 categories

navigation, action, communication, media, file, user, commerce, data,
development, social, weather, map — each with a keyword hint the script
feeds the model (e.g., `action` → edit, delete, save, download, upload,
share, search).

## Prompt craft and SVG hygiene

The script builds a strict SVG template: `viewBox "0 0 24 24"`, colors via
`currentColor` (CSS inheritance), no embedded fonts/raster/external
references, optimized paths, `<title>` accessibility element, style +
color + size instructions. Output is `currentColor` by default; pass
`--color "#RRGGBB"` to burn a specific hex into the primary elements.

Reference best practices (`references/icon-design.md`): viewBox `0 0 24 24`
(or `16`); `currentColor` for inheritance; always `<title>`; minimal nodes;
design at 24px then test 16/48; `stroke-linecap="round"` +
`stroke-linejoin="round"` for outlined styles.

## Verify

1. **SVG validity** — each file starts with `<svg`, closes properly, no
   `currentColor` leftover if a color was requested, no raster/embedded
   fonts.
2. **Accessibility** — `<title>` present, names/slugs match
   `{slug}_{style}_{n}.svg` convention.
3. **Consistency** — one style family across the set (same stroke width,
   corner radius, weight).
4. **Clarity** — recognizable at 16px and 48px; no detail collapse.
5. **Settle** — delete losing variants; keep the family + size exports
   under `design/<screen>/`.

## References

| Topic | File |
|---|---|
| Icon design guide | `references/icon-design.md` |
| Taste gate | `references/taste-gate.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/icon/generate.py` | Gemini SVG icon generation (single/batch/multi-size, `--list-*`) |

Data table: `data/icon/styles.csv` (15 styles).

## Inputs

`[prompt] [style] [category] [color] [sizes]` — e.g., "settings gear,
outlined", "a navigation icon set in duotone", "16/24/32/48px exports".
