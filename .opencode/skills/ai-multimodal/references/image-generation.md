# Image Generation Reference

Comprehensive guide for image creation, editing, and composition using Imagen 4 and Gemini models ("Nano Banana").

> **Nano Banana** = Google's internal name for native image generation in Gemini API. Two variants: Nano Banana (Flash - speed) and Nano Banana Pro (3 Pro - quality with reasoning).

## Core Capabilities

- **Text-to-Image**: Generate images from text prompts
- **Image Editing**: Modify existing images with text instructions
- **Multi-Image Composition**: Combine up to 14 reference images (Pro model)
- **Iterative Refinement**: Multi-turn conversational refinement
- **Aspect Ratios**: 10 formats (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)
- **Image Sizes**: 1K, 2K, 4K (uppercase K required)
- **Quality Variants**: Standard/Ultra/Fast for different needs
- **Text in Images**: Up to 25 chars optimal (4K text in Pro)
- **Search Grounding**: Real-time data integration (Pro only)
- **Thinking Mode**: Advanced reasoning for complex prompts (Pro only)

## Models

### Nano Banana (Default - Recommended)

**gemini-2.5-flash-image** - Nano Banana Flash ⭐ DEFAULT
- Best for: Speed, high-volume generation, rapid prototyping
- Quality: High
- Context: 65,536 input / 32,768 output tokens
- Speed: Fast (~5-10s per image)
- Cost: ~$1/1M input tokens
- Aspect Ratios: All 10 supported
- Image Sizes: 1K, 2K, 4K
- Status: Stable (Oct 2025)

**gemini-3-pro-image-preview** - Nano Banana Pro
- Best for: Professional assets, 4K text rendering, complex prompts
- Quality: Ultra (with advanced reasoning)
- Context: 65,536 input / 32,768 output tokens
- Speed: Medium
- Cost: ~$2/1M text input, $0.134/image (resolution-dependent)
- Multi-Image: Up to 14 reference images (6 objects + 5 humans)
- Features: Thinking mode, Google Search grounding
- Status: Preview (Nov 2025)

### Imagen 4 (Alternative - Production)

**imagen-4.0-generate-001** - Standard quality, balanced performance
- Best for: Production workflows, marketing assets
- Quality: High
- Speed: Medium (~5-10s per image)
- Cost: ~$0.02/image (estimated)
- Output: 1-4 images per request
- Resolution: 1K or 2K
- Updated: June 2025

**imagen-4.0-ultra-generate-001** - Maximum quality
- Best for: Final production, marketing assets, detailed artwork
- Quality: Ultra (highest available)
- Speed: Slow (~15-25s per image)
- Cost: ~$0.04/image (estimated)
- Output: 1-4 images per request
- Resolution: 2K preferred
- Updated: June 2025

**imagen-4.0-fast-generate-001** - Fastest generation
- Best for: Rapid iteration, bulk generation, real-time use
- Quality: Good
- Speed: Fast (~2-5s per image)
- Cost: ~$0.01/image (estimated)
- Output: 1-4 images per request
- Resolution: 1K
- Updated: June 2025

### Legacy Models

**gemini-2.0-flash-preview-image-generation** - Legacy
- Status: Deprecated (use Nano Banana or Imagen 4 instead)
- Context: 32,768 input / 8,192 output tokens

## Model Comparison

| Model | Quality | Speed | Cost | Best For |
|-------|---------|-------|------|----------|
| gemini-2.5-flash-image | ⭐⭐⭐⭐ | 🚀 Fast | 💵 Low | **DEFAULT** - General use |
| gemini-3-pro-image | ⭐⭐⭐⭐⭐ | 💡 Medium | 💰 Medium | Text/reasoning |
| imagen-4.0-generate | ⭐⭐⭐⭐ | 💡 Medium | 💰 Medium | Production (alternative) |
| imagen-4.0-ultra | ⭐⭐⭐⭐⭐ | 🐢 Slow | 💰💰 High | Marketing assets |
| imagen-4.0-fast | ⭐⭐⭐ | 🚀 Fast | 💵 Low | Bulk generation |

