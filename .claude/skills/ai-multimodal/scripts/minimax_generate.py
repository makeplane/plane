#!/usr/bin/env python3
"""
MiniMax generation CLI - image, video, speech, and music generation.

Models:
- Image: image-01, image-01-live
- Video: MiniMax-Hailuo-2.3, MiniMax-Hailuo-2.3-Fast, MiniMax-Hailuo-02, S2V-01
- Speech: speech-2.8-hd, speech-2.8-turbo, speech-2.6-hd, speech-2.6-turbo
- Music: music-2.5

Usage:
  python minimax_generate.py --task generate --prompt "A cat in space" --model image-01
  python minimax_generate.py --task generate-video --prompt "A dancer" --model MiniMax-Hailuo-2.3
  python minimax_generate.py --task generate-speech --text "Hello world" --model speech-2.8-hd
  python minimax_generate.py --task generate-music --lyrics "Verse 1..." --model music-2.5
"""

import argparse
import base64
import json
import shutil
import sys
import time
from pathlib import Path

from minimax_api_client import (
    find_minimax_api_key, api_post, poll_async_task,
    download_file, get_output_dir
)

# Model registries
MINIMAX_IMAGE_MODELS = {'image-01', 'image-01-live'}
MINIMAX_VIDEO_MODELS = {
    'MiniMax-Hailuo-2.3', 'MiniMax-Hailuo-2.3-Fast',
    'MiniMax-Hailuo-02', 'S2V-01'
}
MINIMAX_SPEECH_MODELS = {
    'speech-2.8-hd', 'speech-2.8-turbo',
    'speech-2.6-hd', 'speech-2.6-turbo',
    'speech-02-hd', 'speech-02-turbo'
}
MINIMAX_MUSIC_MODELS = {'music-2.5', 'music-2.0'}

ALL_MINIMAX_MODELS = (
    MINIMAX_IMAGE_MODELS | MINIMAX_VIDEO_MODELS |
    MINIMAX_SPEECH_MODELS | MINIMAX_MUSIC_MODELS
)


def is_minimax_model(model: str) -> bool:
    """Check if model is a MiniMax model."""
    return (
        model in ALL_MINIMAX_MODELS or
        model.startswith('MiniMax-') or
        model.startswith('image-01') or
        model.startswith('speech-') or
        model.startswith('music-') or
        model.startswith('S2V-')
    )


def generate_image(api_key: str, prompt: str, model: str = 'image-01',
                   aspect_ratio: str = '1:1', num_images: int = 1,
                   output: str = None, verbose: bool = False) -> dict:
    """Generate image using MiniMax image-01 model."""
    payload = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "n": min(num_images, 9),
        "response_format": "url",
        "prompt_optimizer": True
    }

    if verbose:
        print(f"Generating {num_images} image(s) with {model}...")

    result = api_post("image_generation", payload, api_key, verbose)

    # Download images
    image_urls = result.get("data", {}).get("image_urls", [])
    if not image_urls:
        return {"status": "error", "error": "No images in response"}

    output_dir = get_output_dir()
    saved_files = []
    import requests as req

    for i, url in enumerate(image_urls):
        ts = int(time.time())
        fname = f"minimax_image_{ts}_{i}.png"
        fpath = output_dir / fname

        resp = req.get(url, timeout=60)
        resp.raise_for_status()
        with open(fpath, 'wb') as f:
            f.write(resp.content)
        saved_files.append(str(fpath))

        if verbose:
            print(f"  Saved: {fpath}")

    # Copy first image to output if specified
    if output and saved_files:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(saved_files[0], output)

    return {"status": "success", "generated_images": saved_files, "model": model}


