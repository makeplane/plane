# Visual Analysis Overview

Use AI multimodal vision to analyze generated assets and verify design standards.

## Purpose

- Verify generated assets align with aesthetic direction
- Ensure professional quality before integration
- Identify specific improvements needed for iteration
- Make objective design decisions based on analysis
- Extract actionable data (hex codes, composition insights)

## Quick Start

### Comprehensive Analysis
```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/generated-hero.png \
  --task analyze \
  --prompt "[see analysis-prompts.md for detailed prompt]" \
  --output docs/assets/analysis-report.md \
  --model gemini-2.5-flash
```

### Compare Multiple Variations
```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/option-1.png docs/assets/option-2.png docs/assets/option-3.png \
  --task analyze \
  --prompt "[see analysis-prompts.md for comparison prompt]" \
  --output docs/assets/comparison-analysis.md \
  --model gemini-2.5-flash
```

### Extract Color Palette
```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/final-asset.png \
  --task analyze \
  --prompt "Extract 5-8 dominant colors with hex codes. Classify as primary/accent/neutral. Suggest CSS variable names." \
  --output docs/assets/color-palette.md \
  --model gemini-2.5-flash
```

## Decision Framework

### Score ≥ 8/10: Proceed to Integration
**Actions**:
- Optimize for web delivery
- Create responsive variants
- Document implementation guidelines
- Extract color palette for CSS variables

### Score 6-7/10: Minor Refinements Needed
**Actions**:
- Use `media-processing` skill for adjustments (brightness/contrast/saturation)
- Consider selective regeneration of problem areas
- May proceed with caution if time-constrained

### Score < 6/10: Major Iteration Required
**Actions**:
- Analyze specific failure points from report
- Refine generation prompt substantially
- Regenerate with corrected parameters
- Consider alternative aesthetic approach

## Detailed References

- `analysis-prompts.md` - All analysis prompt templates
- `analysis-techniques.md` - Advanced analysis strategies
- `analysis-best-practices.md` - Quality guidelines and pitfalls

## Example Color Extraction Output

```css
/* Extracted Color Palette */
:root {
  /* Primary Colors */
  --color-primary-600: #2C5F7D;  /* Dark teal - headers, CTAs */
  --color-primary-400: #4A90B8;  /* Medium teal - links, accents */

  /* Accent Colors */
  --color-accent-500: #E8B44F;   /* Warm gold - highlights */

  /* Neutral Colors */
  --color-neutral-900: #1A1A1A;  /* Near black - body text */
  --color-neutral-100: #F5F5F5;  /* Light gray - backgrounds */

  /* Semantic Usage */
  --color-text-primary: var(--color-neutral-900);
  --color-text-on-primary: #FFFFFF;
  --color-background: var(--color-neutral-100);
  --color-cta: var(--color-primary-600);
}
```