**Selection Guide**:
- **Default/General**: Use `gemini-2.5-flash-image` (fast, cost-effective)
- **Production Quality**: Use `imagen-4.0-generate-001` (alternative for final assets)
- **Marketing/Ultra Quality**: Use `imagen-4.0-ultra` for maximum quality
- **Text-Heavy Images**: Use `gemini-3-pro-image-preview` for 4K text rendering
- **Complex Prompts with Reasoning**: Use `gemini-3-pro-image-preview` with Thinking mode
- **Real-time Data Integration**: Use `gemini-3-pro-image-preview` with Search grounding

## Quick Start

### Basic Generation (Default - Nano Banana Flash)

```python
from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Nano Banana Flash - DEFAULT (fast, cost-effective)
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='A serene mountain landscape at sunset with snow-capped peaks',
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],  # Uppercase required
        image_config=types.ImageConfig(
            aspect_ratio='16:9',
            image_size='2K'  # 1K, 2K, 4K - uppercase K required
        )
    )
)

# Save images
for i, part in enumerate(response.candidates[0].content.parts):
    if part.inline_data:
        with open(f'output-{i}.png', 'wb') as f:
            f.write(part.inline_data.data)
```

### Alternative - Imagen 4 (Production Quality)

```python
# Imagen 4 Standard - alternative for production workflows
response = client.models.generate_images(
    model='imagen-4.0-generate-001',
    prompt='Professional product photography of smartphone',
    config=types.GenerateImagesConfig(
        numberOfImages=1,
        aspectRatio='16:9',
        imageSize='1K'
    )
)

# Save Imagen 4 output
for i, generated_image in enumerate(response.generated_images):
    with open(f'output-{i}.png', 'wb') as f:
        f.write(generated_image.image.image_bytes)
```

### Imagen 4 Quality Variants

```python
# Ultra quality (marketing assets)
response = client.models.generate_images(
    model='imagen-4.0-ultra-generate-001',
    prompt='Professional product photography of smartphone',
    config=types.GenerateImagesConfig(
        numberOfImages=1,
        imageSize='2K'  # Use 2K for ultra (Standard/Ultra only)
    )
)

# Fast generation (bulk)
# Note: Fast model doesn't support imageSize parameter
response = client.models.generate_images(
    model='imagen-4.0-fast-generate-001',
    prompt='Quick concept sketch of robot character',
    config=types.GenerateImagesConfig(
        numberOfImages=4,  # Generate multiple variants (default: 4)
        aspectRatio='1:1'
    )
)
```

### Nano Banana Pro (4K Text, Reasoning)

```python
# Nano Banana Pro - for text rendering and complex prompts
response = client.models.generate_content(
    model='gemini-3-pro-image-preview',
    contents='A futuristic cityscape with neon lights',
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],  # Uppercase required
        image_config=types.ImageConfig(
            aspect_ratio='16:9',
            image_size='4K'  # 4K text rendering
        )
    )
)

# Nano Banana Pro - with Thinking mode and Search grounding
response = client.models.generate_content(
    model='gemini-3-pro-image-preview',
    contents='Current weather in Tokyo visualized as artistic infographic',
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],  # Both text and image
        image_config=types.ImageConfig(
            aspect_ratio='1:1',
            image_size='4K'
        )
    ),
    tools=[{'google_search': {}}]  # Enable search grounding
)

# Save from content parts
for i, part in enumerate(response.candidates[0].content.parts):
    if part.inline_data:
        with open(f'output-{i}.png', 'wb') as f:
            f.write(part.inline_data.data)
```

### Multi-Image Reference (Nano Banana Pro)

```python
from PIL import Image

# Up to 14 reference images (6 objects + 5 humans recommended)
img1 = Image.open('style_ref.png')
img2 = Image.open('color_ref.png')
img3 = Image.open('composition_ref.png')

response = client.models.generate_content(
    model='gemini-3-pro-image-preview',
    contents=[
        'Blend these reference styles into a cohesive hero image for a tech product',
        img1, img2, img3
    ],
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],
        image_config=types.ImageConfig(
            aspect_ratio='16:9',
            image_size='4K'
        )
    )
)
```

### Multi-Turn Refinement Chat

```python
# Conversational image refinement
chat = client.chats.create(
    model='gemini-2.5-flash-image',
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE']
    )
)

# Initial generation
response1 = chat.send_message('Create a minimalist logo for a coffee brand called "Brew"')

# Iterative refinement
response2 = chat.send_message('Make the text bolder and add steam rising from the cup')
response3 = chat.send_message('Change the color palette to warm earth tones')
```

