# Logo Design Reference

AI-powered logo design with 55 styles, 55 color palettes, 55 industry guides. Uses Gemini image models (Flash `gemini-2.5-flash-image` / Pro `gemini-3-pro-image-preview`).

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/logo/search.py` | Search styles, colors, industries; generate design briefs |
| `scripts/logo/generate.py` | Generate logos with Gemini Nano Banana |
| `scripts/logo/core.py` | BM25 search engine for logo data |

## Commands

### Design Brief (Start Here)

```bash
python3 <this skill's own deployed folder>/scripts/logo/search.py "tech startup modern" --design-brief -p "BrandName"
```

### Search Domains

```bash
# Styles
python3 <this skill's own deployed folder>/scripts/logo/search.py "minimalist clean" --domain style

# Color palettes
python3 <this skill's own deployed folder>/scripts/logo/search.py "tech professional" --domain color

# Industry guidelines
python3 <this skill's own deployed folder>/scripts/logo/search.py "healthcare medical" --domain industry
```

### Generate Logo

**ALWAYS** use white background for output logos.

```bash
python3 <this skill's own deployed folder>/scripts/logo/generate.py --brand "TechFlow" --style minimalist --industry tech
python3 <this skill's own deployed folder>/scripts/logo/generate.py --prompt "coffee shop vintage badge" --style vintage
```

Options: `--style`, `--industry`, `--prompt`

## Available Styles

| Category | Styles |
|----------|--------|
| General | Minimalist, Wordmark, Lettermark, Pictorial Mark, Abstract Mark, Mascot, Emblem, Combination Mark |
| Aesthetic | Vintage/Retro, Art Deco, Luxury, Playful, Corporate, Organic, Neon, Grunge, Watercolor |
| Modern | Gradient, Flat Design, 3D/Isometric, Geometric, Line Art, Duotone, Motion-Ready |
| Clever | Negative Space, Monoline, Split/Fragmented, Responsive/Adaptive |

## Color Psychology

| Color | Psychology | Best For |
|-------|------------|----------|
| Blue | Trust, stability | Finance, tech, healthcare |
| Green | Growth, natural | Eco, wellness, organic |
| Red | Energy, passion | Food, sports, entertainment |
| Gold | Luxury, premium | Fashion, jewelry, hotels |
| Purple | Creative, innovative | Beauty, creative, tech |

## Industry Defaults

| Industry | Style | Colors | Typography |
|----------|-------|--------|------------|
| Tech | Minimalist, Abstract | Blues, purples, gradients | Geometric sans |
| Healthcare | Professional, Line Art | Blues, greens, teals | Clean sans |
| Finance | Corporate, Emblem | Navy, gold | Serif or clean sans |
| Food | Vintage Badge, Mascot | Warm reds, oranges | Friendly, script |
| Fashion | Wordmark, Luxury | Black, gold, white | Elegant serif |

## Workflow

1. Generate design brief → `scripts/logo/search.py --design-brief`
2. Generate logo variations → `scripts/logo/generate.py --brand --style --industry`
3. Ask the user about an HTML preview via the interactive ask tool (ask_user_question). If the ask tool is unavailable, ask the same question in plain text and wait for the answer.
4. If yes, build `design/state/preview.html` with the mockup-mode preview pattern (local fonts, no CDN)

## Detailed References

- `references/logo-style-guide.md` - Detailed style descriptions
- `references/logo-color-psychology.md` - Color meanings and combinations
- `references/logo-prompt-engineering.md` - AI generation prompts

## Setup

```bash
export GEMINI_API_KEY="your-key"
pip install google-genai
```
