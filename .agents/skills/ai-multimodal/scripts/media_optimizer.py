#!/usr/bin/env python3
"""
Optimize media files for Gemini API processing.

Features:
- Compress videos/audio for size limits
- Resize images appropriately
- Split long videos into chunks
- Format conversion
- Quality vs size optimization
- Validation before upload
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def load_env_files():
    """Load .env files in correct priority order.

    Priority order (highest to lowest):
    1. process.env (runtime environment variables)
    2. .claude/skills/ai-multimodal/.env (skill-specific config)
    3. .claude/skills/.env (shared skills config)
    4. .claude/.env (Claude global config)
    """
    if not load_dotenv:
        return

    # Determine base paths
    script_dir = Path(__file__).parent
    skill_dir = script_dir.parent  # .claude/skills/ai-multimodal
    skills_dir = skill_dir.parent   # .claude/skills
    claude_dir = skills_dir.parent  # .claude

    # Priority 2: Skill-specific .env
    env_file = skill_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)

    # Priority 3: Shared skills .env
    env_file = skills_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)

    # Priority 4: Claude global .env
    env_file = claude_dir / '.env'
    if env_file.exists():
        load_dotenv(env_file)


# Load environment variables at module level
load_env_files()


def check_ffmpeg() -> bool:
    """Check if ffmpeg is installed."""
    try:
        subprocess.run(['ffmpeg', '-version'],
                      stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL,
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, Exception):
        return False


def get_media_info(file_path: str) -> Dict[str, Any]:
    """Get media file information using ffprobe."""
    if not check_ffmpeg():
        return {}

    try:
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            file_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        info = {
            'size': int(data['format'].get('size', 0)),
            'duration': float(data['format'].get('duration', 0)),
            'bit_rate': int(data['format'].get('bit_rate', 0)),
        }

        # Get video/audio specific info
        for stream in data.get('streams', []):
            if stream['codec_type'] == 'video':
                info['width'] = stream.get('width', 0)
                info['height'] = stream.get('height', 0)
                info['fps'] = eval(stream.get('r_frame_rate', '0/1'))
            elif stream['codec_type'] == 'audio':
                info['sample_rate'] = int(stream.get('sample_rate', 0))
                info['channels'] = stream.get('channels', 0)

        return info

    except (subprocess.CalledProcessError, json.JSONDecodeError, Exception):
        return {}


def optimize_video(
    input_path: str,
    output_path: str,
    target_size_mb: Optional[int] = None,
    max_duration: Optional[int] = None,
    quality: int = 23,
    resolution: Optional[str] = None,
    verbose: bool = False
) -> bool:
    """Optimize video file for Gemini API."""
    if not check_ffmpeg():
        print("Error: ffmpeg not installed")
        print("Install: apt-get install ffmpeg (Linux) or brew install ffmpeg (Mac)")
        return False

    info = get_media_info(input_path)
    if not info:
        print(f"Error: Could not read media info from {input_path}")
        return False

    if verbose:
        print(f"Input: {Path(input_path).name}")
        print(f"  Size: {info['size'] / (1024*1024):.2f} MB")
        print(f"  Duration: {info['duration']:.2f}s")
        if 'width' in info:
            print(f"  Resolution: {info['width']}x{info['height']}")
        print(f"  Bit rate: {info['bit_rate'] / 1000:.0f} kbps")

    # Build ffmpeg command
    cmd = ['ffmpeg', '-i', input_path, '-y']

    # Video codec
    cmd.extend(['-c:v', 'libx264', '-crf', str(quality)])

    # Resolution
    if resolution:
        cmd.extend(['-vf', f'scale={resolution}'])
    elif 'width' in info and info['width'] > 1920:
        cmd.extend(['-vf', 'scale=1920:-2'])  # Max 1080p

    # Audio codec
    cmd.extend(['-c:a', 'aac', '-b:a', '128k', '-ac', '2'])

    # Duration limit
    if max_duration and info['duration'] > max_duration:
        cmd.extend(['-t', str(max_duration)])

    # Target size (rough estimate using bitrate)
    if target_size_mb:
        target_bits = target_size_mb * 8 * 1024 * 1024
        duration = min(info['duration'], max_duration) if max_duration else info['duration']
        target_bitrate = int(target_bits / duration)
        # Reserve some for audio (128kbps)
        video_bitrate = max(target_bitrate - 128000, 500000)
        cmd.extend(['-b:v', str(video_bitrate)])

    cmd.append(output_path)

    if verbose:
        print(f"\nOptimizing...")
        print(f"  Command: {' '.join(cmd)}")

    try:
        subprocess.run(cmd, check=True, capture_output=not verbose)

        # Check output
        output_info = get_media_info(output_path)
        if output_info and verbose:
            print(f"\nOutput: {Path(output_path).name}")
            print(f"  Size: {output_info['size'] / (1024*1024):.2f} MB")
            print(f"  Duration: {output_info['duration']:.2f}s")
            if 'width' in output_info:
                print(f"  Resolution: {output_info['width']}x{output_info['height']}")
            compression = (1 - output_info['size'] / info['size']) * 100
            print(f"  Compression: {compression:.1f}%")

        return True

    except subprocess.CalledProcessError as e:
        print(f"Error optimizing video: {e}")
        return False


def optimize_audio(
    input_path: str,
    output_path: str,
    target_size_mb: Optional[int] = None,
    bitrate: str = '64k',
    sample_rate: int = 16000,
    verbose: bool = False
) -> bool:
    """Optimize audio file for Gemini API."""
    if not check_ffmpeg():
        print("Error: ffmpeg not installed")
        return False

    info = get_media_info(input_path)
    if not info:
        print(f"Error: Could not read media info from {input_path}")
        return False

    if verbose:
        print(f"Input: {Path(input_path).name}")
        print(f"  Size: {info['size'] / (1024*1024):.2f} MB")
        print(f"  Duration: {info['duration']:.2f}s")

    # Build command
    cmd = [
        'ffmpeg', '-i', input_path, '-y',
        '-c:a', 'aac',
        '-b:a', bitrate,
        '-ar', str(sample_rate),
        '-ac', '1',  # Mono (Gemini uses mono anyway)
        output_path
    ]

    if verbose:
        print(f"\nOptimizing...")

    try:
        subprocess.run(cmd, check=True, capture_output=not verbose)

        output_info = get_media_info(output_path)
        if output_info and verbose:
            print(f"\nOutput: {Path(output_path).name}")
            print(f"  Size: {output_info['size'] / (1024*1024):.2f} MB")
            compression = (1 - output_info['size'] / info['size']) * 100
            print(f"  Compression: {compression:.1f}%")

        return True

    except subprocess.CalledProcessError as e:
        print(f"Error optimizing audio: {e}")
        return False


def optimize_image(
    input_path: str,
    output_path: str,
    max_width: int = 1920,
    quality: int = 85,
    verbose: bool = False
) -> bool:
    """Optimize image file for Gemini API."""
    try:
        from PIL import Image
    except ImportError:
        print("Error: Pillow not installed")
        print("Install with: pip install pillow")
        return False

    try:
        img = Image.open(input_path)

        if verbose:
            print(f"Input: {Path(input_path).name}")
            print(f"  Size: {Path(input_path).stat().st_size / 1024:.2f} KB")
            print(f"  Resolution: {img.width}x{img.height}")

        # Resize if needed
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            if verbose:
                print(f"  Resized to: {img.width}x{img.height}")

        # Convert RGBA to RGB if saving as JPEG
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img

        # Save
        img.save(output_path, quality=quality, optimize=True)

        if verbose:
            print(f"\nOutput: {Path(output_path).name}")
            print(f"  Size: {Path(output_path).stat().st_size / 1024:.2f} KB")
            compression = (1 - Path(output_path).stat().st_size / Path(input_path).stat().st_size) * 100
            print(f"  Compression: {compression:.1f}%")

        return True

    except Exception as e:
        print(f"Error optimizing image: {e}")
        return False


def split_video(
    input_path: str,
    output_dir: str,
    chunk_duration: int = 3600,
    verbose: bool = False
) -> List[str]:
    """Split long video into chunks."""
    if not check_ffmpeg():
        print("Error: ffmpeg not installed")
        return []

    info = get_media_info(input_path)
    if not info:
        return []

    total_duration = info['duration']
    num_chunks = int(total_duration / chunk_duration) + 1

    if num_chunks == 1:
        if verbose:
            print("Video is short enough, no splitting needed")
        return [input_path]

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    output_files = []

    for i in range(num_chunks):
        start_time = i * chunk_duration
        output_file = Path(output_dir) / f"{Path(input_path).stem}_chunk_{i+1}.mp4"

        cmd = [
            'ffmpeg', '-i', input_path, '-y',
            '-ss', str(start_time),
            '-t', str(chunk_duration),
            '-c', 'copy',
            str(output_file)
        ]

        if verbose:
            print(f"Creating chunk {i+1}/{num_chunks}...")

        try:
            subprocess.run(cmd, check=True, capture_output=not verbose)
            output_files.append(str(output_file))
        except subprocess.CalledProcessError as e:
            print(f"Error creating chunk {i+1}: {e}")

    return output_files


def main():
    parser = argparse.ArgumentParser(
        description='Optimize media files for Gemini API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Optimize video to 100MB
  %(prog)s --input video.mp4 --output optimized.mp4 --target-size 100

  # Optimize audio
  %(prog)s --input audio.mp3 --output optimized.m4a --bitrate 64k

  # Resize image
  %(prog)s --input image.jpg --output resized.jpg --max-width 1920

  # Split long video
  %(prog)s --input long-video.mp4 --split --chunk-duration 3600 --output-dir ./chunks

  # Batch optimize directory
  %(prog)s --input-dir ./videos --output-dir ./optimized --quality 85
        """
    )

    parser.add_argument('--input', help='Input file')
    parser.add_argument('--output', help='Output file')
    parser.add_argument('--input-dir', help='Input directory for batch processing')
    parser.add_argument('--output-dir', help='Output directory for batch processing')
    parser.add_argument('--target-size', type=int, help='Target size in MB')
    parser.add_argument('--quality', type=int, default=85,
                       help='Quality (video: 0-51 CRF, image: 1-100) (default: 85)')
    parser.add_argument('--max-width', type=int, default=1920,
                       help='Max image width (default: 1920)')
    parser.add_argument('--bitrate', default='64k',
                       help='Audio bitrate (default: 64k)')
    parser.add_argument('--resolution', help='Video resolution (e.g., 1920x1080)')
    parser.add_argument('--split', action='store_true', help='Split long video into chunks')
    parser.add_argument('--chunk-duration', type=int, default=3600,
                       help='Chunk duration in seconds (default: 3600 = 1 hour)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    args = parser.parse_args()

    # Validate arguments
    if not args.input and not args.input_dir:
        parser.error("Either --input or --input-dir required")

    # Single file processing
    if args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: Input file not found: {input_path}")
            sys.exit(1)

        if args.split:
            output_dir = args.output_dir or './chunks'
            chunks = split_video(str(input_path), output_dir, args.chunk_duration, args.verbose)
            print(f"\nCreated {len(chunks)} chunks in {output_dir}")
            sys.exit(0)

        if not args.output:
            parser.error("--output required for single file processing")

        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Determine file type
        ext = input_path.suffix.lower()

        if ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']:
            success = optimize_video(
                str(input_path),
                str(output_path),
                target_size_mb=args.target_size,
                quality=args.quality,
                resolution=args.resolution,
                verbose=args.verbose
            )
        elif ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac']:
            success = optimize_audio(
                str(input_path),
                str(output_path),
                target_size_mb=args.target_size,
                bitrate=args.bitrate,
                verbose=args.verbose
            )
        elif ext in ['.jpg', '.jpeg', '.png', '.webp']:
            success = optimize_image(
                str(input_path),
                str(output_path),
                max_width=args.max_width,
                quality=args.quality,
                verbose=args.verbose
            )
        else:
            print(f"Error: Unsupported file type: {ext}")
            sys.exit(1)

        sys.exit(0 if success else 1)

    # Batch processing
    if args.input_dir:
        if not args.output_dir:
            parser.error("--output-dir required for batch processing")

        input_dir = Path(args.input_dir)
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Find all media files
        patterns = ['*.mp4', '*.mov', '*.avi', '*.mkv', '*.webm',
                   '*.mp3', '*.wav', '*.m4a', '*.flac',
                   '*.jpg', '*.jpeg', '*.png', '*.webp']

        files = []
        for pattern in patterns:
            files.extend(input_dir.glob(pattern))

        if not files:
            print(f"No media files found in {input_dir}")
            sys.exit(1)

        print(f"Found {len(files)} files to process")

        success_count = 0
        for input_file in files:
            output_file = output_dir / input_file.name

            ext = input_file.suffix.lower()
            success = False

            if ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']:
                success = optimize_video(str(input_file), str(output_file),
                                        quality=args.quality, verbose=args.verbose)
            elif ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac']:
                success = optimize_audio(str(input_file), str(output_file),
                                        bitrate=args.bitrate, verbose=args.verbose)
            elif ext in ['.jpg', '.jpeg', '.png', '.webp']:
                success = optimize_image(str(input_file), str(output_file),
                                        max_width=args.max_width, quality=args.quality,
                                        verbose=args.verbose)

            if success:
                success_count += 1

        print(f"\nProcessed: {success_count}/{len(files)} files")


if __name__ == '__main__':
    main()
