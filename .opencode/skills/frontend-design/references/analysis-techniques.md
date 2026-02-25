# Advanced Analysis Techniques

Advanced strategies for visual analysis and testing.

## Batch Analysis for Rapid Iteration

Analyze multiple generations simultaneously:

```bash
# Generate 3 variations with fast model
for i in {1..3}; do
  python scripts/gemini_batch_process.py \
    --task generate \
    --prompt "[prompt with variation-$i twist]" \
    --output docs/assets/var-$i \
    --model imagen-4.0-fast-generate-001 \
    --aspect-ratio 16:9
done

# Batch analyze all variations
python scripts/gemini_batch_process.py \
  --files docs/assets/var-*.png \
  --task analyze \
  --prompt "Rank these variations 1-3 with scores. Identify winner." \
  --output docs/assets/batch-analysis.md \
  --model gemini-2.5-flash
```

## Contextual Testing

Test assets in actual UI context:

1. **Mock up UI overlay** (use design tool or code)
2. **Capture screenshot** of asset with real UI elements
3. **Analyze integrated version** for readability, hierarchy, contrast

```bash
# After creating mockup with UI overlay
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-mockup-with-ui.png \
  --task analyze \
  --prompt "Evaluate this hero section with actual UI:
1. Headline readability over image
2. CTA button visibility and contrast
3. Navigation bar integration
4. Overall visual hierarchy effectiveness
Provide WCAG contrast ratio estimates." \
  --output docs/assets/ui-integration-test.md \
  --model gemini-2.5-flash
```

## A/B Testing Analysis

Compare design directions objectively:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/design-a.png docs/assets/design-b.png \
  --task analyze \
  --prompt "A/B test analysis:

Design A: [minimalist approach]
Design B: [maximalist approach]

Compare for:
1. User attention capture (first 3 seconds)
2. Information hierarchy clarity
3. Emotional impact and brand perception
4. Conversion optimization potential
5. Target audience alignment ([describe audience])

Recommend which to A/B test in production and why." \
  --output docs/assets/ab-test-analysis.md \
  --model gemini-2.5-flash
```

## Iteration Strategy

When score < 6/10:

1. **Identify top 3 weaknesses** from analysis
2. **Address each in refined prompt**
3. **Regenerate with fast model** first
4. **Re-analyze before committing** to standard model
5. **Iterate until score ≥ 7/10**

Example:
```bash
# First attempt scores 5/10 - "colors too muted, composition unbalanced"

# Refine prompt addressing specific issues
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[original prompt] + vibrant saturated colors, dynamic diagonal composition" \
  --output docs/assets/hero-v2 \
  --model imagen-4.0-fast-generate-001

# Re-analyze
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-v2.png \
  --task analyze \
  --prompt "[same evaluation criteria]" \
  --output docs/assets/analysis-v2.md
```

## Documentation Strategy

Save analysis reports for design system documentation:

```
docs/
  assets/
    hero-image.png
    hero-analysis.md       # Analysis report
    hero-color-palette.md  # Extracted colors
  design-guidelines/
    asset-usage.md         # Guidelines derived from analysis
```
