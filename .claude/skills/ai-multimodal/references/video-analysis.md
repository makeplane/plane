# Video Analysis Reference

Comprehensive guide for video understanding, temporal analysis, and YouTube processing using Gemini API.

> **Note**: This guide covers video *analysis* (understanding existing videos). For video *generation* (creating new videos), see [Video Generation Reference](./video-generation.md).

## Core Capabilities

- **Video Summarization**: Create concise summaries
- **Question Answering**: Answer specific questions about content
- **Transcription**: Audio transcription with visual descriptions
- **Timestamp References**: Query specific moments (MM:SS format)
- **Video Clipping**: Process specific segments
- **Scene Detection**: Identify scene changes and transitions
- **Multiple Videos**: Compare up to 10 videos (2.5+)
- **YouTube Support**: Analyze YouTube videos directly
- **Custom Frame Rate**: Adjust FPS sampling

## Supported Formats

- MP4, MPEG, MOV, AVI, FLV, MPG, WebM, WMV, 3GPP

## Model Selection

### Gemini 3 Series (Latest)
- **gemini-3-pro-preview**: Latest, agentic workflows, 1M context, dynamic thinking

### Gemini 2.5 Series (Recommended)
- **gemini-2.5-pro**: Best quality, 1M-2M context
- **gemini-2.5-flash**: Balanced, 1M-2M context (recommended)

### Context Windows
- **2M token models**: ~2 hours (default) or ~6 hours (low-res)
- **1M token models**: ~1 hour (default) or ~3 hours (low-res)

## Basic Video Analysis

### Local Video

```python
from google import genai
import os

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Upload video (File API for >20MB)
myfile = client.files.upload(file='video.mp4')

# Wait for processing
import time
while myfile.state.name == 'PROCESSING':
    time.sleep(1)
    myfile = client.files.get(name=myfile.name)

if myfile.state.name == 'FAILED':
    raise ValueError('Video processing failed')

# Analyze
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Summarize this video in 3 key points', myfile]
)
print(response.text)
```

### YouTube Video

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Summarize the main topics discussed',
        types.Part.from_uri(
            uri='https://www.youtube.com/watch?v=VIDEO_ID',
            mime_type='video/mp4'
        )
    ]
)
```

### Inline Video (<20MB)

```python
with open('short-clip.mp4', 'rb') as f:
    video_bytes = f.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'What happens in this video?',
        types.Part.from_bytes(data=video_bytes, mime_type='video/mp4')
    ]
)
```

## Advanced Features

### Video Clipping

```python
# Analyze specific time range
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Summarize this segment',
        types.Part.from_video_metadata(
            file_uri=myfile.uri,
            start_offset='40s',
            end_offset='80s'
        )
    ]
)
```

### Custom Frame Rate

```python
# Lower FPS for static content (saves tokens)
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Analyze this presentation',
        types.Part.from_video_metadata(
            file_uri=myfile.uri,
            fps=0.5  # Sample every 2 seconds
        )
    ]
)

# Higher FPS for fast-moving content
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Analyze rapid movements in this sports video',
        types.Part.from_video_metadata(
            file_uri=myfile.uri,
            fps=5  # Sample 5 times per second
        )
    ]
)
```

### Multiple Videos (2.5+)

```python
video1 = client.files.upload(file='demo1.mp4')
video2 = client.files.upload(file='demo2.mp4')

# Wait for processing
for video in [video1, video2]:
    while video.state.name == 'PROCESSING':
        time.sleep(1)
        video = client.files.get(name=video.name)

response = client.models.generate_content(
    model='gemini-2.5-pro',
    contents=[
        'Compare these two product demos. Which explains features better?',
        video1,
        video2
    ]
)
```

## Temporal Understanding

### Timestamp-Based Questions

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'What happens at 01:15 and how does it relate to 02:30?',
        myfile
    ]
)
```

### Timeline Creation

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Create a timeline with timestamps:
        - Key events
        - Scene changes
        - Important moments
        Format: MM:SS - Description
        ''',
        myfile
    ]
)
```

### Scene Detection

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Identify all scene changes with timestamps and describe each scene',
        myfile
    ]
)
```

## Transcription

### Basic Transcription

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Transcribe the audio from this video',
        myfile
    ]
)
```

### With Visual Descriptions

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Transcribe with visual context:
        - Audio transcription
        - Visual descriptions of important moments
        - Timestamps for salient events
        ''',
        myfile
    ]
)
```

### Speaker Identification

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Transcribe with speaker labels and timestamps',
        myfile
    ]
)
```

## Common Use Cases

### 1. Video Summarization

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Summarize this video:
        1. Main topic and purpose
        2. Key points with timestamps
        3. Conclusion or call-to-action
        ''',
        myfile
    ]
)
```

### 2. Educational Content

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Create educational materials:
        1. List key concepts taught
        2. Create 5 quiz questions with answers
        3. Provide timestamp for each concept
        ''',
        myfile
    ]
)
```

### 3. Action Detection

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'List all actions performed in this tutorial with timestamps',
        myfile
    ]
)
```