## API Differences

### Imagen 4 vs Nano Banana (Gemini Native)

| Feature | Imagen 4 | Nano Banana (Gemini) |
|---------|----------|---------------------|
| Method | `generate_images()` | `generate_content()` |
| Config | `GenerateImagesConfig` | `GenerateContentConfig` |
| Prompt param | `prompt` (string) | `contents` (string/list) |
| Image count | `numberOfImages` (camelCase) | N/A (single per request) |
| Aspect ratio | `aspectRatio` (camelCase) | `aspect_ratio` (snake_case) |
| Size | `imageSize` | `image_size` |
| Response | `generated_images[i].image.image_bytes` | `candidates[0].content.parts[i].inline_data.data` |
| Multi-image input | ❌ | ✅ Up to 14 references |
| Multi-turn chat | ❌ | ✅ Conversational |
| Search grounding | ❌ | ✅ (Pro only) |
| Thinking mode | ❌ | ✅ (Pro only) |
| Text rendering | Limited | 4K (Pro) |

**Imagen 4** uses `generate_images()`:
```python
response = client.models.generate_images(
    model='imagen-4.0-generate-001',
    prompt='...',
    config=types.GenerateImagesConfig(
        numberOfImages=1,      # camelCase
        aspectRatio='16:9',    # camelCase
        imageSize='1K'         # Standard/Ultra only
    )
)
# Access: response.generated_images[0].image.image_bytes
```

**Nano Banana** uses `generate_content()`:
```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',  # or gemini-3-pro-image-preview
    contents='...',
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],  # Uppercase required
        image_config=types.ImageConfig(
            aspect_ratio='16:9',        # snake_case
            image_size='2K'             # 1K, 2K, 4K - uppercase K
        )
    )
)
# Access: response.candidates[0].content.parts[0].inline_data.data
```

**Critical Notes**:
1. `response_modalities` values MUST be uppercase: `'IMAGE'`, `'TEXT'`
2. `image_size` value MUST have uppercase K: `'1K'`, `'2K'`, `'4K'`
3. Imagen 4 Fast model doesn't support `imageSize` parameter

## Aspect Ratios

| Ratio | Resolution (1K) | Use Case | Token Cost |
|-------|----------------|----------|------------|
| 1:1 | 1024×1024 | Social media, avatars, icons | 1290 |
| 2:3 | 682×1024 | Vertical portraits | 1290 |
| 3:2 | 1024×682 | Horizontal portraits | 1290 |
| 3:4 | 768×1024 | Vertical posters | 1290 |
| 4:3 | 1024×768 | Traditional media | 1290 |
| 4:5 | 819×1024 | Instagram portrait | 1290 |
| 5:4 | 1024×819 | Horizontal photos | 1290 |
| 9:16 | 576×1024 | Mobile/stories/reels | 1290 |
| 16:9 | 1024×576 | Landscapes, banners, YouTube | 1290 |
| 21:9 | 1024×438 | Ultrawide/cinematic | 1290 |

All ratios cost the same: 1,290 tokens per image (Gemini models).

## Response Modalities

### Image Only

```python
config = types.GenerateContentConfig(
    response_modalities=['image'],
    aspect_ratio='1:1'
)
```

### Text Only (No Image)

```python
config = types.GenerateContentConfig(
    response_modalities=['text']
)
# Returns text description instead of generating image
```

### Both Image and Text

```python
config = types.GenerateContentConfig(
    response_modalities=['image', 'text'],
    aspect_ratio='16:9'
)
# Returns both generated image and description
```

## Image Editing

### Modify Existing Image

```python
import PIL.Image

# Load original
img = PIL.Image.open('original.png')

# Edit with instructions
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Add a red balloon floating in the sky',
        img
    ],
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='16:9'
    )
)
```

### Style Transfer

```python
img = PIL.Image.open('photo.jpg')

response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Transform this into an oil painting style',
        img
    ]
)
```

### Object Addition/Removal

```python
# Add object
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Add a vintage car parked on the street',
        img
    ]
)

# Remove object
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Remove the person on the left side',
        img
    ]
)
```

## Multi-Image Composition

### Combine Multiple Images

