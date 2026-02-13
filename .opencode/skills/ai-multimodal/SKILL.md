---
name: ai-multimodal
description: Analyze images/audio/video with Gemini API (better vision than Claude). Generate images (Imagen 4), videos (Veo 3). Use for vision analysis, transcription, OCR, design extraction, multimodal AI.
license: MIT
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# AI Multimodal

Process audio, images, videos, documents, and generate images/videos using Google Gemini's multimodal API.

## Setup

```bash
export GEMINI_API_KEY="your-key"  # Get from https://aistudio.google.com/apikey
pip install google-genai python-dotenv pillow
```

### API Key Rotation (Optional)

For high-volume usage or when hitting rate limits, configure multiple API keys:

```bash
# Primary key (required)
export GEMINI_API_KEY="key1"

# Additional keys for rotation (optional)
export GEMINI_API_KEY_2="key2"
export GEMINI_API_KEY_3="key3"
```

Or in your `.env` file:
```
GEMINI_API_KEY=key1
GEMINI_API_KEY_2=key2
GEMINI_API_KEY_3=key3
```

**Features:**
- Auto-rotates on rate limit (429/RESOURCE_EXHAUSTED) errors
- 60-second cooldown per key after rate limit
- Logs rotation events with `--verbose` flag
- Backward compatible: single key still works

## Quick Start

**Verify setup**: `python scripts/check_setup.py`
**Analyze media**: `python scripts/gemini_batch_process.py --files <file> --task <analyze|transcribe|extract>`
  - TIP: When you're asked to analyze an image, check if `gemini` command is available, then use `echo "<prompt to analyze image>" | gemini -y -m <gemini.model>` command (read model from `.opencode/.ck.json`: `gemini.model`). If `gemini` command is not available, use `python scripts/gemini_batch_process.py --files <file> --task analyze` command.
**Generate content**: `python scripts/gemini_batch_process.py --task <generate|generate-video> --prompt "description"`

> **Stdin support**: You can pipe files directly via stdin (auto-detects PNG/JPG/PDF/WAV/MP3).
> - `cat image.png | python scripts/gemini_batch_process.py --task analyze --prompt "Describe this"`
> - `python scripts/gemini_batch_process.py --files image.png --task analyze` (traditional)

## Models

- **Image generation**: `imagen-4.0-generate-001` (standard), `imagen-4.0-ultra-generate-001` (quality), `imagen-4.0-fast-generate-001` (speed)
- **Video generation**: `veo-3.1-generate-preview` (8s clips with audio)
- **Analysis**: `gemini-2.5-flash` (recommended), `gemini-2.5-pro` (advanced)

## Scripts

- **`gemini_batch_process.py`**: CLI orchestrator for `transcribe|analyze|extract|generate|generate-video` that auto-resolves API keys, picks sensible default models per task, streams files inline vs File API, and saves structured outputs (text/JSON/CSV/markdown plus generated assets) for Imagen 4 + Veo workflows.
- **`media_optimizer.py`**: ffmpeg/Pillow-based preflight tool that compresses/resizes/converts audio, image, and video inputs, enforces target sizes/bitrates, splits long clips into hour chunks, and batch-processes directories so media stays within Gemini limits.
- **`document_converter.py`**: Gemini-powered converter that uploads PDFs/images/Office docs, applies a markdown-preserving prompt, batches multiple files, auto-names outputs under `docs/assets`, and exposes CLI flags for model, prompt, auto-file naming, and verbose logging.
- **`check_setup.py`**: Interactive readiness checker that verifies directory layout, centralized env resolver, required Python deps, and GEMINI_API_KEY availability/format, then performs a live Gemini API call and prints remediation instructions if anything fails.

Use `--help` for options.

## References

Load for detailed guidance:

| Topic | File | Description |
|-------|------|-------------|
| Music | `references/music-generation.md` | Lyria RealTime API for background music generation, style prompts, real-time control, integration with video production. |
| Audio | `references/audio-processing.md` | Audio formats and limits, transcription (timestamps, speakers, segments), non-speech analysis, File API vs inline input, TTS models, best practices, cost and token math, and concrete meeting/podcast/interview recipes. |
| Images | `references/vision-understanding.md` | Vision capabilities overview, supported formats and models, captioning/classification/VQA, detection and segmentation, OCR and document reading, multi-image workflows, structured JSON output, token costs, best practices, and common product/screenshot/chart/scene use cases. |
| Image Gen | `references/image-generation.md` | Imagen 4 and Gemini image model overview, generate_images vs generate_content APIs, aspect ratios and costs, text/image/both modalities, editing and composition, style and quality control, safety settings, best practices, troubleshooting, and common marketing/concept-art/UI scenarios. |
| Video | `references/video-analysis.md` | Video analysis capabilities and supported formats, model/context choices, local/inline/YouTube inputs, clipping and FPS control, multi-video comparison, temporal Q&A and scene detection, transcription with visual context, token and cost guidance, and optimization/best-practice patterns. |
| Video Gen | `references/video-generation.md` | Veo model matrix, text-to-video and image-to-video quick start, multi-reference and extension flows, camera and timing control, configuration (resolution, aspect, audio, safety), prompt design patterns, performance tips, limitations, troubleshooting, and cost estimates. |

## Limits

**Formats**: Audio (WAV/MP3/AAC, 9.5h), Images (PNG/JPEG/WEBP, 3.6k), Video (MP4/MOV, 6h), PDF (1k pages)
**Size**: 20MB inline, 2GB File API
**Important:** 
- If you are going to generate a transcript of the audio, and the audio length is longer than 15 minutes, the transcript often gets truncated due to output token limits in the Gemini API response. To get the full transcript, you need to split the audio into smaller chunks (max 15 minutes per chunk) and transcribe each segment for a complete transcript.
- If you are going to generate a transcript of the video and the video length is longer than 15 minutes, use ffmpeg to extract the audio from the video, truncate the audio to 15 minutes, transcribe all audio segments, and then combine the transcripts into a single transcript.
**Transcription Output Requirements:**
- Format: Markdown
- Metadata: Duration, file size, generated date, description, file name, topics covered, etc.
- Parts: from-to (e.g., 00:00-00:15), audio chunk name, transcript, status, etc.
- Transcript format: 
  ```
  [HH:MM:SS -> HH:MM:SS] transcript content
  [HH:MM:SS -> HH:MM:SS] transcript content
  ...
  ```

## Resources

- [API Docs](https://ai.google.dev/gemini-api/docs/)
- [Pricing](https://ai.google.dev/pricing)
