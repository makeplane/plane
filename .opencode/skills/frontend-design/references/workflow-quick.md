# Quick Design Workflow

Rapid design creation with minimal planning overhead.

## Prerequisites
- Activate `ui-ux-pro-max` skill first

## Initial Research
Run `ui-ux-pro-max` searches:
```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<style-keywords>" --domain style
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<mood>" --domain typography
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<industry>" --domain color
```

## Workflow Steps

### 1. Start Design Process
Use `ui-ux-designer` subagent directly:
- Skip extensive planning
- Move to implementation quickly
- Make design decisions on-the-fly

### 2. Implement
- Default to HTML/CSS/JS if unspecified
- Focus on core functionality
- Maintain quality despite speed

### 3. Generate Assets
Use `ai-multimodal` skill:
- Generate required visuals
- Verify quality quickly
- Use `media-processing` for adjustments

### 4. Report & Approve
- Summarize changes briefly
- Request user approval
- Update `./docs/design-guidelines.md` if approved

## When to Use
- Simple components
- Prototypes and MVPs
- Time-constrained projects
- Iterative exploration
- Single-page designs

## Quality Shortcuts
While moving fast, maintain:
- Semantic HTML
- CSS variables for consistency
- Basic accessibility
- Clean code structure

## Related
- `workflow-immersive.md` - For comprehensive designs
- `technical-overview.md` - Quick reference