def generate_video(api_key: str, prompt: str, model: str = 'MiniMax-Hailuo-2.3',
                   duration: int = 6, resolution: str = '1080P',
                   first_frame: str = None, output: str = None,
                   verbose: bool = False) -> dict:
    """Generate video using MiniMax Hailuo models (async)."""
    payload = {
        "prompt": prompt,
        "model": model,
        "duration": duration,
        "resolution": resolution
    }
    if first_frame:
        payload["first_frame_image"] = first_frame

    if verbose:
        print(f"Submitting video generation with {model}...")

    result = api_post("video_generation", payload, api_key, verbose)
    task_id = result.get("task_id")
    if not task_id:
        return {"status": "error", "error": f"No task_id: {json.dumps(result)}"}

    if verbose:
        print(f"  Task ID: {task_id}, polling...")

    start = time.time()
    poll_result = poll_async_task(task_id, "video_generation", api_key,
                                  poll_interval=10, verbose=verbose)

    file_id = poll_result.get("file_id")
    if not file_id:
        return {"status": "error", "error": f"No file_id: {json.dumps(poll_result)}"}

    output_dir = get_output_dir()
    ts = int(time.time())
    output_path = str(output_dir / f"minimax_video_{ts}.mp4")
    download_file(file_id, api_key, output_path, verbose)

    elapsed = time.time() - start
    file_size = Path(output_path).stat().st_size / (1024 * 1024)

    if output:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output_path, output)

    if verbose:
        print(f"  Generated in {elapsed:.1f}s, size: {file_size:.2f} MB")

    return {
        "status": "success", "generated_video": output_path,
        "generation_time": elapsed, "file_size_mb": file_size, "model": model
    }


def generate_speech(api_key: str, text: str, model: str = 'speech-2.8-hd',
                    voice: str = 'English_expressive_narrator',
                    emotion: str = 'neutral', output_format: str = 'mp3',
                    rate: float = 1.0, output: str = None,
                    verbose: bool = False) -> dict:
    """Generate speech using MiniMax TTS v2 API."""
    payload = {
        "model": model,
        "text": text[:10000],
        "stream": False,
        "language_boost": "auto",
        "output_format": "hex",
        "voice_setting": {
            "voice_id": voice,
            "speed": rate,
            "vol": 1.0,
            "pitch": 0
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": output_format,
            "channel": 1
        }
    }

    if verbose:
        print(f"Generating speech with {model}, voice: {voice}...")

    result = api_post("t2a_v2", payload, api_key, verbose)

    audio_data = result.get("data", {}).get("audio")
    if not audio_data:
        return {"status": "error", "error": "No audio in response"}

    output_dir = get_output_dir()
    ts = int(time.time())
    ext = output_format if output_format in ('mp3', 'wav', 'flac') else 'mp3'
    output_path = str(output_dir / f"minimax_speech_{ts}.{ext}")

    # Audio returned as hex-encoded string from t2a_v2
    audio_bytes = bytes.fromhex(audio_data)
    with open(output_path, 'wb') as f:
        f.write(audio_bytes)

    if output:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output_path, output)

    if verbose:
        size_kb = len(audio_bytes) / 1024
        print(f"  Saved: {output_path} ({size_kb:.1f} KB)")

    return {"status": "success", "generated_audio": output_path, "model": model}


def generate_music(api_key: str, lyrics: str = '', prompt: str = '',
                   model: str = 'music-2.5', output_format: str = 'mp3',
                   output: str = None, verbose: bool = False) -> dict:
    """Generate music using MiniMax music models."""
    payload = {
        "model": model,
        "output_format": "url",
        "audio_setting": {
            "sample_rate": 44100,
            "bitrate": 128000,
            "format": output_format
        }
    }
    if lyrics:
        payload["lyrics"] = lyrics[:3500]
    if prompt:
        payload["prompt"] = prompt[:2000]

    if verbose:
        print(f"Generating music with {model}...")

    result = api_post("music_generation", payload, api_key, verbose, timeout=300)

    audio_data = result.get("data", {}).get("audio")
    extra = result.get("extra_info", {})
    duration_ms = extra.get("music_duration", 0)

    if not audio_data:
        return {"status": "error", "error": "No audio in response"}

    output_dir = get_output_dir()
    ts = int(time.time())
    output_path = str(output_dir / f"minimax_music_{ts}.{output_format}")

    # Download from URL or decode hex
    if audio_data.startswith("http"):
        import requests as req
        resp = req.get(audio_data, timeout=120)
        resp.raise_for_status()
        with open(output_path, 'wb') as f:
            f.write(resp.content)
    else:
        audio_bytes = bytes.fromhex(audio_data)
        with open(output_path, 'wb') as f:
            f.write(audio_bytes)

    if output:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output_path, output)

    if verbose:
        dur_s = duration_ms / 1000 if duration_ms else 0
        print(f"  Saved: {output_path} ({dur_s:.1f}s)")

    return {
        "status": "success", "generated_audio": output_path,
        "duration_ms": duration_ms, "model": model
    }
