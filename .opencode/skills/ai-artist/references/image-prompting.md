# Image Generation Prompting

## Universal Structure
```
[Subject + Details] [Action/Pose] [Setting/Environment]
[Style/Medium] [Artist/Movement Reference]
[Lighting] [Camera/Lens] [Composition]
[Quality Modifiers] [Aspect Ratio]
```

## Platform Reference

### Midjourney v6.1
```
[prompt] --ar 16:9 --style raw --v 6.1
```

| Parameter | Values | Effect |
|-----------|--------|--------|
| `--ar` | 1:1, 16:9, 9:16, 4:3, 3:2, 21:9 | Aspect ratio |
| `--style` | raw, default | raw=photorealistic |
| `--stylize` | 0-1000 | Artistic interpretation (0=literal) |
| `--chaos` | 0-100 | Variation between outputs |
| `--weird` | 0-3000 | Unusual/experimental elements |
| `--quality` | .25, .5, 1, 2 | Detail level (cost) |
| `--seed` | number | Reproducibility |
| `--no` | [term] | Negative prompt inline |
| `--tile` | - | Seamless patterns |

**Multi-prompt weighting**: `cat::2 dog::1` (cat 2x stronger)
**Describe**: Upload image → get prompt suggestions
**Blend**: `/blend` to merge 2-5 images

### DALL-E 3
- Natural language only, no parameters
- Be descriptive, not keyword-heavy
- Specify: "HD quality" or "vivid style" in prompt
- Text rendering: Describe font, placement, content explicitly
- Avoid: Lists of keywords, technical jargon

### Stable Diffusion / SDXL / Flux
```
(important term:1.3), normal term, (less important:0.8)
Negative prompt: ugly, blurry, deformed, watermark
```

| Feature | Syntax |
|---------|--------|
| Weight up | `(word:1.2)` to `(word:1.5)` |
| Weight down | `(word:0.5)` to `(word:0.8)` |
| LoRA | `<lora:model_name:0.8>` |
| Embedding | `embedding:name` |
| Blend | `[cat|dog]` alternating |

**CFG Scale**: 7-12 typical (higher=more prompt adherence)
**Samplers**: DPM++ 2M Karras (quality), Euler a (speed)

### Nano Banana (Gemini)
```
[Narrative description, not keywords]
Captured with 85mm lens, soft bokeh, natural lighting
```

**Key features**:
- 32K token context (complex prompts OK)
- Narrative paragraphs > keyword lists
- Hex colors for precision: `#9F2B68`
- Text rendering: Describe font, placement explicitly
- Multi-image: Up to 14 reference images
- Search grounding: Real-time data (weather, events)
- Thinking mode: Complex composition reasoning

**Aspect ratios**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
**Resolution**: 1K, 2K, 4K (use uppercase K)

**Best practices**:
- ALL CAPS for critical requirements
- Markdown lists for multiple rules
- "NEVER include..." for negative constraints
- Photography terms anchor quality

### Imagen 4 / Veo 3.1
- Natural language, descriptive
- Aspect ratio in text: "16:9 landscape format"
- Veo: Cinematography keywords most powerful
- Camera movements: pan, tilt, dolly, crane, tracking
- Scene transitions: cut, fade, dissolve

## Style Keywords

### Art Movements
photorealistic, hyperrealistic, impressionist, expressionist,
surrealist, art nouveau, art deco, pop art, cyberpunk, steampunk,
solarpunk, vaporwave, synthwave, brutalist, minimalist

### Media Types
oil painting, watercolor, digital art, 3D render, vector art,
pencil sketch, ink drawing, pastel, charcoal, gouache, fresco

### Photography Styles
portrait, landscape, macro, street, documentary, fashion,
editorial, product, architectural, aerial, underwater

## Lighting Vocabulary

| Term | Effect |
|------|--------|
| Golden hour | Warm, soft, directional |
| Blue hour | Cool, moody, twilight |
| Rembrandt | Triangle on cheek, dramatic |
| Butterfly | Shadow under nose, glamorous |
| Split | Half face lit, mysterious |
| Rim/back | Edge highlight, separation |
| Volumetric | Light rays visible |
| Neon glow | Colorful, cyberpunk |

## Camera/Lens Terms
- 50mm (standard), 85mm (portrait), 35mm (wide)
- Telephoto (compressed), Macro (close-up), Fisheye (distorted)
- Shallow DOF, Deep DOF, Bokeh
- Low angle, High angle, Dutch angle, Bird's eye, Worm's eye

## Composition Keywords
rule of thirds, golden ratio, centered, symmetrical,
leading lines, framing, negative space, filling frame,
foreground interest, layered depth

## Negative Prompts (SD/Flux)
```
ugly, deformed, blurry, low quality, bad anatomy,
extra limbs, missing limbs, disfigured, watermark,
text, signature, cropped, out of frame, duplicate,
poorly drawn, bad proportions, gross proportions
```

## Iterative Workflow
1. Start: Subject + style + quality modifier
2. Add: Lighting + composition + camera
3. Test: Generate 4 variations
4. Refine: Adjust weights, add negatives
5. Upscale: Select winner, increase resolution