```python
img1 = PIL.Image.open('background.png')
img2 = PIL.Image.open('foreground.png')
img3 = PIL.Image.open('overlay.png')

response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Combine these images into a cohesive scene',
        img1,
        img2,
        img3
    ],
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='16:9'
    )
)
```

**Note**: Recommended maximum 3 input images for best results.

## Prompt Engineering

### Core Principle: Narrative > Keywords

> **Nano Banana prompting**: Write like you're briefing a photographer, not providing SEO keywords. Narrative paragraphs outperform keyword lists.

❌ **Bad**: "cat, 4k, masterpiece, trending, professional, ultra detailed, cinematic"
✅ **Good**: "A fluffy orange tabby cat with green eyes lounging on a sun-drenched windowsill. Soft morning light creates a warm glow. Shot with a 50mm lens at f/1.8 for shallow depth of field. Natural lighting, documentary photography style."

### Effective Prompt Structure

**Three key elements**:
1. **Subject**: What to generate (be specific)
2. **Context**: Environmental setting (lighting, location, time)
3. **Style**: Artistic treatment (photography, illustration, etc.)

### Quality Modifiers

**Technical terms**:
- "4K", "8K", "high resolution"
- "HDR", "high dynamic range"
- "professional photography"
- "studio lighting"
- "ultra detailed"

**Camera settings**:
- "35mm lens", "50mm lens"
- "shallow depth of field"
- "wide angle shot"
- "macro photography"
- "golden hour lighting"

### Style Keywords

**Art styles**:
- "oil painting", "watercolor", "sketch"
- "digital art", "concept art"
- "photorealistic", "hyperrealistic"
- "minimalist", "abstract"
- "cyberpunk", "steampunk", "fantasy"

**Mood and atmosphere**:
- "dramatic lighting", "soft lighting"
- "moody", "bright and cheerful"
- "mysterious", "whimsical"
- "dark and gritty", "pastel colors"

### Subject Description

**Be specific**:
- ❌ "A cat"
- ✅ "A fluffy orange tabby cat with green eyes"

**Add context**:
- ❌ "A building"
- ✅ "A modern glass skyscraper reflecting sunset clouds"

**Include details**:
- ❌ "A person"
- ✅ "A young woman in a red dress holding an umbrella"

### Composition and Framing

**Camera angles**:
- "bird's eye view", "aerial shot"
- "low angle", "high angle"
- "close-up", "wide shot"
- "centered composition"
- "rule of thirds"

**Perspective**:
- "first person view"
- "third person perspective"
- "isometric view"
- "forced perspective"

### Text in Images

**Limitations**:
- Maximum 25 characters total for optimal results
- Up to 3 distinct text phrases
- For 4K text rendering, use `gemini-3-pro-image-preview`

**Text prompt template**:
```
Image with text "[EXACT TEXT]" in [font style].
Font: [style description].
Color: [hex code like #FF5733].
Position: [top/center/bottom].
Background: [description].
Context: [poster/sign/label].
```

**Example**:
```python
response = client.models.generate_content(
    model='gemini-3-pro-image-preview',  # Use Pro for better text
    contents='''
    Create a vintage travel poster with text "EXPLORE TOKYO" at the top.
    Font: Bold retro sans-serif, slightly condensed.
    Color: #F5E6D3 (cream white).
    Position: Top third of image.
    Background: Stylized Tokyo skyline with Mt. Fuji, sunset colors.
    Style: 1950s travel poster aesthetic, muted warm colors.
    '''
)
```

**Font keywords**:
- "bold sans-serif", "handwritten script", "vintage letterpress"
- "modern minimalist", "art deco", "neon sign"

### Nano Banana Prompt Techniques

| Technique | Example | Purpose |
|-----------|---------|---------|
| ALL CAPS emphasis | `The logo MUST be centered` | Force attention to critical requirements |
| Hex colors | `#9F2B68` instead of "dark magenta" | Exact color control |
| Negative constraints | `NEVER include text/watermarks. DO NOT add labels.` | Explicit exclusions |
| Realism trigger | `Natural lighting, DOF. Captured with Canon EOS 90D DSLR.` | Photography authenticity |
| Structured edits | `Make ALL edits: - [1] - [2] - [3]` | Multi-step changes |
| Complex logic | `Kittens MUST have heterochromatic eyes matching fur colors` | Precise conditions |

**Prompt Templates**:

