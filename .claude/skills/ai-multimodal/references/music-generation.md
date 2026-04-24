# Music Generation Reference

Real-time music generation using Lyria RealTime via WebSocket API.

## Core Capabilities

- **Real-time streaming**: Bidirectional WebSocket for continuous generation
- **Dynamic control**: Modify music in real-time during generation
- **Style steering**: Genre, mood, instrumentation guidance
- **Audio output**: 48kHz stereo 16-bit PCM

## Model

**Lyria RealTime** (Experimental)
- WebSocket-based streaming
- Real-time parameter adjustment
- Instrumental only (no vocals)
- Watermarked output

## Quick Start

### Python

```python
from google import genai
import asyncio

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

async def generate_music():
    async with client.aio.live.music.connect() as session:
        # Set style prompts with weights (0.0-1.0)
        await session.set_weighted_prompts([
            {"prompt": "Upbeat corporate background music", "weight": 0.8},
            {"prompt": "Modern electronic elements", "weight": 0.5}
        ])

        # Configure generation parameters
        await session.set_music_generation_config(
            guidance=4.0,     # Prompt adherence (0.0-6.0)
            bpm=120,          # Tempo (60-200)
            density=0.6,      # Note density (0.0-1.0)
            brightness=0.5    # Tonal quality (0.0-1.0)
        )

        # Start playback and collect audio
        await session.play()

        audio_chunks = []
        async for chunk in session:
            audio_chunks.append(chunk.audio_data)

        return b''.join(audio_chunks)
```

### JavaScript

```javascript
const client = new GenaiClient({ apiKey: process.env.GEMINI_API_KEY });

async function generateMusic() {
    const session = await client.live.music.connect();

    await session.setWeightedPrompts([
        { prompt: "Calm ambient background", weight: 0.9 },
        { prompt: "Nature sounds influence", weight: 0.3 }
    ]);

    await session.setMusicGenerationConfig({
        guidance: 3.5,
        bpm: 80,
        density: 0.4,
        brightness: 0.6
    });

    session.onAudio((audioChunk) => {
        // Process 48kHz stereo PCM audio
        audioBuffer.push(audioChunk);
    });

    await session.play();
}
```

## Configuration Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `guidance` | 0.0-6.0 | 4.0 | Prompt adherence (higher = stricter) |
| `bpm` | 60-200 | 120 | Tempo in beats per minute |
| `density` | 0.0-1.0 | 0.5 | Note/sound density |
| `brightness` | 0.0-1.0 | 0.5 | Tonal quality (higher = brighter) |
| `scale` | 12 keys | C Major | Musical key |
| `mute_bass` | bool | false | Remove bass elements |
| `mute_drums` | bool | false | Remove drum elements |
| `mode` | enum | QUALITY | QUALITY, DIVERSITY, VOCALIZATION |
| `temperature` | 0.0-2.0 | 1.0 | Sampling randomness |
| `top_k` | int | 40 | Sampling top-k |
| `seed` | int | random | Reproducibility seed |

## Weighted Prompts

Control generation direction with weighted prompts:

```python
await session.set_weighted_prompts([
    {"prompt": "Main style description", "weight": 1.0},    # Primary
    {"prompt": "Secondary influence", "weight": 0.5},       # Supporting
    {"prompt": "Subtle element", "weight": 0.2}             # Accent
])
```

**Weight guidelines**:
- 0.8-1.0: Dominant influence
- 0.5-0.7: Secondary contribution
- 0.2-0.4: Subtle accent
- 0.0-0.1: Minimal effect

## Style Prompts by Use Case

### Corporate/Marketing

```python
prompts = [
    {"prompt": "Professional corporate background music, modern", "weight": 0.9},
    {"prompt": "Uplifting, optimistic mood", "weight": 0.6},
    {"prompt": "Clean production, minimal complexity", "weight": 0.5}
]
config = {"bpm": 100, "brightness": 0.6, "density": 0.5}
```

### Social Media/Short-form

```python
prompts = [
    {"prompt": "Trending pop electronic beat", "weight": 0.9},
    {"prompt": "Energetic, catchy rhythm", "weight": 0.7},
    {"prompt": "Bass-heavy, punchy", "weight": 0.5}
]
config = {"bpm": 128, "brightness": 0.7, "density": 0.7}
```

### Emotional/Cinematic

```python
prompts = [
    {"prompt": "Cinematic orchestral underscore", "weight": 0.9},
    {"prompt": "Emotional, inspiring", "weight": 0.7},
    {"prompt": "Building tension and release", "weight": 0.5}
]
config = {"bpm": 70, "brightness": 0.4, "density": 0.4}
```

