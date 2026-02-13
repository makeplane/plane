# Technical Guide Overview

Technical considerations and best practices for AI multimodal integration in frontend design.

## Quick Reference

### File Optimization
```bash
python scripts/media_optimizer.py \
  --input docs/assets/hero-image.png \
  --output docs/assets/hero-optimized.webp \
  --quality 85
```

### Format Selection
- **WebP**: Best for web, 25-35% smaller than PNG, wide browser support
- **AVIF**: Cutting edge, 50% smaller than WebP, limited support
- **PNG**: Lossless, large file size, use for transparency
- **JPEG**: Lossy, smaller than PNG, photos without transparency

### Responsive Variants
```bash
# Desktop hero (16:9)
--aspect-ratio 16:9

# Mobile hero (9:16 or 3:4)
--aspect-ratio 9:16

# Square cards (1:1)
--aspect-ratio 1:1
```

## Detailed References

- `technical-accessibility.md` - WCAG compliance, contrast checks, alt text
- `technical-workflows.md` - Complete pipeline examples
- `technical-best-practices.md` - Checklists, quality gates
- `technical-optimization.md` - Cost strategies, model selection

## Quick Commands

```bash
# Generate (standard quality)
python scripts/gemini_batch_process.py --task generate \
  --prompt "[design-driven prompt]" \
  --output docs/assets/[name] \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# Analyze
python scripts/gemini_batch_process.py --files docs/assets/[image].png \
  --task analyze \
  --prompt "[evaluation criteria]" \
  --output docs/assets/analysis.md \
  --model gemini-2.5-flash

# Optimize
python scripts/media_optimizer.py \
  --input docs/assets/[image].png \
  --output docs/assets/[image].webp \
  --quality 85

# Extract colors
python scripts/gemini_batch_process.py --files docs/assets/[image].png \
  --task analyze \
  --prompt "Extract 5-8 dominant colors with hex codes. Classify as primary/accent/neutral." \
  --output docs/assets/color-palette.md \
  --model gemini-2.5-flash
```

## Responsive Image Strategies

**Art Direction (different crops)**:
```html
<picture>
  <source media="(min-width: 768px)" srcset="hero-desktop.webp">
  <source media="(max-width: 767px)" srcset="hero-mobile.webp">
  <img src="hero-desktop.jpg" alt="Hero image">
</picture>
```

**Resolution Switching (same crop, different sizes)**:
```html
<img
  srcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="hero-800w.jpg"
  alt="Hero image"
/>
```
