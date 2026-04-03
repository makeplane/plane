# Audio Processing Reference

Comprehensive guide for audio analysis and speech generation using Gemini API.

## Audio Understanding

### Supported Formats

| Format | MIME Type | Best Use |
|--------|-----------|----------|
| WAV | `audio/wav` | Uncompressed, highest quality |
| MP3 | `audio/mp3` | Compressed, widely compatible |
| AAC | `audio/aac` | Compressed, good quality |
| FLAC | `audio/flac` | Lossless compression |
| OGG Vorbis | `audio/ogg` | Open format |
| AIFF | `audio/aiff` | Apple format |

### Specifications

- **Maximum length**: 9.5 hours per request
- **Multiple files**: Unlimited count, combined max 9.5 hours
- **Token rate**: 32 tokens/second (1 minute = 1,920 tokens)
- **Processing**: Auto-downsampled to 16 Kbps mono
- **File size limits**:
  - Inline: 20 MB max total request
  - File API: 2 GB per file, 20 GB project quota
  - Retention: 48 hours auto-delete
- **Important:** if you are going to generate a transcript of the audio, and the audio length is longer than 15 minutes, the transcript often gets truncated due to output token limits in the Gemini API response. To get the full transcript, you need to split the audio into smaller chunks (max 15 minutes per chunk) and transcribe each segment for a complete transcript.

## Transcription

### Basic Transcription

```python
from google import genai
import os

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Upload audio
myfile = client.files.upload(file='meeting.mp3')

# Transcribe
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Generate a transcript of the speech.', myfile]
)
print(response.text)
```

### With Timestamps

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Generate transcript with timestamps in MM:SS format.', myfile]
)
```

### Multi-Speaker Identification

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Transcribe with speaker labels. Format: [Speaker 1], [Speaker 2], etc.', myfile]
)
```

### Segment-Specific Transcription

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Transcribe only the segment from 02:30 to 05:15.', myfile]
)
```

## Audio Analysis

### Summarization

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Summarize key points in 5 bullets with timestamps.', myfile]
)
```

### Non-Speech Audio Analysis

```python
# Music analysis
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Identify the musical instruments and genre.', myfile]
)

# Environmental sounds
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Identify all sounds: voices, music, ambient noise.', myfile]
)

# Birdsong identification
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Identify bird species based on their calls.', myfile]
)
```

### Timestamp-Based Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['What is discussed from 10:30 to 15:45? Provide key points.', myfile]
)
```

## Input Methods

### File Upload (>20MB or Reuse)

```python
# Upload once, use multiple times
myfile = client.files.upload(file='large-audio.mp3')

# First query
response1 = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Transcribe this', myfile]
)

# Second query (reuses same file)
response2 = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Summarize this', myfile]
)
```

### Inline Data (<20MB)

```python
from google.genai import types

with open('small-audio.mp3', 'rb') as f:
    audio_bytes = f.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Describe this audio',
        types.Part.from_bytes(data=audio_bytes, mime_type='audio/mp3')
    ]
)
```

## Speech Generation (TTS)

### Available Models

| Model | Quality | Speed | Cost/1M tokens |
|-------|---------|-------|----------------|
| `gemini-2.5-flash-native-audio-preview-09-2025` | High | Fast | $10 |
| `gemini-2.5-pro` TTS mode | Premium | Slower | $20 |

### Basic TTS

```python
response = client.models.generate_content(
    model='gemini-2.5-flash-native-audio-preview-09-2025',
    contents='Generate audio: Welcome to today\'s episode.'
)

# Save audio
with open('output.wav', 'wb') as f:
    f.write(response.audio_data)
```

### Controllable Voice Style

```python
# Professional tone
response = client.models.generate_content(
    model='gemini-2.5-flash-native-audio-preview-09-2025',
    contents='Generate audio in a professional, clear tone: Welcome to our quarterly earnings call.'
)

# Casual and friendly
response = client.models.generate_content(
    model='gemini-2.5-flash-native-audio-preview-09-2025',
    contents='Generate audio in a friendly, conversational tone: Hey there! Let\'s dive into today\'s topic.'
)