### Ambient/Background

```python
prompts = [
    {"prompt": "Calm ambient soundscape", "weight": 0.9},
    {"prompt": "Minimal, atmospheric", "weight": 0.6},
    {"prompt": "Lo-fi textures", "weight": 0.4}
]
config = {"bpm": 80, "brightness": 0.4, "density": 0.3}
```

## Real-time Transitions

Smoothly transition between styles during generation:

```python
async def dynamic_music_generation():
    async with client.aio.live.music.connect() as session:
        # Start with intro style
        await session.set_weighted_prompts([
            {"prompt": "Soft ambient intro", "weight": 0.9}
        ])
        await session.play()

        # Collect intro (4 seconds)
        intro_chunks = []
        for _ in range(192):  # ~4 seconds at 48kHz
            chunk = await session.__anext__()
            intro_chunks.append(chunk.audio_data)

        # Transition to main section
        await session.set_weighted_prompts([
            {"prompt": "Building energy", "weight": 0.7},
            {"prompt": "Full beat drop", "weight": 0.5}
        ])

        # Continue with new style...
```

## Output Specifications

- **Format**: Raw 16-bit PCM
- **Sample Rate**: 48,000 Hz
- **Channels**: 2 (stereo)
- **Bit Depth**: 16 bits
- **Watermarking**: Always enabled (SynthID)

### Save to WAV

```python
import wave

def save_pcm_to_wav(pcm_data, filename):
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(2)        # Stereo
        wav_file.setsampwidth(2)        # 16-bit
        wav_file.setframerate(48000)    # 48kHz
        wav_file.writeframes(pcm_data)
```

### Convert to MP3

```bash
# Using FFmpeg
ffmpeg -f s16le -ar 48000 -ac 2 -i input.pcm output.mp3
```

## Integration with Video Production

### Generate Background Music for Video

```python
async def generate_video_background(duration_seconds, mood):
    """Generate background music matching video length"""

    # Configure for video background
    prompts = [
        {"prompt": f"{mood} background music for video", "weight": 0.9},
        {"prompt": "Non-distracting, supportive underscore", "weight": 0.6}
    ]

    async with client.aio.live.music.connect() as session:
        await session.set_weighted_prompts(prompts)
        await session.set_music_generation_config(
            guidance=4.0,
            density=0.4,  # Keep sparse for background
            brightness=0.5
        )
        await session.play()

        # Calculate chunks needed (48kHz stereo = 192000 bytes/second)
        total_chunks = duration_seconds * 48000 // 512  # Chunk size estimate

        audio_data = []
        async for i, chunk in enumerate(session):
            audio_data.append(chunk.audio_data)
            if i >= total_chunks:
                break

        return b''.join(audio_data)
```

### Sync with Storyboard Timing

```python
async def generate_scene_music(scenes):
    """Generate music with transitions matching scene changes"""

    all_audio = []

    async with client.aio.live.music.connect() as session:
        for scene in scenes:
            # Update style for each scene
            await session.set_weighted_prompts([
                {"prompt": scene['mood'], "weight": 0.9},
                {"prompt": scene['style'], "weight": 0.5}
            ])

            if scene['index'] == 0:
                await session.play()

            # Collect audio for scene duration
            chunks = int(scene['duration'] * 48000 / 512)
            for _ in range(chunks):
                chunk = await session.__anext__()
                all_audio.append(chunk.audio_data)

    return b''.join(all_audio)
```

## Limitations

- **Instrumental only**: No vocal/singing generation
- **WebSocket required**: Real-time streaming connection
- **Safety filtering**: Prompts undergo safety review
- **Watermarking**: All output contains SynthID watermark
- **Experimental**: API may change

## Best Practices

1. **Buffer audio**: Implement robust buffering for smooth playback
2. **Gradual transitions**: Avoid drastic prompt changes mid-stream
3. **Sparse for backgrounds**: Lower density for video backgrounds
4. **Test prompts**: Iterate on prompt combinations
5. **Cross-fade transitions**: Blend audio at style changes
6. **Match video mood**: Align music tempo/energy with visuals

## Resources

- [Lyria RealTime Docs](https://ai.google.dev/gemini-api/docs/music-generation)
- [Audio Processing Guide](./audio-processing.md)
- [Video Generation](./video-generation.md)

---

**Related**: [Audio Processing](./audio-processing.md) | [Video Generation](./video-generation.md)

**Back to**: [AI Multimodal Skill](../SKILL.md)
