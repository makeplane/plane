# Vision Understanding Reference

Comprehensive guide for image analysis, object detection, and visual understanding using Gemini API.

## Core Capabilities

- **Captioning**: Generate descriptive text for images
- **Classification**: Categorize and identify content
- **Visual Q&A**: Answer questions about images
- **Object Detection**: Locate objects with bounding boxes (2.0+)
- **Segmentation**: Create pixel-level masks (2.5+)
- **Multi-image**: Compare up to 3,600 images
- **OCR**: Extract text from images
- **Document Understanding**: Process PDFs with vision

## Supported Formats

- **Images**: PNG, JPEG, WEBP, HEIC, HEIF
- **Documents**: PDF (up to 1,000 pages)
- **Size Limits**:
  - Inline: 20MB max total request
  - File API: 2GB per file
  - Max images: 3,600 per request

## Model Selection

### Gemini 2.5 Series
- **gemini-2.5-pro**: Best quality, segmentation + detection
- **gemini-2.5-flash**: Fast, efficient, all features
- **gemini-2.5-flash-lite**: Lightweight, all features

### Feature Requirements
- **Segmentation**: Requires 2.5+ models
- **Object Detection**: Requires 2.0+ models
- **Multi-image**: All models (up to 3,600 images)

## Basic Image Analysis

### Image Captioning

```python
from google import genai
import os

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Local file
with open('image.jpg', 'rb') as f:
    img_bytes = f.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Describe this image in detail',
        genai.types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg')
    ]
)
print(response.text)
```

### Image Classification

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Classify this image. Provide category and confidence level.',
        img_part
    ]
)
```

### Visual Question Answering

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'How many people are in this image and what are they doing?',
        img_part
    ]
)
```

## Advanced Features

### Object Detection (2.5+)

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Detect all objects in this image and provide bounding boxes',
        img_part
    ]
)

# Returns bounding box coordinates: [ymin, xmin, ymax, xmax]
# Normalized to [0, 1000] range
```

### Segmentation (2.5+)

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Create a segmentation mask for all people in this image',
        img_part
    ]
)

# Returns pixel-level masks for requested objects
```

### Multi-Image Comparison

```python
import PIL.Image

img1 = PIL.Image.open('photo1.jpg')
img2 = PIL.Image.open('photo2.jpg')

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Compare these two images. What are the differences?',
        img1,
        img2
    ]
)
```

### OCR and Text Extraction

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Extract all visible text from this image',
        img_part
    ]
)
```

## Input Methods

### Inline Data (<20MB)

```python
from google.genai import types

# From file
with open('image.jpg', 'rb') as f:
    img_bytes = f.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Analyze this image',
        types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg')
    ]
)
```

### PIL Image

```python
import PIL.Image

img = PIL.Image.open('photo.jpg')

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['What is in this image?', img]
)
```

### File API (>20MB or Reuse)

```python
# Upload once
myfile = client.files.upload(file='large-image.jpg')

# Use multiple times
response1 = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Describe this image', myfile]
)

response2 = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['What colors dominate this image?', myfile]
)
```

### URL (Public Images)

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Analyze this image',
        types.Part.from_uri(
            uri='https://example.com/image.jpg',
            mime_type='image/jpeg'
        )
    ]
)
```

## Token Calculation

Images consume tokens based on size:

**Small images** (≤384px both dimensions): 258 tokens

**Large images**: Tiled into 768×768 chunks, 258 tokens each

**Formula**:
```
crop_unit = floor(min(width, height) / 1.5)
tiles = (width / crop_unit) × (height / crop_unit)
total_tokens = tiles × 258
```

**Examples**:
- 256×256: 258 tokens (small)
- 512×512: 258 tokens (small)
- 960×540: 6 tiles = 1,548 tokens
- 1920×1080: 6 tiles = 1,548 tokens
- 3840×2160 (4K): 24 tiles = 6,192 tokens

## Structured Output

### JSON Schema Output

```python
from pydantic import BaseModel
from typing import List

class ObjectDetection(BaseModel):
    object_name: str
    confidence: float
    bounding_box: List[int]  # [ymin, xmin, ymax, xmax]

class ImageAnalysis(BaseModel):
    description: str
    objects: List[ObjectDetection]
    scene_type: str

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Analyze this image', img_part],
    config=genai.types.GenerateContentConfig(
        response_mime_type='application/json',
        response_schema=ImageAnalysis
    )
)

result = ImageAnalysis.model_validate_json(response.text)
```