### 4. Content Moderation

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Review video content:
        1. Identify any problematic content
        2. Note timestamps of concerns
        3. Provide content rating recommendation
        ''',
        myfile
    ]
)
```

### 5. Interview Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Analyze interview:
        1. Questions asked (timestamps)
        2. Key responses
        3. Candidate body language and demeanor
        4. Overall assessment
        ''',
        myfile
    ]
)
```

### 6. Sports Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Analyze sports video:
        1. Key plays with timestamps
        2. Player movements and positioning
        3. Game strategy observations
        ''',
        types.Part.from_video_metadata(
            file_uri=myfile.uri,
            fps=5  # Higher FPS for fast action
        )
    ]
)
```

## YouTube Specific Features

### Public Video Requirements

- Video must be public (not private or unlisted)
- No age-restricted content
- Valid video ID required

### Usage Example

```python
# YouTube URL
youtube_uri = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Create chapter markers with timestamps',
        types.Part.from_uri(uri=youtube_uri, mime_type='video/mp4')
    ]
)
```

### Rate Limits

- **Free tier**: 8 hours of YouTube video per day
- **Paid tier**: No length-based limits
- Public videos only

## Token Calculation

Video tokens depend on resolution and FPS:

**Default resolution** (~300 tokens/second):
- 1 minute = 18,000 tokens
- 10 minutes = 180,000 tokens
- 1 hour = 1,080,000 tokens

**Low resolution** (~100 tokens/second):
- 1 minute = 6,000 tokens
- 10 minutes = 60,000 tokens
- 1 hour = 360,000 tokens

**Context windows**:
- 2M tokens ≈ 2 hours (default) or 6 hours (low-res)
- 1M tokens ≈ 1 hour (default) or 3 hours (low-res)

## Best Practices

### File Management

1. Use File API for videos >20MB (most videos)
2. Wait for ACTIVE state before analysis
3. Files auto-delete after 48 hours
4. Clean up manually:
   ```python
   client.files.delete(name=myfile.name)
   ```

### Optimization Strategies

**Reduce token usage**:
- Process specific segments using start/end offsets
- Use lower FPS for static content
- Use low-resolution mode for long videos
- Split very long videos into chunks

**Improve accuracy**:
- Provide context in prompts
- Use higher FPS for fast-moving content
- Use Pro model for complex analysis
- Be specific about what to extract

### Prompt Engineering

**Effective prompts**:
- "Summarize key points with timestamps in MM:SS format"
- "Identify all scene changes and describe each scene"
- "Extract action items mentioned with timestamps"
- "Compare these two videos on: X, Y, Z criteria"

**Structured output**:
```python
from pydantic import BaseModel
from typing import List

class VideoEvent(BaseModel):
    timestamp: str  # MM:SS format
    description: str
    category: str

class VideoAnalysis(BaseModel):
    summary: str
    events: List[VideoEvent]
    duration: str

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Analyze this video', myfile],
    config=genai.types.GenerateContentConfig(
        response_mime_type='application/json',
        response_schema=VideoAnalysis
    )
)
```

### Error Handling

```python
import time

def upload_and_process_video(file_path, max_wait=300):
    """Upload video and wait for processing"""
    myfile = client.files.upload(file=file_path)

    elapsed = 0
    while myfile.state.name == 'PROCESSING' and elapsed < max_wait:
        time.sleep(5)
        myfile = client.files.get(name=myfile.name)
        elapsed += 5

    if myfile.state.name == 'FAILED':
        raise ValueError(f'Video processing failed: {myfile.state.name}')

    if myfile.state.name == 'PROCESSING':
        raise TimeoutError(f'Processing timeout after {max_wait}s')

    return myfile
```

## Cost Optimization

**Token costs** (Gemini 2.5 Flash at $1/1M):
- 1 minute video (default): 18,000 tokens = $0.018
- 10 minute video: 180,000 tokens = $0.18
- 1 hour video: 1,080,000 tokens = $1.08

**Strategies**:
- Use video clipping for specific segments
- Lower FPS for static content
- Use low-resolution mode for long videos
- Batch related queries on same video
- Use context caching for repeated queries

## Limitations

- Maximum 6 hours (low-res) or 2 hours (default)
- YouTube videos must be public
- No live streaming analysis
- Files expire after 48 hours
- Processing time varies by video length
- No real-time processing
- Limited to 10 videos per request (2.5+)

---

## Related References

**Current**: Video Analysis

**Related Capabilities**:
- [Video Generation](./video-generation.md) - Creating videos from text/images
- [Audio Processing](./audio-processing.md) - Extract and analyze audio tracks
- [Image Understanding](./vision-understanding.md) - Analyze individual frames

**Back to**: [AI Multimodal Skill](../SKILL.md)
