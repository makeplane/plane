# /design — logo mode

Logo design and AI generation from a 55-style / 55-palette / 55-industry
knowledge base, with Gemini image models for generation. Merged from the
original umbrella's Logo section plus `references/logo-*.md` and
the `scripts/logo/` (search / generate / core) scripts.

## When you use (entry triggers)

- "Design a logo", "generate a logo", "logo for my startup"
- "What logo style fits my industry?", "logo colors for a tech company"
- Requesting a logo to feed the CIP mode (`cip` takes `--logo`), banners,
  or social photos — always run logo first and pass the settled PNG.

## Where on the spine

Logo runs the **full spine** — it is the canonical Explore mode (variants
matter).

- **Consult** — read `design/DESIGN.md` + `brand-guidelines.md`
  and adopt them (brand colors, voice, typography). If neither exists and
  the request touches identity, write DESIGN.md first. Then produce a
  **design brief** from the knowledge base.
- **Explore** — generate 2–4 variants (`v1`, `v2`, …) with
  `scripts/logo/generate.py`, each a different style/color/layout
  direction (anti-convergence — see taste gate), compare on the board,
  iterate, pick one.
- **Build** — re-run the chosen direction, name it
  `design/<screen>/v1.png`, verify, settle (drop the version
  suffix).
- **Verify** — the mode's quality gate (below) before settling.

## Output layout (D17 + D19)

```
design/<screen>/
├── v1.png  v2.png  …   ← variants while exploring
└── <screen>.png        ← settled logo (version suffix dropped)
```

Never `.claude/designs/`, never a random cwd dump. Batch output-dir args
must point under `design/`.

## Prerequisites

- `GEMINI_API_KEY` set; `python -m pip install google-genai pillow`.
- Use `python` (Windows) / `python3` (macOS/Linux). If a script fails,
  fix it directly rather than working around it.
- **Always generate output logos on a white background.**

## Mechanics

### 1. Generate the design brief (start here)

Search the knowledge base and assemble industry + style + color
recommendations into a brief:

```bash
python scripts/logo/search.py "tech startup modern" --design-brief -p "BrandName"
```

Search the three domains (auto-detected when `--domain` is omitted):

```bash
python scripts/logo/search.py "minimalist clean" --domain style
python scripts/logo/search.py "tech professional" --domain color
python scripts/logo/search.py "healthcare medical" --domain industry
```

`--domain` choices: `style`, `color`, `industry`. `--json` for structured
output, `--max-results N` (default 3).

### 2. Choose direction from the knowledge base

**Logo types** (from `references/logo-style-guide.md`):

| Type | Best for | Tip |
|---|---|---|
| Wordmark | Established brands, distinctive names | Name must be memorable/pronounceable |
| Lettermark | Long company names, firms | 2–4 letter abbreviations |
| Pictorial Mark | Global brands with recognition | Needs brand equity alone |
| Abstract Mark | Tech, differentiating brands | Represents complex ideas simply |
| Mascot | Family, sports, food | Evolves while keeping recognition |
| Emblem | Traditional, organizations | Watch small-size scalability |
| Combination Mark | New brands, versatile | Most flexible; elements separable |

**Style selection matrix:**

| Brand type | Primary | Secondary |
|---|---|---|
| Tech startup | Minimalist, Abstract | Geometric, Gradient |
| Law firm | Wordmark, Emblem | Lettermark |
| Restaurant | Mascot, Badge | Vintage, Combination |
| Fashion | Wordmark, Luxury | Monogram, Line Art |
| Healthcare | Professional, Line Art | Abstract, Combination |
| Non-profit | Combination, Emblem | Organic, Hand-Drawn |

**Color psychology** (from `logo-color-psychology.md`):

| Color | Psychology | Industries | Hex examples |
|---|---|---|---|
| Blue | Trust, stability | Finance, healthcare, tech | Navy `#003366`, Sky `#0EA5E9` |
| Red | Energy, passion | Food, sports, sales | Crimson `#DC2626` (avoid healthcare) |
| Green | Growth, nature | Eco, wellness, finance | Forest `#228B22`, Mint `#10B981` |
| Gold | Luxury, attention | Luxury, food, energy | Gold `#D4AF37`, Amber `#F59E0B` |
| Purple | Creativity, premium | Beauty, creative, tech | Royal `#7C3AED` |
| Orange | Friendly, energetic | Food, sports, retail | Tangerine `#F97316` |
| Black | Sophistication, authority | Luxury, fashion | Pair white/gold/silver |

Industry color guidance — tech: blue/purple + teal accent, avoid brown;
healthcare: blue/green, avoid red; finance: navy/gold, avoid brights; food:
red/orange, avoid blue; fashion: black/white/gold; eco: green/brown, avoid
neon. Quick palettes: Tech `#6366F1/#8B5CF6/#06B6D4`; Eco
`#228B22/#2E8B57/#DEB887`; Luxury `#1C1917/#D4AF37/#FFFFFF`; Healthcare
`#0077B6/#00A896/#FFFFFF`.

**Industry defaults:**

| Industry | Style | Colors | Typography |
|---|---|---|---|
| Tech | Minimalist, Abstract | blues, purples, gradients | geometric sans |
| Healthcare | Professional, Line Art | blues, greens, teals | clean sans |
| Finance | Corporate, Emblem | navy, gold | serif or clean sans |
| Food | Vintage Badge, Mascot | warm reds, oranges | friendly script |
| Fashion | Wordmark, Luxury | black, gold, white | elegant serif |

