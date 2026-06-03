#!/usr/bin/env python3
"""
OpenRouter image generation helpers.

Uses OpenRouter's chat completions API for image generation-capable models.
Docs:
- https://openrouter.ai/docs/guides/overview/multimodal/image-generation
- https://openrouter.ai/docs/guides/routing/model-fallbacks
"""

from __future__ import annotations

import base64
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    requests = None
    REQUESTS_AVAILABLE = False

from minimax_api_client import get_output_dir

CLAUDE_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(CLAUDE_ROOT / "scripts"))
try:
    from resolve_env import resolve_env
    CENTRALIZED_RESOLVER_AVAILABLE = True
except ImportError:
    CENTRALIZED_RESOLVER_AVAILABLE = False

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_OPENROUTER_MODEL = "google/gemini-3.1-flash-image-preview"


def is_openrouter_model(model: str) -> bool:
    """Heuristic for OpenRouter model ids."""
    return "/" in model and not model.startswith(("http://", "https://"))


def get_openrouter_default_model() -> str:
    """Return the OpenRouter default image model."""
    return os.getenv("OPENROUTER_IMAGE_MODEL", DEFAULT_OPENROUTER_MODEL)


def find_openrouter_api_key() -> Optional[str]:
    """Find OPENROUTER_API_KEY using centralized resolver or environment."""
    if CENTRALIZED_RESOLVER_AVAILABLE:
        return resolve_env("OPENROUTER_API_KEY", skill="ai-multimodal")
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        return api_key
    try:
        from dotenv import load_dotenv

        skill_dir = Path(__file__).parent.parent
        for env_path in [skill_dir / ".env", skill_dir.parent / ".env"]:
            if env_path.exists():
                load_dotenv(env_path, override=True)
        return os.getenv("OPENROUTER_API_KEY")
    except ImportError:
        return None


def _get_headers(api_key: str) -> Dict[str, str]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    referer = os.getenv("OPENROUTER_SITE_URL")
    title = os.getenv("OPENROUTER_APP_NAME", "ClaudeKit Engineer")
    if referer:
        headers["HTTP-Referer"] = referer
    if title:
        headers["X-Title"] = title
    return headers


def _build_payload(
    prompt: str,
    model: str,
    aspect_ratio: str,
    image_size: Optional[str],
    fallback_models: Optional[List[str]],
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"] if "gemini" in model else ["image"],
        "image_config": {"aspect_ratio": aspect_ratio},
    }
    if fallback_models:
        payload["models"] = [model, *fallback_models]
    else:
        payload["model"] = model
    if image_size:
        payload["image_config"]["image_size"] = image_size
    return payload


def _extract_image_bytes(image_url: str) -> bytes:
    if not REQUESTS_AVAILABLE:
        raise RuntimeError("requests package not installed. Install with: pip install requests")
    if image_url.startswith("data:"):
        _, encoded = image_url.split(",", 1)
        return base64.b64decode(encoded)
    response = requests.get(image_url, timeout=120)
    response.raise_for_status()
    return response.content


def _save_images(image_urls: List[str], output: Optional[str], verbose: bool) -> List[str]:
    output_dir = get_output_dir()
    saved_files: List[str] = []
    for index, image_url in enumerate(image_urls):
        file_path = output_dir / f"openrouter_image_{int(time.time())}_{index}.png"
        with open(file_path, "wb") as file:
            file.write(_extract_image_bytes(image_url))
        saved_files.append(str(file_path))
        if verbose:
            print(f"  Saved: {file_path}")

    if output and saved_files:
        target = Path(output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(Path(saved_files[0]).read_bytes())

    return saved_files


def generate_image(
    prompt: str,
    model: str,
    aspect_ratio: str = "1:1",
    image_size: Optional[str] = None,
    num_images: int = 1,
    output: Optional[str] = None,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Generate one or more images with OpenRouter."""
    if not REQUESTS_AVAILABLE:
        return {"status": "error", "error": "requests package not installed. Install with: pip install requests"}
    api_key = find_openrouter_api_key()
    if not api_key:
        return {"status": "error", "error": "OPENROUTER_API_KEY not found"}

    fallback_models = [
        item.strip()
        for item in os.getenv("OPENROUTER_FALLBACK_MODELS", "").split(",")
        if item.strip()
    ]

    try:
        image_urls: List[str] = []
        used_model = model
        for _ in range(max(1, num_images)):
            payload = _build_payload(
                prompt=prompt,
                model=model,
                aspect_ratio=aspect_ratio,
                image_size=image_size,
                fallback_models=fallback_models,
            )
            if verbose:
                print(f"  OpenRouter model: {model}")
                if fallback_models:
                    print(f"  Fallbacks: {', '.join(fallback_models)}")
            response = requests.post(
                OPENROUTER_API_URL,
                headers=_get_headers(api_key),
                json=payload,
                timeout=240,
            )
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                return {"status": "error", "error": f"No choices in response: {data}"}
            message = choices[0].get("message", {})
            message_images = message.get("images", [])
            if not message_images:
                return {"status": "error", "error": f"No images in response: {data}"}
            image_urls.extend(
                image["image_url"]["url"]
                for image in message_images
                if image.get("image_url", {}).get("url")
            )
            used_model = data.get("model", used_model)
            if len(image_urls) >= num_images:
                break

        saved_files = _save_images(image_urls[: max(1, num_images)], output, verbose)
        return {
            "status": "success",
            "generated_images": saved_files,
            "model": used_model,
        }
    except Exception as error:
        return {"status": "error", "error": str(error)}
