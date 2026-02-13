---
name: ai-artist
description: "Generate images via Nano Banana with 129 curated prompts. Mandatory validation interview refines style/mood/colors (use --skip to bypass). 3 modes: search, creative, wild. Styles: Ukiyo-e, Bento grid, cyberpunk, cinematic, vintage patent."
version: 3.1.0
license: MIT
---

# AI Artist - Nano Banana Image Generation

Generate images using 129 curated prompts from awesome-nano-banana-pro-prompts collection.

**Validation interview is mandatory** (use `--skip` to bypass).

## Workflow

**IMPORTANT:** Follow `references/validation-workflow.md` when this skill is activated.

## Quick Start

```bash
python3 scripts/generate.py "<concept>" -o <output.png> [--mode MODE]
```

### Generation Modes

| Mode | Description |
|------|-------------|
| `search` | Find best matching prompt from 129 curated prompts (default) |
| `creative` | Remix elements from top 3 matching prompts |
| `wild` | Out-of-the-box creative interpretation (random style transform) |
| `all` | Generate all 3 variations |

### Examples

```bash
# Default search mode
python3 scripts/generate.py "tech conference banner" -o banner.png -ar 16:9

# Creative remix (combines multiple prompts)
python3 scripts/generate.py "AI workshop" -o workshop.png --mode creative

# Wild/experimental (random artistic transformation)
python3 scripts/generate.py "product showcase" -o product.png --mode wild

# Generate all 3 variations at once
python3 scripts/generate.py "futuristic city" -o city.png --mode all -v
```

### Options

| Flag | Description |
|------|-------------|
| `-o, --output` | Output path (required) |
| `-m, --mode` | search, creative, wild, or all |
| `-ar, --aspect-ratio` | 1:1, 16:9, 9:16, etc. |
| `--model` | flash (fast) or pro (quality/4K) |
| `-v, --verbose` | Show matched prompts and details |
| `--dry-run` | Show prompt without generating |
| `--skip` | Bypass validation interview |

---

## Prompt Database

**129 curated prompts** extracted from awesome-nano-banana-pro-prompts:

```bash
# Search prompts
python3 scripts/search.py "<query>" --domain awesome

# View all prompts
cat data/awesome-prompts.csv
```

### Categories include:
- **Profile/Avatar**: Thought-leader headshots, mirror selfies
- **Infographics**: Bento grid, chalkboard, ingredient labels
- **Social Media**: Quote cards, banners, thumbnails
- **Product**: Commercial shots, e-commerce, Apple-style
- **Artistic**: Ukiyo-e, patent documents, vaporwave, cyberpunk
- **Character**: Anime, chibi, comic storyboards

---

## Wild Mode Transformations

The `wild` mode randomly applies one of these artistic transformations:

- Japanese Ukiyo-e woodblock print
- Premium liquid glass Bento grid infographic
- Vintage 1800s patent document
- Surreal dreamscape with volumetric god rays
- Cyberpunk neon aesthetic with holograms
- Hand-drawn chalkboard explanation
- Isometric 3D diorama
- Cinematic movie poster
- Vaporwave aesthetic with glitch effects
- Apple-style product showcase

---

## References

| Topic | File |
|-------|------|
| **Validation Workflow** | `references/validation-workflow.md` |
| All Prompts | `data/awesome-prompts.csv` |
| Nano Banana Guide | `references/nano-banana.md` |
| Image Prompting | `references/image-prompting.md` |
| Source | `references/awesome-nano-banana-pro-prompts.md` |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `generate.py` | Main image generation with 3 modes |
| `search.py` | Search prompts database |
| `extract_prompts.py` | Extract prompts from markdown |
| `core.py` | BM25 search engine |