**Photorealistic**:
```
A [subject] in [location], [lens] lens. [Lighting] creates [mood]. [Details].
[Camera angle]. Professional photography, natural lighting.
```

**Illustration**:
```
[Art style] illustration of [subject]. [Color palette]. [Line style].
[Background]. [Mood].
```

**Product**:
```
[Product] on [surface]. Materials: [finish]. Lighting: [setup].
Camera: [angle]. Background: [type]. Style: [commercial/lifestyle].
```

## Advanced Techniques

### Iterative Refinement

```python
# Initial generation
response1 = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='A futuristic city skyline'
)

# Save first version
with open('v1.png', 'wb') as f:
    f.write(response1.candidates[0].content.parts[0].inline_data.data)

# Refine
img = PIL.Image.open('v1.png')
response2 = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[
        'Add flying vehicles and neon signs',
        img
    ]
)
```

### Negative Prompts (Indirect)

```python
# Instead of "no blur", be specific about what you want
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='A crystal clear, sharp photograph of a diamond ring with perfect focus and high detail'
)
```

### Consistent Style Across Images

```python
base_prompt = "Digital art, vibrant colors, cel-shaded style, clean lines"

prompts = [
    f"{base_prompt}, a warrior character",
    f"{base_prompt}, a mage character",
    f"{base_prompt}, a rogue character"
]

for i, prompt in enumerate(prompts):
    response = client.models.generate_content(
        model='gemini-2.5-flash-image',
        contents=prompt
    )
    # Save each character
```

## Safety Settings

### Configure Safety Filters

```python
config = types.GenerateContentConfig(
    response_modalities=['image'],
    safety_settings=[
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        )
    ]
)
```

### Available Categories

- `HARM_CATEGORY_HATE_SPEECH`
- `HARM_CATEGORY_DANGEROUS_CONTENT`
- `HARM_CATEGORY_HARASSMENT`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`

### Thresholds

- `BLOCK_NONE`: No blocking
- `BLOCK_LOW_AND_ABOVE`: Block low probability and above
- `BLOCK_MEDIUM_AND_ABOVE`: Block medium and above (default)
- `BLOCK_ONLY_HIGH`: Block only high probability

## Common Use Cases

### 1. Marketing Assets

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='''Professional product photography:
    - Sleek smartphone on minimalist white surface
    - Dramatic side lighting creating subtle shadows
    - Shallow depth of field, crisp focus
    - Clean, modern aesthetic
    - 4K quality
    ''',
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='4:3'
    )
)
```

### 2. Concept Art

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='''Fantasy concept art:
    - Ancient floating islands connected by chains
    - Waterfalls cascading into clouds below
    - Magical crystals glowing on the islands
    - Epic scale, dramatic lighting
    - Detailed digital painting style
    ''',
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='16:9'
    )
)
```

### 3. Social Media Graphics

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='''Instagram post design:
    - Pastel gradient background (pink to blue)
    - Motivational quote layout
    - Modern minimalist style
    - Clean typography
    - Mobile-friendly composition
    ''',
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='1:1'
    )
)
```

### 4. Illustration

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='''Children's book illustration:
    - Friendly cartoon dragon reading a book
    - Bright, cheerful colors
    - Soft, rounded shapes
    - Whimsical forest background
    - Warm, inviting atmosphere
    ''',
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='4:3'
    )
)
```

### 5. UI/UX Mockups

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='''Modern mobile app interface:
    - Clean dashboard design
    - Card-based layout
    - Soft shadows and gradients
    - Contemporary color scheme (blue and white)
    - Professional fintech aesthetic
    ''',
    config=types.GenerateContentConfig(
        response_modalities=['image'],
        aspect_ratio='9:16'
    )
)
```

## Best Practices

### Prompt Quality

1. **Be specific**: More detail = better results
2. **Order matters**: Most important elements first
3. **Use examples**: Reference known styles or artists
4. **Avoid contradictions**: Don't ask for opposing styles
5. **Test and iterate**: Refine prompts based on results

### File Management

```python
# Save with descriptive names
timestamp = int(time.time())
filename = f'generated_{timestamp}_{aspect_ratio}.png'

with open(filename, 'wb') as f:
    f.write(image_data)
```

### Cost Optimization

**Token costs**:
- 1 image: 1,290 tokens = $0.00129 (Flash Image at $1/1M)
- 10 images: 12,900 tokens = $0.0129
- 100 images: 129,000 tokens = $0.129

