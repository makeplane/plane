#!/usr/bin/env python3
"""
Batch process multiple media files using Gemini API.

Supports all Gemini modalities:
- Audio: Transcription, analysis, summarization
- Image: Captioning, detection, OCR, analysis
- Video: Summarization, Q&A, scene detection
- Document: PDF extraction, structured output
- Generation: Image creation via Imagen 4 or Nano Banana (Gemini native)
  - Nano Banana Flash (gemini-2.5-flash-image): Speed/volume
  - Nano Banana Pro (gemini-3-pro-image-preview): Quality/4K text/reasoning
  - Imagen 4 (imagen-4.0-*): Production-grade generation
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import csv
import shutil

# Import centralized environment resolver (works for both local and global installs)
CLAUDE_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(CLAUDE_ROOT / 'scripts'))
try:
    from resolve_env import resolve_env
    CENTRALIZED_RESOLVER_AVAILABLE = True
except ImportError:
    # Fallback if centralized resolver not available
    CENTRALIZED_RESOLVER_AVAILABLE = False
    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None

# Import key rotation support
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'common'))
try:
    from api_key_rotator import KeyRotator, is_rate_limit_error
    from api_key_helper import find_all_api_keys
    KEY_ROTATION_AVAILABLE = True
except ImportError:
    KEY_ROTATION_AVAILABLE = False
    KeyRotator = None
    is_rate_limit_error = None
    find_all_api_keys = None

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed")
    print("Install with: pip install google-genai")
    sys.exit(1)


# Image generation model configuration
# Default: gemini-2.5-flash-image (Nano Banana Flash - fast, cost-effective)
# Alternative: imagen-4.0-generate-001 (production quality)
# All image generation requires billing - no completely free option exists
IMAGE_MODEL_DEFAULT = 'gemini-2.5-flash-image'  # Nano Banana Flash (~$1/1M tokens)
IMAGE_MODEL_FALLBACK = 'gemini-2.5-flash-image'  # Fallback if Imagen fails (billing)
IMAGEN_MODELS = {
    'imagen-4.0-generate-001',
    'imagen-4.0-ultra-generate-001',
    'imagen-4.0-fast-generate-001',
}
# Video models have no fallback - Veo always requires billing


def find_api_key() -> Optional[str]:
    """Find Gemini API key using centralized resolver or fallback.

    Uses ~/.claude/scripts/resolve_env.py for consistent resolution across all skills.
    Falls back to local resolution if centralized resolver not available.

    Priority order (highest to lowest):
    1. process.env (runtime environment variables)
    2. PROJECT/.claude/skills/ai-multimodal/.env (skill-specific)
    3. PROJECT/.claude/skills/.env (shared skills)
    4. PROJECT/.claude/.env (project global)
    5. ~/.claude/skills/ai-multimodal/.env (user skill-specific)
    6. ~/.claude/skills/.env (user shared)
    7. ~/.claude/.env (user global)
    """
    if CENTRALIZED_RESOLVER_AVAILABLE:
        # Use centralized resolver (recommended)
        return resolve_env('GEMINI_API_KEY', skill='ai-multimodal')

    # Fallback: Local resolution (legacy)
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        return api_key

    if load_dotenv:
        script_dir = Path(__file__).parent
        skill_dir = script_dir.parent
        skills_dir = skill_dir.parent
        claude_dir = skills_dir.parent

        env_files = [
            claude_dir / '.env',
            skills_dir / '.env',
            skill_dir / '.env',
        ]

        for env_file in env_files:
            if env_file.exists():
                load_dotenv(env_file, override=True)

        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            return api_key

    return None


def get_default_model(task: str) -> str:
    """Get default model for task from environment or fallback.

    Priority:
    1. Environment variable for specific capability
    2. Legacy GEMINI_MODEL variable
    3. Hard-coded defaults
    """
    if task == 'generate':  # Image generation
        model = os.getenv('IMAGE_GEN_MODEL')
        if model:
            return model
        # Fallback to legacy
        model = os.getenv('GEMINI_IMAGE_GEN_MODEL')
        if model:
            return model
        # Default to Nano Banana Flash (fast, cost-effective)
        # Alternative: imagen-4.0-generate-001 for production quality
        return 'gemini-2.5-flash-image'

    elif task == 'generate-video':
        model = os.getenv('VIDEO_GEN_MODEL')
        if model:
            return model
        return 'veo-3.1-generate-preview'  # New default

    elif task in ['analyze', 'transcribe', 'extract']:
        model = os.getenv('MULTIMODAL_MODEL')
        if model:
            return model
        # Fallback to legacy
        model = os.getenv('GEMINI_MODEL')
        if model:
            return model
        return 'gemini-2.5-flash'  # Existing default

    return 'gemini-2.5-flash'


def validate_model_task_combination(model: str, task: str) -> None:
    """Validate model is compatible with task.

    Raises:
        ValueError: If combination is invalid
    """
    # Video generation requires Veo
    if task == 'generate-video':
        if not model.startswith('veo-'):
            raise ValueError(
                f"Video generation requires Veo model, got '{model}'\n"
                f"Valid models: veo-3.1-generate-preview, veo-3.1-fast-generate-preview, "
                f"veo-3.0-generate-001, veo-3.0-fast-generate-001"
            )

    # Image generation models
    if task == 'generate':
        valid_image_models = [
            'imagen-4.0-generate-001',
            'imagen-4.0-ultra-generate-001',
            'imagen-4.0-fast-generate-001',
            'gemini-3-pro-image-preview',
            'gemini-2.5-flash-image',
            'gemini-2.5-flash-image-preview',
        ]
        if model not in valid_image_models:
            # Allow gemini models for analysis-based generation (backward compat)
            if not model.startswith('gemini-'):
                raise ValueError(
                    f"Image generation requires Imagen/Gemini image model, got '{model}'\n"
                    f"Valid models: {', '.join(valid_image_models)}"
                )


def infer_task_from_file(file_path: str) -> str:
    """Infer task type from file extension.

    Returns:
        'transcribe' for audio files
        'analyze' for image/video/document files
    """
    ext = Path(file_path).suffix.lower()

    audio_extensions = {'.mp3', '.wav', '.aac', '.flac', '.ogg', '.aiff', '.m4a'}
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif', '.bmp'}
    video_extensions = {'.mp4', '.mpeg', '.mov', '.avi', '.flv', '.mpg', '.webm', '.wmv', '.3gpp', '.mkv'}
    document_extensions = {'.pdf', '.txt', '.html', '.md', '.doc', '.docx'}

    if ext in audio_extensions:
        return 'transcribe'
    elif ext in image_extensions:
        return 'analyze'
    elif ext in video_extensions:
        return 'analyze'
    elif ext in document_extensions:
        return 'extract'

    # Default to analyze for unknown types
    return 'analyze'


def get_mime_type(file_path: str) -> str:
    """Determine MIME type from file extension."""
    ext = Path(file_path).suffix.lower()

    mime_types = {
        # Audio
        '.mp3': 'audio/mp3',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.ogg': 'audio/ogg',
        '.aiff': 'audio/aiff',
        # Image
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        # Video
        '.mp4': 'video/mp4',
        '.mpeg': 'video/mpeg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.flv': 'video/x-flv',
        '.mpg': 'video/mpeg',
        '.webm': 'video/webm',
        '.wmv': 'video/x-ms-wmv',
        '.3gpp': 'video/3gpp',
        # Document
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.md': 'text/markdown',
    }

    return mime_types.get(ext, 'application/octet-stream')


def upload_file(client: genai.Client, file_path: str, verbose: bool = False) -> Any:
    """Upload file to Gemini File API."""
    if verbose:
        print(f"Uploading {file_path}...")

    myfile = client.files.upload(file=file_path)

    # Wait for processing (video/audio files need processing)
    mime_type = get_mime_type(file_path)
    if mime_type.startswith('video/') or mime_type.startswith('audio/'):
        max_wait = 300  # 5 minutes
        elapsed = 0
        while myfile.state.name == 'PROCESSING' and elapsed < max_wait:
            time.sleep(2)
            myfile = client.files.get(name=myfile.name)
            elapsed += 2
            if verbose and elapsed % 10 == 0:
                print(f"  Processing... {elapsed}s")

        if myfile.state.name == 'FAILED':
            raise ValueError(f"File processing failed: {file_path}")

        if myfile.state.name == 'PROCESSING':
            raise TimeoutError(f"Processing timeout after {max_wait}s: {file_path}")

    if verbose:
        print(f"  Uploaded: {myfile.name}")

    return myfile


def _is_billing_error(error: Exception) -> bool:
    """Check if error is due to billing/access restrictions."""
    error_str = str(error).lower()
    billing_indicators = [
        'billing',
        'billed users',
        'payment',
        'access denied',
        'not authorized',
        'permission denied',
    ]
    return any(indicator in error_str for indicator in billing_indicators)


def _is_free_tier_quota_error(error: Exception) -> bool:
    """Check if error indicates free tier has zero quota for this model.

    Free tier users have NO access to image/video generation models.
    The API returns 'limit: 0' or 'RESOURCE_EXHAUSTED' with quota details.
    """
    error_str = str(error)
    # Check for zero quota indicators
    return (
        'RESOURCE_EXHAUSTED' in error_str and
        ('limit: 0' in error_str or 'free_tier' in error_str.lower())
    )


FREE_TIER_NO_ACCESS_MSG = """
[FREE TIER LIMITATION] Image/Video generation is NOT available on free tier.