# Narrative style
response = client.models.generate_content(
    model='gemini-2.5-flash-native-audio-preview-09-2025',
    contents='Generate audio in a narrative, storytelling tone: Once upon a time, in a land far away...'
)
```

### Voice Control Parameters

- **Style**: Professional, casual, narrative, conversational
- **Pace**: Slow, normal, fast
- **Tone**: Friendly, serious, enthusiastic
- **Accent**: Natural language control (e.g., "British accent", "Southern drawl")

## Best Practices

### File Management

1. Use File API for files >20MB
2. Use File API for repeated queries (saves tokens)
3. Files auto-delete after 48 hours
4. Clean up manually when done:
   ```python
   client.files.delete(name=myfile.name)
   ```

### Prompt Engineering

**Effective prompts**:
- "Transcribe from 02:30 to 03:29 in MM:SS format"
- "Identify speakers and extract dialogue with timestamps"
- "Summarize key points with relevant timestamps"
- "Transcribe and analyze sentiment for each speaker"

**Context improves accuracy**:
- "This is a medical interview - use appropriate terminology"
- "Transcribe this legal deposition with precise terminology"
- "This is a technical podcast about machine learning"

**Combined tasks**:
- "Transcribe and summarize in bullet points"
- "Extract key quotes with timestamps and speaker labels"
- "Transcribe and identify action items with timestamps"

### Cost Optimization

**Token calculation**:
- 1 minute audio = 1,920 tokens
- 1 hour audio = 115,200 tokens
- 9.5 hours = 1,094,400 tokens

**Model selection**:
- Use `gemini-2.5-flash` ($1/1M tokens) for most tasks
- Upgrade to `gemini-2.5-pro` ($3/1M tokens) for complex analysis
- For high-volume: `gemini-1.5-flash` ($0.70/1M tokens)

**Reduce costs**:
- Process only relevant segments using timestamps
- Use lower-quality audio when possible
- Batch multiple short files in one request
- Cache context for repeated queries

### Error Handling

```python
import time

def transcribe_with_retry(file_path, max_retries=3):
    """Transcribe audio with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            myfile = client.files.upload(file=file_path)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=['Transcribe with timestamps', myfile]
            )
            return response.text
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"Retry {attempt + 1} after {wait_time}s")
            time.sleep(wait_time)
```

## Common Use Cases

### 1. Meeting Transcription

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Transcribe this meeting with:
        1. Speaker labels
        2. Timestamps for topic changes
        3. Action items highlighted
        ''',
        myfile
    ]
)
```

### 2. Podcast Summary

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Create podcast summary with:
        1. Main topics with timestamps
        2. Key quotes from each speaker
        3. Recommended episode highlights
        ''',
        myfile
    ]
)
```

### 3. Interview Analysis

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Analyze interview:
        1. Questions asked with timestamps
        2. Key responses from interviewee
        3. Overall sentiment and tone
        ''',
        myfile
    ]
)
```

### 4. Content Verification

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        '''Verify audio content:
        1. Check for specific keywords or phrases
        2. Identify any compliance issues
        3. Note any concerning statements with timestamps
        ''',
        myfile
    ]
)
```

### 5. Multilingual Transcription

```python
# Gemini auto-detects language
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Transcribe this audio and translate to English if needed.', myfile]
)
```

## Token Costs

**Audio Input** (32 tokens/second):
- 1 minute = 1,920 tokens
- 10 minutes = 19,200 tokens
- 1 hour = 115,200 tokens
- 9.5 hours = 1,094,400 tokens

**Example costs** (Gemini 2.5 Flash at $1/1M):
- 1 hour audio: 115,200 tokens = $0.12
- Full day podcast (8 hours): 921,600 tokens = $0.92

## Limitations

- Maximum 9.5 hours per request
- Auto-downsampled to 16 Kbps mono (quality loss)
- Files expire after 48 hours
- No real-time streaming support
- Non-speech audio less accurate than speech

---

## Related References

**Current**: Audio Processing

**Related Capabilities**:
- [Video Analysis](./video-analysis.md) - Extract audio from videos
- [Video Generation](./video-generation.md) - Generate videos with native audio
- [Image Understanding](./vision-understanding.md) - Analyze audio with visual context

**Back to**: [AI Multimodal Skill](../SKILL.md)
