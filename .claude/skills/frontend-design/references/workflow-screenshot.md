# Screenshot Replication Workflow

Replicate a design exactly from a provided screenshot.

## Prerequisites
- Activate `ui-ux-pro-max` skill first for design intelligence
- Have `ai-multimodal` skill ready for visual analysis

## Workflow Steps

### 1. Analyze Screenshot Details
Use `ai-multimodal` skill to extract:
- Design style and visual trends
- Font names (predict Google Fonts), sizes, weights
- Color palette with exact hex codes
- Border radius, spacing patterns
- Element positions, sizes, shapes
- Textures, materials, lighting
- Shadows, reflections, blur, glow effects
- Background transparency, transitions
- Image treatments and effects

**Font Prediction**: Avoid defaulting to Inter/Poppins. Match actual fonts visible.

### 2. Create Implementation Plan
Use `ui-ux-designer` subagent:
- Create plan directory (use `## Naming` pattern from hooks)
- Write `plan.md` (<80 lines, generic overview)
- Add `phase-XX-name.md` files with:
  - Context links, Overview, Key Insights
  - Requirements, Architecture, Related files
  - Implementation Steps, Todo list
  - Success Criteria, Risk Assessment

### 3. Implement
- Follow plan step by step
- Default to HTML/CSS/JS if no framework specified
- Match screenshot precisely

### 4. Generate Assets
Use `ai-multimodal` skill:
- Generate images, icons, backgrounds
- Verify generated assets match design
- Remove backgrounds if needed with `media-processing`

### 5. Verify & Report
- Compare implementation to screenshot
- Report changes summary to user
- Request approval

### 6. Document
If approved, update `./docs/design-guidelines.md`

## Quality Standards
- Match screenshot at pixel level where possible
- Preserve all visual hierarchy
- Maintain exact spacing and proportions
- Replicate animations if visible in source

## Related
- `design-extraction-overview.md` - Extract design guidelines
- `extraction-prompts.md` - Detailed analysis prompts
- `visual-analysis-overview.md` - Verify quality
