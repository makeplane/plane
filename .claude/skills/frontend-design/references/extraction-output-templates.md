# Extraction Output Templates

Documentation format templates for extracted design guidelines.

## Template 1: Complete Design System

```markdown
# [Project/Competitor] Design System

## Aesthetic Direction
- **Style**: Neo-brutalism with organic elements
- **Mood**: Bold, confident, approachable
- **Differentiation**: High contrast typography with soft color accents

## Typography
### Display Font
- Family: Archivo Black (Google Fonts)
- Sizes: h1: 72px, h2: 48px, h3: 36px
- Weights: 400 (regular)
- Line Height: 1.1
- Letter Spacing: -0.02em

### Body Font
- Family: Inter (Google Fonts)
- Sizes: body: 16px, small: 14px
- Weights: 400, 500, 600
- Line Height: 1.6
- Letter Spacing: 0

## Color Palette
\```css
:root {
  /* Primary Colors */
  --color-primary-900: #0A1628;
  --color-primary-600: #1E40AF;
  --color-primary-400: #60A5FA;

  /* Accent Colors */
  --color-accent-500: #F59E0B;
  --color-accent-300: #FCD34D;

  /* Neutral Colors */
  --color-neutral-900: #111827;
  --color-neutral-700: #374151;
  --color-neutral-500: #6B7280;
  --color-neutral-300: #D1D5DB;
  --color-neutral-100: #F3F4F6;

  /* Background */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
}
\```

## Spacing System
- Base: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Usage: Consistent 8px rhythm for most components

## Component Specifications

### Button (Primary)
\```css
.button-primary {
  background: var(--color-primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background 200ms ease-out;
}
.button-primary:hover {
  background: var(--color-primary-900);
}
\```

### Card
\```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: box-shadow 200ms ease-out;
}
.card:hover {
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}
\```

## Motion Guidelines
- Transition timing: 200ms for micro-interactions, 400ms for page transitions
- Easing: ease-out for entrances, ease-in for exits
- Stagger delay: 50ms between sequential elements
```

## Template 2: Competitive Analysis

```markdown
# Competitive Design Analysis

## Competitors Analyzed
1. Competitor A - [URL]
2. Competitor B - [URL]
3. Competitor C - [URL]

## Comparative Summary

| Aspect | Competitor A | Competitor B | Competitor C |
|--------|--------------|--------------|--------------|
| Aesthetic | Minimalist | Maximalist | Editorial |
| Primary Color | #1E40AF | #7C3AED | #DC2626 |
| Typography | Inter | Poppins | Playfair Display |
| Layout | Grid-based | Asymmetric | Magazine |

## Common Patterns (Industry Standard)
- All use sans-serif for body text
- All prioritize mobile-first responsive design
- All use card-based layouts for content
- All feature hero sections with large imagery

## Differentiation Opportunities
1. **Color Strategy**: Competitors use saturated colors; opportunity for muted, sophisticated palette
2. **Typography**: No one uses display serifs; opportunity for elegant, high-end feel
3. **Layout**: All symmetric; opportunity for asymmetric, dynamic composition

## Recommendations
Based on analysis, recommend:
- Aesthetic: Refined minimalism with editorial typography
- Color: Muted earth tones with one bold accent
- Layout: Asymmetric grid with generous white space
- Differentiation: Unexpected typography hierarchy, subtle animations
```

## Integration Workflow

### After Extraction

1. **Review & Validate**
   - Manually verify color codes with eyedropper tool
   - Cross-reference font predictions against Google Fonts
   - Check spacing values against browser dev tools

2. **Adapt & Customize**
   - Don't copy—adapt principles to your unique context
   - Maintain underlying logic, change expression
   - Example: Extract "generous white space" principle, apply with your colors

3. **Document Decisions**
   - Save extracted guidelines in project `docs/design-guidelines/`
   - Create design system spec from extraction
   - Reference when generating new assets

4. **Reference in Implementation**
   - Use extracted tokens when generating new assets with `asset-generation.md`
   - Apply extracted principles when analyzing your own designs with `visual-analysis.md`
   - Maintain consistency between inspiration and implementation

5. **Iterate & Refine**
   - Update guidelines as design evolves
   - Extract from multiple sources, synthesize learnings
   - Create your own unique voice from combined insights