Free tier users have zero quota (limit: 0) for:
- All Imagen models (imagen-4.0-*)
- All Veo models (veo-*)
- Gemini image models (gemini-*-image, gemini-*-image-preview)

To use image/video generation:
1. Enable billing: https://aistudio.google.com/apikey
2. Or use Google Cloud $300 free credits: https://cloud.google.com/free

STOP: Do not retry image/video generation on free tier - it will always fail.
""".strip()


def generate_image_imagen4(
    client,
    prompt: str,
    model: str,
    num_images: int = 1,
    aspect_ratio: str = '1:1',
    size: str = '1K',
    verbose: bool = False
) -> Dict[str, Any]:
    """Generate image using Imagen 4 models.

    Returns special status 'billing_required' if model needs billing,
    allowing caller to fallback to free-tier generate_content API.
    """
    try:
        # Build config based on model (Fast doesn't support imageSize)
        config_params = {
            'numberOfImages': num_images,
            'aspectRatio': aspect_ratio
        }

        # Only Standard and Ultra support imageSize parameter
        if 'fast' not in model.lower() and model.startswith('imagen-'):
            config_params['imageSize'] = size

        gen_config = types.GenerateImagesConfig(**config_params)

        if verbose:
            print(f"  Generating with: {model}")
            print(f"  Config: {num_images} images, {aspect_ratio}", end='')
            if 'fast' not in model.lower() and model.startswith('imagen-'):
                print(f", {size}")
            else:
                print()

        response = client.models.generate_images(
            model=model,
            prompt=prompt,
            config=gen_config
        )

        # Save images
        generated_files = []
        for i, generated_image in enumerate(response.generated_images):
            # Find project root
            script_dir = Path(__file__).parent
            project_root = script_dir
            for parent in [script_dir] + list(script_dir.parents):
                if (parent / '.git').exists() or (parent / '.claude').exists():
                    project_root = parent
                    break

            output_dir = project_root / 'docs' / 'assets'
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"imagen4_generated_{int(time.time())}_{i}.png"

            with open(output_file, 'wb') as f:
                f.write(generated_image.image.image_bytes)
            generated_files.append(str(output_file))

            if verbose:
                print(f"  Saved: {output_file}")

        return {
            'status': 'success',
            'generated_images': generated_files,
            'model': model
        }

    except Exception as e:
        # Return special status for billing errors so caller can fallback
        if _is_billing_error(e) and model in IMAGEN_MODELS:
            return {
                'status': 'billing_required',
                'original_model': model,
                'error': str(e)
            }

        if verbose:
            print(f"  Error: {str(e)}")
            import traceback
            traceback.print_exc()
        return {
            'status': 'error',
            'error': str(e)
        }


def generate_video_veo(
    client,
    prompt: str,
    model: str,
    resolution: str = '1080p',
    aspect_ratio: str = '16:9',
    reference_images: Optional[List[str]] = None,
    verbose: bool = False
) -> Dict[str, Any]:
    """Generate video using Veo models.

    For image-to-video with first/last frames (Veo 3.1):
    - First reference image becomes the opening frame (image parameter)
    - Second reference image becomes the closing frame (last_frame config)
    - Model interpolates between them to create smooth video
    """
    try:
        # Build config with snake_case for Python SDK
        config_params = {
            'aspect_ratio': aspect_ratio,
            'resolution': resolution
        }

        # Prepare first frame and last frame images
        first_frame = None
        last_frame = None

        if reference_images:
            import mimetypes

            def load_image(img_path_str: str) -> types.Image:
                """Load image file as types.Image with bytes and mime type."""
                img_path = Path(img_path_str)
                image_bytes = img_path.read_bytes()
                mime_type, _ = mimetypes.guess_type(str(img_path))
                if not mime_type:
                    mime_type = 'image/png'
                return types.Image(
                    image_bytes=image_bytes,
                    mime_type=mime_type
                )

            # First image = opening frame
            if len(reference_images) >= 1:
                first_frame = load_image(reference_images[0])

            # Second image = closing frame (last_frame in config)
            if len(reference_images) >= 2:
                last_frame = load_image(reference_images[1])
                config_params['last_frame'] = last_frame

        gen_config = types.GenerateVideosConfig(**config_params)

        if verbose:
            print(f"  Generating video with Veo: {model}")
            print(f"  Config: {resolution}, {aspect_ratio}")
            if first_frame:
                print(f"  First frame: provided")
            if last_frame:
                print(f"  Last frame: provided (interpolation mode)")

        start = time.time()

        if verbose:
            print(f"  Starting video generation (this may take 11s-6min)...")

        # Call generate_videos with image parameter for first frame
        operation = client.models.generate_videos(
            model=model,
            prompt=prompt,
            image=first_frame,  # First frame as opening image
            config=gen_config
        )

        # Poll operation until complete
        poll_count = 0
        while not operation.done:
            poll_count += 1
            if verbose and poll_count % 3 == 0:  # Update every 30s
                elapsed = time.time() - start
                print(f"  Still generating... ({elapsed:.0f}s elapsed)")
            time.sleep(10)
            operation = client.operations.get(operation)

        duration = time.time() - start

        # Access generated video from operation response
        generated_video = operation.response.generated_videos[0]

        # Download the video file first
        client.files.download(file=generated_video.video)

        # Save video
        script_dir = Path(__file__).parent
        project_root = script_dir
        for parent in [script_dir] + list(script_dir.parents):
            if (parent / '.git').exists() or (parent / '.claude').exists():
                project_root = parent
                break

        output_dir = project_root / 'docs' / 'assets'
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / f"veo_generated_{int(time.time())}.mp4"

        # Now save to file
        generated_video.video.save(str(output_file))

        file_size = output_file.stat().st_size / (1024 * 1024)  # MB

        if verbose:
            print(f"  Generated in {duration:.1f}s")
            print(f"  File size: {file_size:.2f} MB")
            print(f"  Saved: {output_file}")

        return {
            'status': 'success',
            'generated_video': str(output_file),
            'generation_time': duration,
            'file_size_mb': file_size,
            'model': model
        }

    except Exception as e:
        if verbose:
            print(f"  Error: {str(e)}")
            import traceback
            traceback.print_exc()
        return {
            'status': 'error',
            'error': str(e)
        }


def process_file(
    client: genai.Client,
    file_path: Optional[str],
    prompt: str,
    model: str,
    task: str,
    format_output: str,
    aspect_ratio: Optional[str] = None,
    image_size: Optional[str] = None,
    verbose: bool = False,
    max_retries: int = 3
) -> Dict[str, Any]:
    """Process a single file with retry logic.

    Args:
        image_size: Image size for Nano Banana models (1K, 2K, 4K). Must be uppercase K.
                    Note: Not all models support image_size - only pass when explicitly needed.
    """

    for attempt in range(max_retries):
        try:
            # For generation tasks without input files
            if task == 'generate' and not file_path:
                content = [prompt]
            else:
                # Process input file
                file_path = Path(file_path)
                # Determine if we need File API
                file_size = file_path.stat().st_size
                use_file_api = file_size > 20 * 1024 * 1024  # >20MB

                if use_file_api:
                    # Upload to File API
                    myfile = upload_file(client, str(file_path), verbose)
                    content = [prompt, myfile]
                else:
                    # Inline data
                    with open(file_path, 'rb') as f:
                        file_bytes = f.read()

                    mime_type = get_mime_type(str(file_path))
                    content = [
                        prompt,
                        types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
                    ]

            # Configure request
            config_args = {}
            if task == 'generate':
                # Nano Banana requires fully uppercase 'IMAGE' per API spec
                config_args['response_modalities'] = ['IMAGE']
                # Build image_config with aspect_ratio and/or image_size
                image_config_args = {}
                if aspect_ratio:
                    image_config_args['aspect_ratio'] = aspect_ratio
                if image_size:
                    # image_size must be uppercase K (1K, 2K, 4K)
                    image_config_args['image_size'] = image_size
                if image_config_args:
                    config_args['image_config'] = types.ImageConfig(**image_config_args)

            if format_output == 'json':
                config_args['response_mime_type'] = 'application/json'

            config = types.GenerateContentConfig(**config_args) if config_args else None

            # Generate content
            response = client.models.generate_content(
                model=model,
                contents=content,
                config=config
            )

            # Extract response
            result = {
                'file': str(file_path) if file_path else 'generated',
                'status': 'success',
                'response': response.text if hasattr(response, 'text') else None
            }

            # Handle image output
            if task == 'generate' and hasattr(response, 'candidates'):
                for i, part in enumerate(response.candidates[0].content.parts):
                    if part.inline_data:
                        # Determine output directory - use project root docs/assets
                        if file_path:
                            output_dir = Path(file_path).parent
                            base_name = Path(file_path).stem
                        else:
                            # Find project root (look for .git or .claude directory)
                            script_dir = Path(__file__).parent
                            project_root = script_dir
                            for parent in [script_dir] + list(script_dir.parents):
                                if (parent / '.git').exists() or (parent / '.claude').exists():
                                    project_root = parent
                                    break

                            output_dir = project_root / 'docs' / 'assets'
                            output_dir.mkdir(parents=True, exist_ok=True)
                            base_name = "generated"

                        output_file = output_dir / f"{base_name}_generated_{i}.png"
                        with open(output_file, 'wb') as f:
                            f.write(part.inline_data.data)
                        result['generated_image'] = str(output_file)
                        if verbose:
                            print(f"  Saved image to: {output_file}")

            return result

        except Exception as e:
            # Don't retry on billing/free tier errors - they won't resolve
            if _is_billing_error(e) or _is_free_tier_quota_error(e):
                return {
                    'file': str(file_path) if file_path else 'generated',
                    'status': 'error',
                    'error': str(e)
                }

            # Check if this is a rate limit error (candidate for key rotation)
            is_rate_limited = (
                KEY_ROTATION_AVAILABLE and
                is_rate_limit_error and
                is_rate_limit_error(e)
            )

            if attempt == max_retries - 1:
                return {
                    'file': str(file_path) if file_path else 'generated',
                    'status': 'error',
                    'error': str(e),
                    'rate_limited': is_rate_limited  # Flag for caller to handle rotation
                }

            wait_time = 2 ** attempt
            if verbose:
                print(f"  Retry {attempt + 1} after {wait_time}s: {e}")
            time.sleep(wait_time)


def batch_process(
    files: List[str],
    prompt: str,
    model: str,
    task: str,
    format_output: str,
    aspect_ratio: Optional[str] = None,
    num_images: int = 1,
    size: str = '1K',
    resolution: str = '1080p',
    reference_images: Optional[List[str]] = None,
    output_file: Optional[str] = None,
    verbose: bool = False,
    dry_run: bool = False
) -> List[Dict[str, Any]]:
    """Batch process multiple files with automatic key rotation."""

    # Initialize key rotator or fall back to single key
    rotator = None
    api_key = None

    if KEY_ROTATION_AVAILABLE and find_all_api_keys:
        all_keys = find_all_api_keys()
        if all_keys:
            if len(all_keys) > 1:
                rotator = KeyRotator(keys=all_keys, verbose=verbose)
                api_key = rotator.get_key()
                if verbose:
                    print(f"✓ Key rotation enabled with {len(all_keys)} keys", file=sys.stderr)
            else:
                api_key = all_keys[0]
                if verbose:
                    print(f"✓ Using single API key: {api_key[:8]}...", file=sys.stderr)

    # Fallback to original single-key lookup
    if not api_key:
        api_key = find_api_key()

    if not api_key:
        print("Error: GEMINI_API_KEY not found")
        print("\nSetup options:")
        print("1. Run setup checker: python scripts/check_setup.py")
        print("2. Show hierarchy: python ~/.claude/scripts/resolve_env.py --show-hierarchy --skill ai-multimodal")
        print("3. Quick setup: export GEMINI_API_KEY='your-key'")
        print("4. Create .env: cd ~/.claude/skills/ai-multimodal && cp .env.example .env")
        print("\nFor key rotation, add multiple keys:")
        print("   GEMINI_API_KEY=key1")
        print("   GEMINI_API_KEY_2=key2")
        print("   GEMINI_API_KEY_3=key3")
        sys.exit(1)

    if dry_run:
        print("DRY RUN MODE - No API calls will be made")
        print(f"Files to process: {len(files)}")
        print(f"Model: {model}")
        print(f"Task: {task}")
        print(f"Prompt: {prompt}")
        if rotator:
            print(f"API keys available: {rotator.key_count}")
        return []

    # Create client with current key
    client = genai.Client(api_key=api_key)
    results = []

    def get_client_with_rotation(error: Optional[Exception] = None) -> Optional[genai.Client]:
        """Get client, rotating key if rate limited."""
        nonlocal client, api_key

        if error and rotator and is_rate_limit_error and is_rate_limit_error(error):
            # Try to rotate to next key
            if rotator.mark_rate_limited(str(error)):
                new_key = rotator.get_key()
                if new_key:
                    api_key = new_key
                    client = genai.Client(api_key=api_key)
                    return client
            # All keys exhausted
            return None
        return client

    # For generation tasks without input files, process once
    if task == 'generate' and not files:
        if verbose:
            print(f"\nGenerating image from prompt...")

        # Use Imagen 4 API for imagen models
        if model.startswith('imagen-') or model in IMAGEN_MODELS:
            result = generate_image_imagen4(
                client=client,
                prompt=prompt,
                model=model,
                num_images=num_images,
                aspect_ratio=aspect_ratio or '1:1',
                size=size or '1K',  # Default to 1K for Imagen models
                verbose=verbose
            )

            # Silent fallback to cheaper model if Imagen billing required
            if result.get('status') == 'billing_required':
                if verbose:
                    print(f"  Falling back to: {IMAGE_MODEL_FALLBACK}")
                result = process_file(
                    client=client,
                    file_path=None,
                    prompt=prompt,
                    model=IMAGE_MODEL_FALLBACK,
                    task=task,
                    format_output=format_output,
                    aspect_ratio=aspect_ratio,
                    image_size=size,
                    verbose=verbose
                )
                # Check if free tier (zero quota) - stop immediately with clear message
                error_str = result.get('error', '')
                if result.get('status') == 'error':
                    if _is_free_tier_quota_error(Exception(error_str)):
                        result['error'] = FREE_TIER_NO_ACCESS_MSG
                    elif _is_billing_error(Exception(error_str)):
                        result['error'] = (
                            "Image generation requires billing. Enable billing at: "
                            "https://aistudio.google.com/apikey or use Google Cloud credits."
                        )
        else:
            # Nano Banana (Flash/Pro) or other models via generate_content API
            result = process_file(
                client=client,
                file_path=None,
                prompt=prompt,
                model=model,
                task=task,
                format_output=format_output,
                aspect_ratio=aspect_ratio,
                image_size=size,
                verbose=verbose
            )
            # Check for free tier error
            if result.get('status') == 'error':
                error_str = result.get('error', '')
                if _is_free_tier_quota_error(Exception(error_str)):
                    result['error'] = FREE_TIER_NO_ACCESS_MSG

        results.append(result)

        if verbose:
            status = result.get('status', 'unknown')
            print(f"  Status: {status}")

    elif task == 'generate-video' and not files:
        if verbose:
            print(f"\nGenerating video from prompt...")

        result = generate_video_veo(
            client=client,
            prompt=prompt,
            model=model,
            resolution=resolution,
            aspect_ratio=aspect_ratio or '16:9',
            reference_images=reference_images,
            verbose=verbose
        )

        # Check for free tier error - video gen has NO free tier access
        if result.get('status') == 'error':
            error_str = result.get('error', '')
            if _is_free_tier_quota_error(Exception(error_str)) or _is_billing_error(Exception(error_str)):
                result['error'] = FREE_TIER_NO_ACCESS_MSG

        results.append(result)

        if verbose:
            status = result.get('status', 'unknown')
            print(f"  Status: {status}")
    else:
        # Process input files with key rotation support
        for i, file_path in enumerate(files, 1):
            if verbose:
                print(f"\n[{i}/{len(files)}] Processing: {file_path}")

            # Try processing with key rotation on rate limit
            max_rotation_attempts = rotator.key_count if rotator else 1
            result = None

            for rotation_attempt in range(max_rotation_attempts):
                result = process_file(
                    client=client,
                    file_path=file_path,
                    prompt=prompt,
                    model=model,
                    task=task,
                    format_output=format_output,
                    aspect_ratio=aspect_ratio,
                    image_size=size,
                    verbose=verbose
                )

                # Check if rate limited and can rotate
                if (result.get('rate_limited') and rotator and
                    rotation_attempt < max_rotation_attempts - 1):
                    new_client = get_client_with_rotation(Exception(result.get('error', '')))
                    if new_client:
                        client = new_client
                        if verbose:
                            print(f"  Retrying with rotated key...")
                        continue
                    else:
                        # All keys exhausted - mark result with clear error
                        if verbose:
                            print(f"  ⚠ All API keys exhausted (on cooldown)", file=sys.stderr)
                        result['error'] = "All API keys exhausted (rate limited). Try again later."
                break

            results.append(result)

            if verbose:
                status = result.get('status', 'unknown')
                print(f"  Status: {status}")

    # Save results
    if output_file:
        save_results(results, output_file, format_output)

    return results


def print_results(results: List[Dict[str, Any]], task: str) -> None:
    """Print results to stdout for LLM workflows.

    Always prints actual results (not just success/fail counts) so LLMs
    can continue processing based on the output.
    """
    if not results:
        return

    print("\n=== RESULTS ===\n")

    for result in results:
        file_name = result.get('file', 'generated')
        status = result.get('status', 'unknown')

        print(f"[{file_name}]")
        print(f"Status: {status}")

        if status == 'success':
            # Print task-specific output
            if task in ['analyze', 'transcribe', 'extract']:
                response = result.get('response')
                if response:
                    print(f"Result:\n{response}")

            elif task == 'generate':
                # Image generation
                generated_images = result.get('generated_images', [])
                if generated_images:
                    print(f"Generated images: {len(generated_images)}")
                    for img in generated_images:
                        print(f"  - {img}")
                else:
                    generated_image = result.get('generated_image')
                    if generated_image:
                        print(f"Generated image: {generated_image}")

            elif task == 'generate-video':
                generated_video = result.get('generated_video')
                if generated_video:
                    print(f"Generated video: {generated_video}")
                    gen_time = result.get('generation_time')
                    if gen_time:
                        print(f"Generation time: {gen_time:.1f}s")
                    file_size = result.get('file_size_mb')
                    if file_size:
                        print(f"File size: {file_size:.2f} MB")

        elif status == 'error':
            error = result.get('error', 'Unknown error')
            print(f"Error: {error}")

        print()  # Blank line between results


def save_results(results: List[Dict[str, Any]], output_file: str, format_output: str):
    """Save results to file."""
    output_path = Path(output_file)

    # Special handling for image generation - if output has image extension, copy the generated image
    image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'}
    video_extensions = {'.mp4', '.mov', '.avi', '.webm'}

    if output_path.suffix.lower() in image_extensions and len(results) == 1:
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Check for multiple generated images
        generated_images = results[0].get('generated_images')
        if generated_images:
            # Copy first image to the specified output location
            shutil.copy2(generated_images[0], output_path)
            return

        # Legacy single image field
        generated_image = results[0].get('generated_image')
        if generated_image:
            shutil.copy2(generated_image, output_path)
            return
        else:
            # Don't write text reports to image files - save error as .txt instead
            output_path = output_path.with_suffix('.error.txt')
            output_path.parent.mkdir(parents=True, exist_ok=True)  # Ensure directory exists
            print(f"Warning: Generation failed, saving error report to: {output_path}")

    if output_path.suffix.lower() in video_extensions and len(results) == 1:
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        generated_video = results[0].get('generated_video')
        if generated_video:
            shutil.copy2(generated_video, output_path)
            return
        else:
            output_path = output_path.with_suffix('.error.txt')
            output_path.parent.mkdir(parents=True, exist_ok=True)
            print(f"Warning: Video generation failed, saving error report to: {output_path}")

    if format_output == 'json':
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
    elif format_output == 'csv':
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['file', 'status', 'response', 'error']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for result in results:
                writer.writerow({
                    'file': result.get('file', ''),
                    'status': result.get('status', ''),
                    'response': result.get('response', ''),
                    'error': result.get('error', '')
                })
    else:  # markdown
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# Batch Processing Results\n\n")
            for i, result in enumerate(results, 1):
                f.write(f"## {i}. {result.get('file', 'Unknown')}\n\n")
                f.write(f"**Status**: {result.get('status', 'unknown')}\n\n")
                if result.get('response'):
                    f.write(f"**Response**:\n\n{result['response']}\n\n")
                if result.get('error'):
                    f.write(f"**Error**: {result['error']}\n\n")


def main():
    parser = argparse.ArgumentParser(
        description='Batch process media files with Gemini API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Transcribe multiple audio files
  %(prog)s --files *.mp3 --task transcribe --model gemini-2.5-flash

  # Analyze images
  %(prog)s --files *.jpg --task analyze --prompt "Describe this image" \\
    --model gemini-2.5-flash

  # Process PDFs to JSON
  %(prog)s --files *.pdf --task extract --prompt "Extract data as JSON" \\
    --format json --output results.json

  # Generate images with Nano Banana Flash (fast)
  %(prog)s --task generate --prompt "A mountain landscape at sunset" \\
    --model gemini-2.5-flash-image --aspect-ratio 16:9 --size 2K

  # Generate images with Nano Banana Pro (4K text, reasoning)
  %(prog)s --task generate --prompt "Travel poster with text 'EXPLORE'" \\
    --model gemini-3-pro-image-preview --aspect-ratio 3:4 --size 4K

  # Generate images with Imagen 4 (production quality)
  %(prog)s --task generate --prompt "Product photo of coffee mug" \\
    --model imagen-4.0-ultra-generate-001 --aspect-ratio 1:1 --size 2K
        """
    )

    parser.add_argument('--files', nargs='*', help='Input files to process')
    parser.add_argument('--task',
                       choices=['transcribe', 'analyze', 'extract', 'generate', 'generate-video'],
                       help='Task to perform (auto-detected from file type if not specified)')
    parser.add_argument('--prompt', help='Prompt for analysis/generation')
    parser.add_argument('--model',
                       help='Model to use (default: auto-detected from task and env vars)')
    parser.add_argument('--format', dest='format_output', default='text',
                       choices=['text', 'json', 'csv', 'markdown'],
                       help='Output format (default: text)')

    # Image generation options
    # All 10 aspect ratios supported by Nano Banana / Imagen 4
    parser.add_argument('--aspect-ratio',
                       choices=['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
                       help='Aspect ratio for image/video generation')
    parser.add_argument('--num-images', type=int, default=1,
                       help='Number of images to generate (1-4, default: 1)')
    # 4K available for Nano Banana Pro (gemini-3-pro-image-preview)
    # Note: Not all models support --size, only use when needed
    parser.add_argument('--size', choices=['1K', '2K', '4K'], default=None,
                       help='Image size - 1K/2K for Imagen 4, 1K/2K/4K for Nano Banana (optional)')

    # Video generation options
    parser.add_argument('--resolution', choices=['720p', '1080p'], default='1080p',
                       help='Video resolution (default: 1080p)')
    parser.add_argument('--reference-images', nargs='+',
                       help='Reference images for video generation (max 3)')

    parser.add_argument('--output', help='Output file for results')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be done without making API calls')

    args = parser.parse_args()

    # Auto-detect task from file type if not specified
    if not args.task:
        if args.files and len(args.files) > 0:
            args.task = infer_task_from_file(args.files[0])
            if args.verbose:
                print(f"Auto-detected task: {args.task} (from file extension)")
        else:
            parser.error("--task required when no input files provided")

    # Auto-detect model if not specified
    if not args.model:
        args.model = get_default_model(args.task)
        if args.verbose:
            print(f"Auto-detected model: {args.model}")

    # Validate model/task combination
    try:
        validate_model_task_combination(args.model, args.task)
    except ValueError as e:
        parser.error(str(e))

    # Validate arguments
    if args.task not in ['generate', 'generate-video'] and not args.files:
        parser.error("--files required for non-generation tasks")

    if args.task in ['generate', 'generate-video'] and not args.prompt:
        parser.error("--prompt required for generation tasks")

    if args.task not in ['generate', 'generate-video'] and not args.prompt:
        # Set default prompts
        if args.task == 'transcribe':
            args.prompt = 'Generate a transcript with timestamps'
        elif args.task == 'analyze':
            args.prompt = 'Analyze this content'
        elif args.task == 'extract':
            args.prompt = 'Extract key information'

    # Process files
    files = args.files or []
    results = batch_process(
        files=files,
        prompt=args.prompt,
        model=args.model,
        task=args.task,
        format_output=args.format_output,
        aspect_ratio=args.aspect_ratio,
        num_images=args.num_images,
        size=args.size,
        resolution=args.resolution,
        reference_images=args.reference_images,
        output_file=args.output,
        verbose=args.verbose,
        dry_run=args.dry_run
    )

    # Print results and summary
    if not args.dry_run and results:
        # Always print actual results for LLM workflows
        print_results(results, args.task)

        # Print summary
        success = sum(1 for r in results if r.get('status') == 'success')
        failed = len(results) - success
        print(f"{'='*50}")
        print(f"Summary: {len(results)} processed, {success} success, {failed} failed")
        if args.output:
            print(f"Results saved to: {args.output}")


if __name__ == '__main__':
    main()
