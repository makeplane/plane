# Extract Design Guidelines from Existing Assets

Reverse-engineer design principles from existing images or videos to establish design guidelines.

## Purpose

- Analyze competitor designs to understand their approach
- Extract design systems from inspiration screenshots
- Learn from high-quality design examples
- Create documented guidelines based on visual analysis
- Establish consistent aesthetic direction from references

## Use Cases

- Analyzing competitor websites or apps
- Learning from inspiration galleries (Dribbble, Awwwards, Mobbin)
- Extracting design systems from brand materials
- Reverse-engineering successful interfaces
- Creating design documentation from visual references

## Quick Workflows

### Single Image Analysis
```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/reference-design.png \
  --task analyze \
  --prompt "[see extraction-prompts.md for detailed prompt]" \
  --output docs/design-guidelines/extracted-design-system.md \
  --model gemini-2.5-flash
```

### Multi-Screen System Extraction
```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/home.png docs/inspiration/about.png \
  --task analyze \
  --prompt "[see extraction-prompts.md for multi-screen prompt]" \
  --output docs/design-guidelines/complete-design-system.md \
  --model gemini-2.5-flash
```

### Video Motion Analysis
```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/interaction-demo.mp4 \
  --task analyze \
  --prompt "[see extraction-prompts.md for motion prompt]" \
  --output docs/design-guidelines/motion-system.md \
  --model gemini-2.5-flash
```

### Competitive Analysis
```bash
python scripts/gemini_batch_process.py \
  --files competitor-a.png competitor-b.png competitor-c.png \
  --task analyze \
  --prompt "[see extraction-prompts.md for competitive prompt]" \
  --output docs/design-guidelines/competitive-analysis.md \
  --model gemini-2.5-flash
```

## Detailed References

- `extraction-prompts.md` - All extraction prompt templates
- `extraction-best-practices.md` - Capture quality, analysis tips
- `extraction-output-templates.md` - Documentation formats

## Integration

After extraction, use guidelines with `asset-generation.md` for generating design-aligned visual assets.
