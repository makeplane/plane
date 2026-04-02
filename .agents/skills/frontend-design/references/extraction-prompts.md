# Extraction Prompt Templates

Complete prompt templates for design guideline extraction.

## Comprehensive Design Analysis Prompt

```
Extract comprehensive design guidelines from this interface:

## Aesthetic Identification
- Design Style: Identify the aesthetic movement (minimalism, brutalism, maximalism, glassmorphism, neo-brutalism, organic, luxury, editorial, etc.)
- Overall Mood: Professional, playful, serious, energetic, calm, bold, refined
- Differentiation Factor: What makes this design memorable and distinctive?

## Typography System
- Display Font: Predict font family (favor Google Fonts: Playfair Display, Bebas Neue, DM Serif, Archivo Black, etc.). Provide 2-3 alternatives if uncertain.
- Body Font: Identify or suggest similar alternatives
- Font Sizes: Estimate in px for h1, h2, h3, body, small text
- Font Weights: Used weights (300, 400, 500, 600, 700)
- Line Heights: Estimate leading ratios
- Letter Spacing: Tight, normal, or wide tracking

## Color System (CRITICAL)
- Extract 8-12 distinct colors with accurate hex codes
- Classify: Primary (1-2), Secondary (1-2), Accent (2-3), Neutral/Gray (3-5), Background (1-2)
- Note color relationships and usage patterns
- Identify gradients (provide start/end hex codes and direction)

## Spatial Composition
- Layout Type: Grid-based, asymmetric, centered, multi-column, magazine-style
- Grid System: Estimate column count and gutter widths
- Spacing Scale: Identify spacing rhythm (4px, 8px, 16px, 24px, etc.)
- White Space Strategy: Generous, tight, varied
- Section Hierarchy: How content is organized and prioritized

## Visual Elements
- Border Styles: Radius values (sharp, subtle rounded, fully rounded)
- Shadows: Box-shadow characteristics (elevation, spread, blur)
- Backgrounds: Solid, gradients, patterns, textures, images
- Effects: Blur, overlays, transparency, grain, noise
- Decorative Elements: Lines, shapes, illustrations, icons

## Component Patterns
- Button Styles: Shape, size, states, hover effects
- Card Design: Borders, shadows, padding, content structure
- Navigation: Style, position, behavior
- Forms: Input styles, validation, spacing
- Interactive Elements: Hover states, transitions

## Motion & Animation (if video)
- Transition Timing: Fast (100-200ms), medium (200-400ms), slow (400-600ms+)
- Easing Functions: Linear, ease-out, ease-in, cubic-bezier specifics
- Animation Types: Fade, slide, scale, rotate, stagger
- Scroll Interactions: Parallax, reveal-on-scroll, sticky elements

## Accessibility Considerations
- Color Contrast: Evaluate text/background combinations
- Font Sizes: Minimum sizes used
- Interactive Targets: Button/link sizes
- Visual Hierarchy: Clear content prioritization

## Design Highlights
- Top 3 standout design decisions
- What makes this design effective
- Potential improvements or considerations

Output as structured markdown for easy reference.
```

## Multi-Screen System Extraction Prompt

```
Analyze these multiple screens to extract the consistent design system:

For each screen:
1. Identify consistent design tokens (colors, typography, spacing)
2. Note variations and their rationale
3. Extract reusable component patterns

Then synthesize:
- Core design system: Consistent colors, fonts, spacing scales
- Component library: Buttons, cards, navigation, forms
- Layout patterns: Grid systems, responsive behavior
- Visual language: Shared aesthetic principles
- Design tokens: Create CSS variable recommendations

Provide as a unified design system specification.
```

## Motion Design Extraction Prompt

```
Analyze this video to extract motion design guidelines:

1. Transition Timing: Measure duration of key animations (in ms)
2. Easing Curves: Describe acceleration/deceleration (ease-in, ease-out, spring)
3. Animation Types: List all animation styles used
4. Micro-interactions: Button hovers, form focus states, feedback
5. Page Transitions: How screens change
6. Scroll Interactions: Parallax, sticky headers, reveal animations
7. Loading States: Skeleton screens, spinners, progressive reveals
8. Stagger Effects: Sequential animation delays and patterns

Provide implementable specifications with timing values.
```

## Competitive Analysis Prompt

```
Comparative design analysis of 3 competitors:

For each competitor:
1. Design style and aesthetic approach
2. Color strategy and brand perception
3. Typography choices and hierarchy
4. Layout and information architecture
5. Unique design elements
6. Strengths and weaknesses

Synthesis:
- Common industry patterns (what everyone does)
- Differentiation opportunities (gaps to exploit)
- Best practices observed (proven approaches)
- Design recommendations (how to stand out)

Provide strategic design direction based on analysis.
```
