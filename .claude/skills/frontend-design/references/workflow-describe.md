# Design Description Workflow

Create detailed design documentation from screenshot/video for developer implementation.

## Prerequisites
- Activate `ui-ux-pro-max` skill first
- Have `ai-multimodal` skill ready

## Workflow Steps

### 1. Comprehensive Visual Analysis
Use `ai-multimodal` skill to describe exhaustively:

**Layout & Structure**
- Element positions (absolute coords or relative)
- Container hierarchy
- Grid/flexbox patterns
- Responsive breakpoints visible

**Visual Properties**
- Design style and aesthetic trend
- Every color with hex codes
- Every border (width, style, radius)
- Every icon (describe or identify)
- Font names (predict Google Fonts), sizes, weights
- Line heights, letter spacing

**Spacing System**
- Padding values
- Margin values
- Gap between elements
- Section spacing

**Visual Effects**
- Shapes and geometry
- Textures and materials
- Lighting direction
- Shadows (offset, blur, spread, color)
- Reflections and refractions
- Blur effects (backdrop, gaussian)
- Glow effects
- Background transparency
- Image treatments

**Interactions (if video)**
- Animation sequences
- Transition types and timing
- Hover/focus states
- Scroll behaviors

**Font Prediction**: Match actual fonts, avoid Inter/Poppins defaults.

### 2. Create Implementation Plan
Use `ui-ux-designer` subagent:
- Create plan directory (use `## Naming` pattern)
- Write `plan.md` overview (<80 lines)
- Add detailed `phase-XX-name.md` files

### 3. Report to User
Provide implementation-ready documentation:
- Summary of design system
- Component breakdown
- Technical specifications
- Suggested implementation approach

## Output Format

```markdown
# Design Analysis: [Name]

## Design System
- **Style**: [aesthetic direction]
- **Colors**: [palette with hex]
- **Typography**: [fonts, sizes, weights]
- **Spacing Scale**: [values]

## Component Breakdown
1. [Component] - [specs]
2. [Component] - [specs]

## Implementation Notes
- [Technical considerations]
```

## Related
- `extraction-prompts.md` - Detailed prompts
- `extraction-output-templates.md` - Output formats
