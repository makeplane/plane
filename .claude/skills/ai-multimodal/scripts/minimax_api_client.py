#!/usr/bin/env python3
"""
MiniMax API client - shared HTTP utilities for all MiniMax generation tasks.

Handles authentication, API calls, async task polling, and file downloads.
Base URL: https://api.minimax.io/v1
Auth: Bearer token via MINIMAX_API_KEY environment variable.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    requests = None
    REQUESTS_AVAILABLE = False

# Import centralized environment resolver
CLAUDE_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(CLAUDE_ROOT / 'scripts'))
try:
    from resolve_env import resolve_env
    CENTRALIZED_RESOLVER_AVAILABLE = True
except ImportError:
    CENTRALIZED_RESOLVER_AVAILABLE = False

BASE_URL = "https://api.minimax.io/v1"


def find_minimax_api_key() -> Optional[str]:
    """Find MINIMAX_API_KEY using centralized resolver or environment."""
    if CENTRALIZED_RESOLVER_AVAILABLE:
        return resolve_env('MINIMAX_API_KEY', skill='ai-multimodal')

    # Fallback: check environment and .env files
    api_key = os.getenv('MINIMAX_API_KEY')
    if api_key:
        return api_key

    # Check .env files in skill directory hierarchy
    try:
        from dotenv import load_dotenv
        skill_dir = Path(__file__).parent.parent
        for env_path in [skill_dir / '.env', skill_dir.parent / '.env']:
            if env_path.exists():
                load_dotenv(env_path, override=True)
        api_key = os.getenv('MINIMAX_API_KEY')
        if api_key:
            return api_key
    except ImportError:
        pass

    return None


def get_headers(api_key: str) -> Dict[str, str]:
    """Build authorization headers for MiniMax API."""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }


def api_post(endpoint: str, payload: Dict[str, Any], api_key: str,
             verbose: bool = False, timeout: int = 120) -> Dict[str, Any]:
    """Make POST request to MiniMax API with error handling."""
    if not REQUESTS_AVAILABLE:
        raise RuntimeError("requests package not installed. Install with: pip install requests")
    url = f"{BASE_URL}/{endpoint}"
    headers = get_headers(api_key)

    if verbose:
        print(f"  POST {url}", file=sys.stderr)

    response = requests.post(url, headers=headers, json=payload, timeout=timeout)

    if response.status_code != 200:
        raise Exception(
            f"MiniMax API error (HTTP {response.status_code}): {response.text}"
        )

    data = response.json()

    # Check MiniMax-specific error codes
    base_resp = data.get("base_resp", {})
    status_code = base_resp.get("status_code", 0)
    if status_code != 0:
        raise Exception(
            f"MiniMax API error (code {status_code}): "
            f"{base_resp.get('status_msg', 'Unknown error')}"
        )

    return data


def api_get(endpoint: str, params: Dict[str, str], api_key: str,
            verbose: bool = False) -> Dict[str, Any]:
    """Make GET request to MiniMax API."""
    if not REQUESTS_AVAILABLE:
        raise RuntimeError("requests package not installed. Install with: pip install requests")
    url = f"{BASE_URL}/{endpoint}"
    headers = get_headers(api_key)

    if verbose:
        print(f"  GET {url}", file=sys.stderr)

    response = requests.get(url, headers=headers, params=params, timeout=60)

    if response.status_code != 200:
        raise Exception(
            f"MiniMax API error (HTTP {response.status_code}): {response.text}"
        )

    return response.json()


def poll_async_task(task_id: str, task_type: str, api_key: str,
                    poll_interval: int = 10, max_wait: int = 600,
                    verbose: bool = False) -> Dict[str, Any]:
    """Poll async task (video/music) until completion.

    Args:
        task_id: The task ID returned from creation endpoint
        task_type: 'video_generation' or 'music_generation'
        poll_interval: Seconds between polls (default 10)
        max_wait: Maximum wait time in seconds (default 600)
    """
    elapsed = 0
    while elapsed < max_wait:
        result = api_get(
            f"query/{task_type}",
            {"task_id": task_id},
            api_key,
            verbose=False
        )

        status = result.get("status", "Unknown")
        if verbose and elapsed > 0 and elapsed % 30 == 0:
            print(f"  Polling... {elapsed}s elapsed, status: {status}",
                  file=sys.stderr)

        if status == "Success":
            return result
        elif status in ("Failed", "Error"):
            raise Exception(f"Task failed: {json.dumps(result)}")

        time.sleep(poll_interval)
        elapsed += poll_interval

    raise TimeoutError(f"Task {task_id} timed out after {max_wait}s")


def download_file(file_id: str, api_key: str, output_path: str,
                  verbose: bool = False) -> str:
    """Download file from MiniMax file service."""
    if not REQUESTS_AVAILABLE:
        raise RuntimeError("requests package not installed. Install with: pip install requests")
    result = api_get("files/retrieve", {"file_id": file_id}, api_key, verbose)

    download_url = result.get("file", {}).get("download_url")
    if not download_url:
        raise Exception(f"No download URL in response: {json.dumps(result)}")

    if verbose:
        print(f"  Downloading to: {output_path}", file=sys.stderr)

    response = requests.get(download_url, stream=True, timeout=300)
    response.raise_for_status()

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return output_path


def get_output_dir() -> Path:
    """Get project output directory for generated assets."""
    script_dir = Path(__file__).parent
    for parent in [script_dir] + list(script_dir.parents):
        if (parent / '.git').exists() or (parent / '.claude').exists():
            output_dir = parent / 'docs' / 'assets'
            output_dir.mkdir(parents=True, exist_ok=True)
            return output_dir
    # Fallback
    output_dir = script_dir.parent / 'assets'
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir
