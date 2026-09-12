# /design — cip mode

Corporate Identity Program design: 50+ deliverables, 20 styles, 20
industries, with Gemini-generated mockups (Flash/Pro) and a single-file
HTML presentation. Merged from the original umbrella's built-in CIP section
plus `references/cip-*.md` and `scripts/cip/` (search / generate /
render-html / core).

## When you use (entry triggers)

- "Create a corporate identity program", "full brand package"
- "Business card mockups", "letterhead + signage mockups", "branded
  stationery/vehicle/apparel"
- "CIP presentation for investors" — the render step produces a deck.
- CIP is the pipeline partner of logo: generate the logo first, then pass
  `--logo` so mockups use the actual brand mark.

## Where on the spine

CIP runs the **full spine** (variants matter — mockup directions).

- **Consult** — read `design/DESIGN.md` + `brand-guidelines.md`
  and adopt them (colors, voice, typography). Produce a **CIP brief** from
  the knowledge base (industry → style → deliverables).
- **Explore** — generate the same deliverable in 2–3 art directions
  (`v1`, `v2`, …), compare, iterate, pick one. Also explore which
  deliverables make the set (business card vs. full stationery vs.
  signage/apparel/vehicle).
- **Build** — run the chosen direction across the deliverable set, render
  the HTML presentation, settle.
- **Verify** — the deliverable rubric (below) before settling.

## Output layout (D17 + D19)

```
design/<screen>/
├── v1/  v2/ …            ← variant dirs while exploring (each holds a set)
│   └── <brand>-<deliverable>-<ts>.png
└── <screen>/
    ├── <brand>-<deliverable>-<ts>.png    ← settled mockups
    └── <brand>-cip-presentation.html     ← settled presentation
```

Never `<harness-config-dir>/designs/`, never a random cwd dump. Point `--output` /
`--images` under `design/`.

## Prerequisites

- `GEMINI_API_KEY` set; `python -m pip install google-genai pillow`.
- `python` (Windows) / `python3` (macOS/Linux). Fix failing scripts
  directly.
- If no logo exists, run **logo mode** first and reuse its PNG.

## Mechanics

### 1. Generate the CIP brief (start here)

```bash
python scripts/cip/search.py "tech startup" --cip-brief -b "BrandName"
```

Search the four domains (auto-detected without `--domain`):

```bash
python scripts/cip/search.py "business card letterhead" --domain deliverable
python scripts/cip/search.py "luxury premium elegant" --domain style
python scripts/cip/search.py "hospitality hotel" --domain industry
python scripts/cip/search.py "office reception" --domain mockup
python scripts/cip/search.py "corporate professional" --all
```

`--domain` choices: `deliverable`, `style`, `industry`, `mockup`. `--json`
for structured output.

### 2. Choose direction from the knowledge base

**Deliverable categories** (fold from `cip-deliverable-guide.md` and
`data/cip/deliverables.csv`):

| Category | Items |
|---|---|
| Core identity | Logo, logo variations |
| Stationery | Business card, letterhead, envelope, folder, notebook, pen |
| Security / access | ID badge, lanyard, access card |
| Office environment | Reception signage, wayfinding, meeting-room signs, wall graphics |
| Apparel | Polo shirt, T-shirt, cap, jacket, apron |
| Promotional | Tote bag, gift box, USB, water bottle, mug, umbrella |
| Vehicle | Car sedan, van, truck |
| Digital | Social media, email signature, PowerPoint, document templates |
| Product | Packaging box, labels, tags, retail display |
| Events | Trade-show booth, banner stand, table cover, backdrop |

**Design styles** (from `data/cip/styles.csv` + `cip-style-guide.md`):

| Style | Colors | Typography | Materials / finishes | Best for |
|---|---|---|---|---|
| Corporate Minimal | Navy `#0F172A`, White, Blue | clean sans (Inter) | matte paper, spot UV | Finance, Legal, Consulting |
| Modern Tech | Purple `#6366F1`, Cyan `#0EA5E9`, Green | geometric sans (Outfit, Poppins) | smooth, gradient, gloss | Tech, SaaS, AI |
| Luxury Premium | Black `#1C1917`, Gold `#D4AF37`, White | elegant serif (Playfair) | heavy cotton, foil, emboss | Fashion, Jewelry, Hotels |
| Classic Traditional | Navy, Burgundy, Gold | serif (Times, Garamond) | laid paper, letterpress | Law, Heritage, Finance |
| Warm Organic | Brown `#8B4513`, Green `#228B22`, Cream | friendly serif, organic script | kraft, recycled, uncoated | Food, Organic, Wellness |
| Bold Dynamic | Red `#DC2626`, Orange `#F97316`, Black | bold condensed sans | high-contrast, gloss | Sports, Entertainment, Gaming |
| Fresh Modern | Mint `#10B981`, Sky `#0EA5E9`, White | modern rounded sans | light clean, matte | Healthcare, Wellness, Fintech |
| Soft Elegant | Pink `#F472B6`, Gold, White | elegant script, thin sans | soft-touch, rose-gold foil | Beauty, Wedding, Spa |

**Mockup contexts** (`data/cip/mockup-contexts.csv`): office reception,
marble desk, urban street, studio, lifestyle, etc. — each with lighting,
environment, camera angle, and prompt modifiers.

### 3. Generate mockups

**With the brand logo (recommended)** — image-editing mode embeds the
actual logo:

