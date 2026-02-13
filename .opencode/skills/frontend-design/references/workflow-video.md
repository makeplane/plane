# Video Replication Workflow

Replicate a design including animations/interactions from a provided video.

## Prerequisites
- Activate `ui-ux-pro-max` skill first
- Have `ai-multimodal` skill ready for video analysis

## Workflow Steps

### 1. Analyze Video Details
Use `ai-multimodal` skill to describe:
- Every visible element and its properties
- All interactions and user flows
- Animation timing, easing, duration
- Transitions between states/pages
- Color palette with hex codes
- Typography (predict Google Fonts)
- Borders, spacing, sizing
- Textures, materials, lighting
- Shadows, reflections, blur, glow
- Background effects

**Font Prediction**: Avoid defaulting to Inter/Poppins.

### 2. Create Implementation Plan
Use `ui-ux-designer` subagent:
- Create plan directory (use `## Naming` pattern)
- Write `plan.md` (<80 lines overview)
- Add `phase-XX-name.md` files with full sections
- Keep research reports under 150 lines

### 3. Implement
- Follow plan step by step
- Default to HTML/CSS/JS if unspecified
- Prioritize animation accuracy

### 4. Animation Implementation
Focus on:
- Timing functions matching video
- State transitions
- Micro-interactions
- Scroll-triggered effects
- Hover/focus states
- Loading animations

Use `animejs.md` reference for animation patterns.

### 5. Generate Assets
Use `ai-multimodal` skill:
- Generate static assets
- Create animated sprites if needed
- Verify quality matches video
- Use `media-processing` for processing

### 6. Verify & Report
- Compare implementation to video
- Test all interactions
- Report summary to user
- Request approval

### 7. Document
If approved, update `./docs/design-guidelines.md`

## Quality Standards
- Frame-accurate animation timing
- Smooth 60fps performance
- Responsive behavior preserved
- All interactions functional

## Related
- `animejs.md` - Animation library reference
- `design-extraction-overview.md` - Guidelines extraction
- `technical-optimization.md` - Performance tips
