# Nano Banana Pro (Gemini Image)

## Models

| Model ID | Type | Best For |
|----------|------|----------|
| `gemini-2.5-flash-image` | Flash | Speed, high-volume |
| `gemini-3-pro-image-preview` | Pro | Text rendering, complex prompts |

## Core Principle

**Narrative paragraphs > keyword lists** (32K context). Write like briefing a photographer.

## Parameters

```python
responseModalities=['TEXT', 'IMAGE']
aspect_ratio="16:9"  # 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
image_size="2K"      # 1K, 2K, 4K - MUST be uppercase K
```

## Prompt Templates

**Photorealistic**: `A [subject] in [location], [lens] lens. [Lighting] creates [mood]. [Details]. [Camera angle]. Professional photography, natural lighting.`

**Illustration**: `[Art style] illustration of [subject]. [Color palette]. [Line style]. [Background]. [Mood].`

**Text in Image**: `Image with text "[EXACT]" in [font]. Font: [style]. Color: [hex/#FF5733]. Position: [top/center/bottom]. Background: [desc]. Context: [poster/sign].`

**Product**: `[Product] on [surface]. Materials: [finish]. Lighting: [setup]. Camera: [angle]. Background: [type]. Style: [commercial/lifestyle].`

**Infographic**: `Premium liquid glass Bento grid infographic with 8 modules. Product: [item]. Language: [lang]. Hero card: 28-30%. Background: [ethereal/macro/pattern/context].`

## Prompt Collection / Prompt Search

Read `references/awesome-prompts.csv` directly or search for relevant prompts using `python3 ../scripts/search.py "<query>"`.

## JSON Structured Prompts

For complex scenes, use JSON structure:

```json
{
  "meta_data": { "prompt_version": "2.0", "use_case": "..." },
  "subject_layer": {
    "anatomy": { "demographics": {}, "face_detail": {}, "hair": {} },
    "attire_layer": { "garment_main": {}, "accessories": {} },
    "pose_dynamics": { "posture": "", "limb_placement": {} }
  },
  "environment_layer": { "setting_type": "", "spatial_layout": {} },
  "composition_and_tech": {
    "framing": { "type": "", "angle": "" },
    "lighting": { "source": "", "direction": "" },
    "aesthetic_style": { "visual_core": "", "vibe": "" }
  }
}
```

## Techniques

| Technique | Example |
|-----------|---------|
| Emphasis | `ALL CAPS` for critical requirements |
| Precision colors | `#9F2B68` instead of "dark magenta" |
| Negative constraints | `NEVER include text/watermarks. DO NOT add labels.` |
| Realism trigger | `Natural lighting, DOF. Captured with Canon EOS 90D DSLR.` |
| Structured edits | `Make ALL edits: - [1] - [2] - [3]` |
| Complex logic | `Kittens MUST have heterochromatic eyes matching fur colors` |
| Identity lock | `Use reference as EXACT facial reference. STRICT identity lock.` |

## Advanced Features

**Multi-Image Input** (up to 14): 6 object + 5 human refs. Tip: collage refs into single image.

**Search Grounding**: `tools=[{"google_search": {}}]` — real-time data (weather, charts, events).

**Thinking Mode** (Pro only): `part.thought` in response for complex reasoning.

## Popular Use Case Templates

### Quote Card
```
A wide quote card with {background} background, {font_style} font.
Quote: "{quote_text}" — {author}
Large subtle quotation mark before text. Portrait on left, text right.
Text: 2/3 width, portrait: 1/3 width. Gradient transition on portrait.
```

### Infographic (Bento Grid)
```
Premium liquid glass Bento grid product infographic with 8 modules.
Product: [name]. Language: [lang].
1) Hero card (28-30%): Product photo/3D glass
2) Core Benefits: 4 benefits + icons
3) How to Use: 4 methods + icons
4) Key Metrics: 5 data points
5) Who It's For: 4 recommended + 3 caution groups
6) Important Notes: 4 precautions
7) Quick Reference: Specs/certifications
8) Did You Know: 3 facts
Background: Apple liquid glass cards (85-90% transparent).
```

### Mirror Selfie
```
Scene: Mirror selfie in [room type], [color] tone.
Subject: [demographics], [body type], [hairstyle].
Pose: [stance], holding smartphone.
Clothing: [detailed outfit description].
Environment: [room details, furnishings, lighting].
Camera: Smartphone rear camera via mirror, [focal length]mm.
Negative: [artifacts to avoid].
```

### Style Transformation
```
A Japanese Edo-period Ukiyo-e woodblock print reimagining [modern scene].
Characters: Edo-era kimono but modern actions.
Tech transformation: Smartphones → glowing scrolls, trains → wooden carriages.
Composition: Flattened perspective, bold ink outlines.
Texture: Wood grain, paper fibers, pigment bleeding.
Colors: Prussian blue, vermilion red, muted ochre.
Include vertical Japanese calligraphy and red artist seal.
```

## Workflow

1. Narrative description → 2. Photography terms → 3. ALL CAPS emphasis → 4. Multi-turn refine → 5. Negative constraints → 6. Set ratio/resolution

## Avoid

- Keyword spam ("4k, trending, masterpiece")
- Vague text ("add some text" → specify exact text, font, position)
- Lowercase resolution ("4k" rejected, use "4K")
- Over-smoothed skin requests (leads to plastic look)
- Generic prompts without specific details
