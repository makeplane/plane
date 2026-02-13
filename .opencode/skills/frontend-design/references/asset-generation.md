# Asset Generation Workflow

Complete workflow for generating design-aligned visual assets using `ai-multimodal` skill.

## Generation Workflow

### Step 1: Define Design Context

Before generating, extract from the design brief:
- **Aesthetic direction**: Minimalist? Maximalist? Brutalist? Organic?
- **Color palette**: Primary colors, accent colors, mood
- **Typography character**: Modern sans-serif? Elegant serif? Bold display?
- **Visual tone**: Professional? Playful? Luxury? Raw?
- **User context**: Who sees this? What problem does it solve?

### Step 2: Craft Contextual Prompts

Translate design thinking into generation prompts.

**Generic (❌ Avoid)**:
```
"Modern website hero image"
```

**Design-Driven (✓ Use)**:
```
"Brutalist architectural photograph, stark concrete textures,
dramatic shadows, high contrast black and white, raw unpolished
surfaces, geometric shapes, monumental scale, inspired by
1960s Bauhaus, 16:9 aspect ratio"
```

**Prompt Components**:
1. **Style/Movement**: "Neo-brutalism", "Art Deco", "Organic modernism"
2. **Visual Elements**: Textures, shapes, composition style
3. **Color Direction**: "Muted earth tones", "Vibrant neon accents", "Monochromatic"
4. **Mood/Atmosphere**: "Serene", "Energetic", "Mysterious"
5. **Technical Specs**: Aspect ratio, composition focus
6. **References**: "Inspired by [artist/movement]"

### Step 3: Generate with Appropriate Model

Use `ai-multimodal` skill's image generation capabilities:

```bash
# Standard quality (most cases)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/hero-image \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# Ultra quality (production hero images, marketing)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/hero-ultra \
  --model imagen-4.0-ultra-generate-001 \
  --size 2K

# Fast iteration (exploring concepts)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/concept \
  --model imagen-4.0-fast-generate-001
```

**Model Selection**:
- **imagen-4.0-generate-001**: Default choice, balanced quality/speed
- **imagen-4.0-ultra-generate-001**: Final production assets, marketing materials
- **imagen-4.0-fast-generate-001**: Rapid prototyping, multiple variations

**Aspect Ratios**:
- **16:9**: Hero sections, wide banners
- **9:16**: Mobile-first, vertical content
- **1:1**: Square cards, social media
- **4:3**: Classic layouts, presentations
- **3:4**: Portrait orientations, mobile screens

### Step 4: Evaluate Against Design Standards

Use `ai-multimodal` to analyze the generated asset (see `visual-analysis.md` for complete workflow):

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-image.png \
  --task analyze \
  --prompt "Evaluate this image for:
1. Visual coherence with [aesthetic direction]
2. Color harmony and contrast
3. Composition and balance
4. Suitability for overlaying text
5. Professional quality (rate 1-10)
6. Specific weaknesses or improvements needed" \
  --output docs/assets/hero-evaluation.md \
  --model gemini-2.5-flash