### 3. Generate variants (Explore)

Single logo:

```bash
python scripts/logo/generate.py --brand "TechFlow" --style minimalist --industry tech
python scripts/logo/generate.py --prompt "coffee shop vintage badge" --style vintage
python scripts/logo/generate.py --brand "TechFlow" --style "geometric" --industry tech --pro
```

Batch (2–9 variants, one per style; note the batch generator hardcodes a
tech-oriented industry prompt — override with `--prompt` for non-tech
directions):

```bash
python scripts/logo/generate.py --brand "Unikorn" --batch 9 --output-dir design/unikorn-logos --pro
```

Useful flags:

| Flag | Meaning | Default |
|---|---|---|
| `--prompt` / `--brand` | description / brand name (one required) | — |
| `--style` | 18 style modifiers (below) | — |
| `--industry` | 10 industry prompts (below) | — |
| `--output` / `--output-dir` | single file / batch dir | timestamped file / `./<brand>_logos` |
| `--pro` | Pro model `gemini-3-pro-image-preview` | Flash `gemini-2.5-flash-image` |
| `--aspect-ratio` | `1:1` (default), `16:9`, `9:16`, `4:3`, `3:4` | `1:1` |
| `--batch` | number of variants | — |
| `--list-styles` / `--list-industries` | print the tables | — |

**Style modifiers** (the script's 18): minimalist, vintage, modern, luxury,
playful, corporate, organic, geometric, hand-drawn, 3d, abstract,
lettermark, wordmark, emblem, mascot, gradient, lineart, negative-space.

**Industry prompts** (10): tech, healthcare, finance, food, fashion,
fitness, eco, education, real-estate, creative.

### 4. Prompt craft (when using `--prompt` directly)

From `references/logo-prompt-engineering.md` — structure:
`Professional [industry] logo, [style] design, [color] colors, clean modern
aesthetic, scalable vector style`.

Keyword kits by style — minimalist: `clean lines, simple geometric shapes,
high white space, flat design, single color, negative space, refined`;
vintage: `badge style, distressed texture, hand-lettered, sepia tones,
muted colors`; luxury: `gold accents, metallic, thin lines, serif
typography, prestige`; modern/tech: `gradient colors, geometric, abstract,
circuit-like`; playful: `rounded shapes, bright colors, cartoon-like,
bouncy`; organic: `earth tones, leaf elements, hand-drawn, biophilic`.

Always append negative prompts: `NOT photorealistic, 3D render, photograph,
stock image, clip art, multiple logos, busy background, text watermarks,
blurry, distorted, complex detailed patterns`.

Technical requirements to include: `vector-style, scalable at any size,
works as favicon, works on light and dark backgrounds, single color version
possible, horizontal and stacked layouts, brand mark can stand alone`.

Pitfalls: too much detail (AI adds complexity — request "simple"), unclear
background (specify "plain white background"), text in the mark (generate
mark and wordmark separately), wrong aspect ("1:1 square"), realistic
rendering (add "illustration, vector-style, not photorealistic").

### 5. Assemble the logo package

After settling, produce the variants the brand guidelines require
(`logo-usage-rules.md`): full horizontal, stacked, icon-only, wordmark; +
color variants (full, reversed, mono-dark, mono-light) as SVG (web) / PNG
(fallback) / PDF-EPS (print). Store under `design/<screen>/logos/`
or the project's `assets/logos/` folder.

## Verify

1. **Scalability checklist** — recognizable at 16×16 (favicon), clear at
   business-card size, works in single color, black/white legible, no
   details that vanish when scaled.
2. **Color** — approved palette, ≥4.5:1 contrast, grayscale test, no
   colorblind-only pairs.
3. **Taste gate** — not a stock-photo look, no slop (see
   `references/taste-gate.md`).
4. **On white background** — required for all generated logo output.
5. **Ask about an HTML preview** — after generation, **always** ask the
   user whether they want an HTML preview/gallery of the chosen logo
   (e.g. on-brand background, dark/light, and context mockups). If yes,
   build `design/state/preview.html` with the mockup-mode preview
   pattern (local fonts, no CDN). Do not skip the question; the umbrella
   made it mandatory.
6. **Settle** — delete losing variants, rename the survivor
   `design/<screen>/<screen>.png`.

## References

| Topic | File |
|---|---|
| Logo design guide (brief, styles, workflow) | `references/logo-design.md` |
| Logo style guide | `references/logo-style-guide.md` |
| Logo color psychology | `references/logo-color-psychology.md` |
| Logo AI prompt engineering | `references/logo-prompt-engineering.md` |
| Taste gate (anti-slop, anti-convergence) | `references/taste-gate.md` |

## Scripts

| Script | Purpose |
|---|---|
| `scripts/logo/search.py` | search styles/colors/industries; `--design-brief` |
| `scripts/logo/generate.py` | Gemini logo generation (flash/pro, batch, aspect) |
| `scripts/logo/core.py` | BM25 engine over `data/logo/*.csv` |

Data tables: `data/logo/styles.csv`, `data/logo/colors.csv`,
`data/logo/industries.csv` — 55 rows each.

## Inputs

`[style] [industry] [brand] [context]` — e.g., "logo for a fintech
startup", "vintage badge logo for a coffee shop". Optional: `--pro` for
Pro quality, aspect ratio, quantity.
