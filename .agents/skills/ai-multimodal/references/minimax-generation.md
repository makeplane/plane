# MiniMax Generation Reference

## Overview

MiniMax provides image, video (Hailuo), speech (TTS), and music generation APIs.
Base URL: `https://api.minimax.io/v1` | Auth: `Bearer {MINIMAX_API_KEY}`

## Image Generation

**Endpoint**: `POST /image_generation`
**Models**: `image-01` (standard), `image-01-live` (enhanced)
**Rate**: 10 RPM | **Cost**: ~$0.03/image

```json
{
  "model": "image-01",
  "prompt": "A girl looking into the distance",
  "aspect_ratio": "16:9",
  "n": 2,
  "response_format": "url",
  "prompt_optimizer": true,
  "subject_reference": [{"type": "character", "image_file": "url", "weight": 0.8}]
}
```

**Aspect ratios**: 1:1, 16:9, 4:3, 3:2, 2:3, 3:4, 9:16, 21:9
**Custom dims**: 512-2048px (divisible by 8)
**Batch**: 1-9 images per request

## Video Generation (Hailuo)

**Endpoints**: POST `/video_generation` → GET `/query/video_generation` → GET `/files/retrieve`
**Async workflow**: Submit task → poll every 10s → download file (URL valid 9h)

### Models
| Model | Features | Resolution |
|-------|----------|-----------|
| `MiniMax-Hailuo-2.3` | Text/image-to-video | 720p/1080p |
| `MiniMax-Hailuo-2.3-Fast` | Same, 50% faster+cheaper | 720p/1080p |
| `MiniMax-Hailuo-02` | First+last frame mode | 720p |
| `S2V-01` | Subject reference | 720p |

**Rate**: 5 RPM | **Cost**: $0.25 (6s/768p), $0.52 (10s/768p)

```json
// Text-to-video
{"prompt": "A dancer", "model": "MiniMax-Hailuo-2.3", "duration": 6, "resolution": "1080P"}

// Image-to-video
{"prompt": "Scene desc", "first_frame_image": "url", "model": "MiniMax-Hailuo-2.3", "duration": 6}

// First+last frame
{"prompt": "Transition", "first_frame_image": "url", "last_frame_image": "url", "model": "MiniMax-Hailuo-02"}

// Subject reference
{"prompt": "Scene with character", "subject_reference": [{"type": "character", "image": ["url"]}], "model": "S2V-01"}
```

## Speech/TTS

**Endpoint**: `POST /speech/speech_t2a_input`
**Models**: `speech-2.8-hd` (best), `speech-2.8-turbo` (fast), `speech-2.6-hd/turbo`, `speech-02-hd/turbo`
**Rate**: 60 RPM | **Cost**: $30-50/1M chars

```json
{
  "model": "speech-2.8-hd",
  "text": "Your text here",
  "voice": "English_Warm_Bestie",
  "emotion": "happy",
  "rate": 1.0,
  "volume": 1.0,
  "pitch": 1.0,
  "output_format": "mp3"
}
```

**Voices**: 300+ system voices, 40+ languages
**Emotions**: happy, sad, angry, fearful, disgusted, surprised, neutral
**Formats**: mp3, wav, pcm, flac
**Text limit**: 10,000 chars

### Voice Cloning
```json
POST /voice_clone
{"audio_url": "https://sample.wav", "clone_name": "my_voice"}
```
Requires 10+ seconds of reference audio. Rate: 60 RPM.

## Music Generation

**Endpoint**: `POST /music_generation`
**Models**: `music-2.5` (latest, vocals+accompaniment, 4min songs)
**Rate**: 120 RPM | **Cost**: $0.03-0.075/generation

```json
{
  "model": "music-2.5",
  "lyrics": "Verse 1\nLine one\n\n[Chorus]\nChorus line",
  "prompt": "Upbeat pop with electronic elements",
  "output_format": "url",
  "audio_setting": {"sample_rate": 44100, "bitrate": 128000, "format": "mp3"}
}
```

**Lyrics**: 1-3500 chars, supports structure tags ([Verse], [Chorus], etc.)
**Prompt**: 0-2000 chars, style/mood description
**Sample rates**: 16000, 24000, 32000, 44100 Hz
**Bitrates**: 32000, 64000, 128000, 256000 bps

## Error Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1002 | Rate limit exceeded |
| 1008 | Insufficient balance |
| 2013 | Invalid parameters |

## CLI Examples

```bash
# Image
python minimax_cli.py --task generate --prompt "A cyberpunk city" --model image-01 --aspect-ratio 16:9

# Video
python minimax_cli.py --task generate-video --prompt "A dancer" --model MiniMax-Hailuo-2.3 --duration 6

# Speech
python minimax_cli.py --task generate-speech --text "Hello world" --model speech-2.8-hd --voice English_Warm_Bestie --emotion happy

# Music
python minimax_cli.py --task generate-music --lyrics "La la la\nOh yeah" --prompt "upbeat pop" --model music-2.5
```

## References

- [API Overview](https://platform.minimax.io/docs/api-reference/api-overview)
- [Video Guide](https://platform.minimax.io/docs/guides/video-generation)
- [Speech API](https://platform.minimax.io/docs/api-reference/speech-t2a-intro)
- [Music API](https://platform.minimax.io/docs/api-reference/music-generation)