```

### Step 5: Iterate or Integrate

**If evaluation score < 7/10 or doesn't meet standards**:
1. Identify specific issues (color, composition, mood, technical)
2. Refine prompt with improvements
3. Regenerate with adjusted parameters
4. Consider using `media-processing` skill for post-generation adjustments

**If meets standards**:
1. Optimize for web (compress, format conversion)
2. Create responsive variants if needed
3. Document asset usage guidelines
4. Integrate into frontend implementation

## Design Pattern Examples

### Pattern 1: Minimalist Background Texture

**Design Context**: Clean, refined interface with generous white space

**Prompt Strategy**:
```
"Subtle paper texture, off-white color (#F8F8F8), barely visible
grain pattern, high-end stationery feel, minimal contrast,
professional and clean, 1:1 aspect ratio for tiling"
```

**Use Case**: Background for minimalist product pages, portfolio sites

### Pattern 2: Maximalist Hero Section

**Design Context**: Bold, energetic landing page with vibrant colors

**Prompt Strategy**:
```
"Explosive color gradients, neon pink to electric blue,
holographic reflections, dynamic diagonal composition,
retrofuturistic aesthetic, vaporwave influence, high energy,
layered transparency effects, 16:9 cinematic"
```

**Use Case**: Hero section for creative agencies, entertainment platforms

### Pattern 3: Brutalist Geometric Pattern

**Design Context**: Raw, bold interface with strong typography

**Prompt Strategy**:
```
"Monochromatic geometric pattern, overlapping rectangles,
stark black and white, high contrast, Swiss design influence,
grid-based composition, architectural precision, repeatable
pattern for backgrounds"
```

**Use Case**: Background pattern for design studios, architecture firms

### Pattern 4: Organic Natural Elements

**Design Context**: Wellness brand, calming user experience

**Prompt Strategy**:
```
"Soft botanical watercolor, sage green and cream tones,
gentle leaf shadows, natural light quality, serene atmosphere,
minimal detail for text overlay, 3:4 portrait orientation"
```

**Use Case**: Hero section for wellness brands, eco-friendly products

### Pattern 5: Retro-Futuristic

**Design Context**: Tech product with nostalgic twist

**Prompt Strategy**:
```
"80s computer graphics aesthetic, wireframe grids, cyan and magenta
gradients, digital sunrise, Tron-inspired, geometric precision,
nostalgic future vision, 16:9 widescreen"
```

**Use Case**: SaaS landing pages, tech conferences, gaming platforms

### Pattern 6: Editorial Magazine Style

**Design Context**: Content-heavy site with strong visual hierarchy

**Prompt Strategy**:
```
"High-contrast editorial photography, dramatic side lighting,
stark shadows, black and white, fashion magazine quality,
strong vertical composition, 3:4 portrait for text layout"
```

**Use Case**: Blog headers, news sites, content platforms

## Prompt Engineering Best Practices

### 1. Be Specific About Style
❌ "Modern design"
✓ "Bauhaus-inspired geometric abstraction with primary colors"

### 2. Define Color Precisely
❌ "Colorful"
✓ "Vibrant sunset palette: coral (#FF6B6B), amber (#FFB84D), violet (#A66FF0)"

### 3. Specify Composition
❌ "Nice layout"
✓ "Rule of thirds composition, subject left-aligned, negative space right for text overlay"

### 4. Reference Movements/Artists
❌ "Artistic"
✓ "Inspired by Bauhaus geometric abstraction and Swiss International Style"

### 5. Technical Requirements First
Always include: aspect ratio, resolution needs, intended use case

### 6. Iterate Strategically
- First generation: Broad aesthetic exploration
- Second generation: Refine color and composition
- Third generation: Fine-tune details and mood

## Common Pitfalls to Avoid

### ❌ Generic Stock Photo Aesthetics
Don't prompt: "Professional business team working together"
Instead: Design-specific, contextual imagery that serves the interface

### ❌ Overcomplex Generated Images
Generated assets that compete with UI elements create visual chaos
Keep backgrounds subtle enough for text/button overlay

### ❌ Inconsistent Visual Language
Each generated asset should feel part of the same design system
Maintain color palette, visual style, mood consistency

### ❌ Ignoring Integration Context
Assets aren't standalone—consider how they work with:
- Typography overlays
- Interactive elements (buttons, forms)
- Navigation and UI chrome
- Responsive behavior across devices

## Responsive Asset Strategy

### Desktop-First Approach
1. Generate primary asset at 16:9 (desktop hero)
2. Generate mobile variant at 9:16 with same prompt
3. Ensure focal point works in both orientations

### Mobile-First Approach
1. Generate primary asset at 9:16 (mobile hero)
2. Generate desktop variant at 16:9 with same prompt
3. Test that composition scales effectively

### Variant Generation
```bash
# Desktop (16:9)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[prompt]" \
  --output docs/assets/hero-desktop \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# Mobile (9:16)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[same prompt]" \
  --output docs/assets/hero-mobile \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 9:16

# Square (1:1)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[same prompt]" \
  --output docs/assets/hero-square \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 1:1
```

## Model Cost Optimization

**Imagen 4 Pricing** (as of 2024):
- Standard: ~$0.04 per image
- Ultra: ~$0.08 per image
- Fast: ~$0.02 per image

**Optimization Strategy**:
1. Use Fast model for exploration (3-5 variations)
2. Select best direction, generate with Standard model
3. Use Ultra only for final production assets
4. Batch generate variations in single session

## Complete Example Workflow

```bash
# 1. Fast exploration (3 variations)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "Minimalist mountain landscape, muted blue-gray tones,
  fog layers, serene morning atmosphere, clean for text overlay, 16:9" \
  --output docs/assets/concept-1 \
  --model imagen-4.0-fast-generate-001 \
  --aspect-ratio 16:9

# 2. Analyze best variation
python scripts/gemini_batch_process.py \
  --files docs/assets/concept-1.png \
  --task analyze \
  --prompt "Rate 1-10 for aesthetic quality, color harmony, text overlay suitability" \
  --output docs/assets/analysis-1.md \
  --model gemini-2.5-flash

# 3. If score ≥ 7/10, generate production version
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[refined prompt based on analysis]" \
  --output docs/assets/hero-final \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# 4. Generate mobile variant
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[same refined prompt]" \
  --output docs/assets/hero-mobile \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 9:16
```

## Next Steps

- **Verify quality**: See `visual-analysis.md` for comprehensive analysis workflow
- **Optimize assets**: See `technical-guide.md` for file optimization and integration
- **Extract inspiration**: See `design-extraction.md` to learn from existing designs