```bash
python scripts/cip/generate.py --brand "TopGroup" --logo design/logo/logo.png \
  --deliverable "business card" --industry "consulting"

# Full CIP set (defaults: business card, letterhead, office signage, vehicle, polo shirt)
python scripts/cip/generate.py --brand "TopGroup" --logo design/logo/logo.png \
  --industry "consulting" --set --output design/cip

# Pro model (4K text rendering)
python scripts/cip/generate.py --brand "TopGroup" --logo design/logo/logo.png \
  --deliverable "business card" --model pro

# Custom deliverables + wide aspect
python scripts/cip/generate.py --brand "GreenLeaf" --logo logo.png \
  --industry "organic food" --deliverables "letterhead,packaging,vehicle" --ratio 16:9
```

**Without a logo** — the AI interprets the brand; pass `--no-logo-prompt`
to skip the interactive prompt:

```bash
python scripts/cip/generate.py --brand "TechFlow" --deliverable "business card" --no-logo-prompt
```

**Inspect prompts first:** `--prompt-only` prints the assembled prompt
without calling the API; `--json` outputs structured results.

| Flag | Meaning | Default |
|---|---|---|
| `--brand` | brand name (required) | — |
| `--logo` | logo image path → image-editing mode | — |
| `--deliverable` | single deliverable | business card |
| `--deliverables` | comma-separated list | — |
| `--industry` | industry for style guidance | technology |
| `--style` / `--mockup` | style / context overrides | from brief |
| `--set` | full CIP set | — |
| `--output` | output directory | cwd |
| `--model` | `flash` (default) or `pro` | flash |
| `--ratio` | aspect ratio | 1:1 |

Models: flash `gemini-2.5-flash-image` (fast, cost-effective); pro
`gemini-3-pro-image-preview` (quality, 4K text).

### 4. Render the HTML presentation

```bash
python scripts/cip/render-html.py --brand "TopGroup" --industry "consulting" \
  --images design/cip --output design/cip/cip-presentation.html
```

The renderer: pulls the CIP brief for brand info (industry, style, mood),
embeds each mockup as base64 (single-file portable, no external assets),
writes a dark themed deck with hero + per-deliverable cards (concept,
purpose, specs) + color swatches, responsive desktop/mobile.

### 5. Prompt craft (when steering manually)

From `cip-prompt-engineering.md` — base structure:

```
Professional corporate identity mockup photograph showing [DELIVERABLE] for
brand '[BRAND]', [STYLE] design style, using colors [COLORS], [TYPOGRAPHY]
typography, logo placement: [PLACEMENT], [MATERIALS] with [FINISHES]
finish, [CONTEXT] setting, [MOOD] mood, photorealistic product photography,
soft natural lighting, high quality professional shot, 8k resolution.
```

Deliverable modifiers: business card → `on marble surface, stack of cards,
premium paper texture, 45 degree angle`; letterhead → `flat lay with
envelope and pen, velvet fabric background`; signage → `3D logo signage on
office wall, backlit LED, brushed metal`; vehicle → `3/4 front angle,
professional wrap`; apparel → `folded polo, embroidered logo on chest`.

Style modifiers — corporate minimal: `clean minimal aesthetic, white space,
matte finish`; luxury: `dark background, dramatic rim lighting, gold
accents`; modern tech: `gradient colors, geometric elements, futuristic`;
warm: `natural materials, kraft paper texture, warm lighting`.

Lighting: studio / natural / dramatic rim / warm golden hour. Context:
marble desk, wooden table, office interior, flat lay, lifestyle.

Quality: always `photorealistic, professional photography, 8k resolution,
sharp focus`. Negative: `blurry, low quality, distorted text, misspelled,
amateur, clipart, cartoon, illustration, watermark`.

## Verify

1. **Deliverable rubric** — every deliverable: correct dimensions
   (business card 3.5×2in / 85×55mm, letterhead A4, envelope DL/C4/C5,
   polo embroidery left chest), correct logo variant + clear space, brand
   palette only, readable at intended size, WCAG AA contrast on text.
2. **Visual check** — mockups rendered clean (no distorted text, no
   watermark, photoreal, no blur); the HTML deck renders without broken
   images (base64 embeds).
3. **Taste gate** — not a clipart look; background visuals consistent with
   brand style.
4. **Settle** — delete losing directions; keep the survivor's mockups
   + the presentation under `design/<screen>/`.

## References

| Topic | File |
|---|---|
| CIP design guide (scripts, models, workflow) | `references/cip-design.md` |
| CIP deliverable guide | `references/cip-deliverable-guide.md` |
| CIP style guide | `references/cip-style-guide.md` |
| CIP mockup prompt engineering | `references/cip-prompt-engineering.md` |
| Taste gate | `references/taste-gate.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/cip/search.py` | search deliverables/styles/industries/mockups; `--cip-brief` |
| `scripts/cip/generate.py` | Gemini mockup generation (text-only or with logo) |
| `scripts/cip/render-html.py` | single-file HTML presentation from mockup PNGs |
| `scripts/cip/core.py` | BM25 engine over `data/cip/*.csv` |

Data tables: `data/cip/deliverables.csv` (50+), `styles.csv` (20),
`industries.csv` (20), `mockup-contexts.csv`.

## Inputs

`[industry] [style] [deliverables] [brand]` — e.g., "CIP for a boutique
hotel brand", "business card + letterhead mockups", "full corporate
identity program with presentation". Optional: `--logo`, `--model pro`.