**Strategies**:
- Generate fewer iterations
- Use text modality first to validate concept
- Batch similar requests
- Cache prompts for consistent style

## Error Handling

### Safety Filter Blocking

```python
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash-image',
        contents=prompt
    )
except Exception as e:
    # Check block reason
    if hasattr(e, 'prompt_feedback'):
        print(f"Blocked: {e.prompt_feedback.block_reason}")
        # Modify prompt and retry
```

### Token Limit Exceeded

```python
# Keep prompts concise
if len(prompt) > 1000:
    # Truncate or simplify
    prompt = prompt[:1000]
```

## Limitations

### Imagen 4 Constraints
- **Language**: English prompts only
- **Prompt length**: Maximum 480 tokens
- **Output**: 1-4 images per request
- **Watermark**: All images include SynthID watermark
- **Fast model**: No `imageSize` parameter support (fixed resolution)
- **Text rendering**: Limited to ~25 characters for optimal results
- **Regional restrictions**: Child images restricted in EEA, CH, UK
- **Cannot replicate**: Specific people or copyrighted characters

### Nano Banana (Gemini) Constraints
- **Language**: English prompts primary support
- **Context**: 32K token window
- **Multi-image**: Standard models ~3-5 refs; Pro up to 14 refs
- **Text rendering**: Standard limited; Pro supports 4K text
- **Watermark**: All images include SynthID watermark
- **Case sensitivity**: `response_modalities` must be uppercase (`'IMAGE'`, `'TEXT'`)
- **Size format**: `image_size` must have uppercase K (`'1K'`, `'2K'`, `'4K'`)

### General Limitations
- Maximum 14 input images for composition (Pro only)
- No video or animation generation (use Veo for video)
- No real-time generation

## Troubleshooting

### aspect_ratio Parameter Error

**Error**: `Extra inputs are not permitted [type=extra_forbidden, input_value='1:1', input_type=str]`

**Cause**: The `aspect_ratio` parameter must be nested inside an `image_config` object, not passed directly to `GenerateContentConfig`.

**Incorrect Usage**:
```python
# ❌ This will fail
config = types.GenerateContentConfig(
    response_modalities=['image'],
    aspect_ratio='16:9'  # Wrong - not a direct parameter
)
```

**Correct Usage**:
```python
# ✅ Correct implementation
config = types.GenerateContentConfig(
    response_modalities=['Image'],  # Note: Capital 'I'
    image_config=types.ImageConfig(
        aspect_ratio='16:9'
    )
)
```

### Response Modality Case Sensitivity

The `response_modalities` parameter expects uppercase values:
- ✅ Correct: `['IMAGE']`, `['TEXT']`, `['IMAGE', 'TEXT']`
- ❌ Wrong: `['image']`, `['text']`, `['Image']`

### Image Size Parameter Not Supported

**Error**: `400 INVALID_ARGUMENT`

**Cause**: The `image_size` parameter in `ImageConfig` is not supported by all Nano Banana models.

**Solution**: Don't pass `image_size` unless explicitly needed. The API uses sensible defaults.

```python
# ✅ Works - no image_size
config=types.GenerateContentConfig(
    response_modalities=['IMAGE'],
    image_config=types.ImageConfig(
        aspect_ratio='16:9'  # Only aspect_ratio
    )
)

# ⚠️ May fail - with image_size (model-dependent)
config=types.GenerateContentConfig(
    response_modalities=['IMAGE'],
    image_config=types.ImageConfig(
        aspect_ratio='16:9',
        image_size='2K'  # Not supported by all models
    )
)
```

### Multi-Image Reference Issues

**Problem**: Poor composition with multiple reference images

**Solutions**:
1. Limit to 3-5 reference images for standard models
2. Use Pro model for up to 14 references
3. Collage multiple style refs into single image
4. Provide clear textual descriptions of how to blend styles

---

## Related References

**Current**: Image Generation

**Related Capabilities**:
- [Image Understanding](./vision-understanding.md) - Analyzing and editing reference images
- [Video Generation](./video-generation.md) - Creating animated video content
- [Audio Processing](./audio-processing.md) - Text-to-speech for multimedia

**Back to**: [AI Multimodal Skill](../SKILL.md)