## Multi-Image Analysis

### Batch Processing

```python
images = [
    PIL.Image.open(f'image{i}.jpg')
    for i in range(10)
]

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Analyze these images and find common themes'] + images
)
```

### Image Comparison

```python
before = PIL.Image.open('before.jpg')
after = PIL.Image.open('after.jpg')

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Compare before and after. List all visible changes.',
        before,
        after
    ]
)
```

### Visual Search

```python
reference = PIL.Image.open('target.jpg')
candidates = [PIL.Image.open(f'option{i}.jpg') for i in range(5)]

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Find which candidate images contain objects similar to the reference',
        reference
    ] + candidates
)
```

## Best Practices

### Image Quality

1. **Resolution**: Use clear, non-blurry images
2. **Rotation**: Verify correct orientation
3. **Lighting**: Ensure good contrast and lighting
4. **Size optimization**: Balance quality vs token cost
5. **Format**: JPEG for photos, PNG for graphics

### Prompt Engineering

**Specific instructions**:
- "Identify all vehicles with their colors and positions"
- "Count people wearing blue shirts"
- "Extract text from the sign in the top-left corner"

**Output format**:
- "Return results as JSON with fields: category, count, description"
- "Format as markdown table"
- "List findings as numbered items"

**Few-shot examples**:
```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Example: For an image of a cat on a sofa, respond: "Object: cat, Location: sofa"',
        'Now analyze this image:',
        img_part
    ]
)
```

### File Management

1. Use File API for images >20MB
2. Use File API for repeated queries (saves tokens)
3. Files auto-delete after 48 hours
4. Clean up manually:
   ```python
   client.files.delete(name=myfile.name)
   ```

### Cost Optimization

**Token-efficient strategies**:
- Resize large images before upload
- Use File API for repeated queries
- Batch multiple images when related
- Use appropriate model (Flash vs Pro)

**Token costs** (Gemini 2.5 Flash at $1/1M):
- Small image (258 tokens): $0.000258
- HD image (1,548 tokens): $0.001548
- 4K image (6,192 tokens): $0.006192

## Common Use Cases

### 1. Product Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Analyze this product image:
        1. Identify the product
        2. List visible features
        3. Assess condition
        4. Estimate value range
        ''',
        img_part
    ]
)
```

### 2. Screenshot Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Extract all text and UI elements from this screenshot',
        img_part
    ]
)
```

### 3. Medical Imaging (Informational Only)

```python
response = client.models.generate_content(
    model='gemini-2.5-pro',
    contents=[
        'Describe visible features in this medical image. Note: This is for informational purposes only.',
        img_part
    ]
)
```

### 4. Chart/Graph Reading

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Extract data from this chart and format as JSON',
        img_part
    ]
)
```

### 5. Scene Understanding

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Analyze this scene:
        1. Location type
        2. Time of day
        3. Weather conditions
        4. Activities happening
        5. Mood/atmosphere
        ''',
        img_part
    ]
)
```

## Error Handling

```python
import time

def analyze_image_with_retry(image_path, prompt, max_retries=3):
    """Analyze image with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            with open(image_path, 'rb') as f:
                img_bytes = f.read()

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt,
                    genai.types.Part.from_bytes(
                        data=img_bytes,
                        mime_type='image/jpeg'
                    )
                ]
            )
            return response.text
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"Retry {attempt + 1} after {wait_time}s: {e}")
            time.sleep(wait_time)
```

## Limitations

- Maximum 3,600 images per request
- OCR accuracy varies with text quality
- Object detection requires 2.0+ models
- Segmentation requires 2.5+ models
- No video frame extraction (use video API)
- Regional restrictions on child images (EEA, CH, UK)

---

## Related References

**Current**: Image Understanding

**Related Capabilities**:
- [Image Generation](./image-generation.md) - Create and edit images
- [Video Analysis](./video-analysis.md) - Analyze video frames
- [Video Generation](./video-generation.md) - Reference images for video generation

**Back to**: [AI Multimodal Skill](../SKILL.md)
