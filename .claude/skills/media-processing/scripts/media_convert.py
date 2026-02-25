#!/usr/bin/env python3
"""
Unified media conversion tool for video, audio, and images.

Auto-detects format and applies appropriate tool (FFmpeg or ImageMagick).
Supports quality presets, batch processing, and dry-run mode.
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple


# Format mappings
VIDEO_FORMATS = {'.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v'}
AUDIO_FORMATS = {'.mp3', '.aac', '.m4a', '.opus', '.flac', '.wav', '.ogg'}
IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'}

# Quality presets
QUALITY_PRESETS = {
    'web': {
        'video_crf': 23,
        'video_preset': 'medium',
        'audio_bitrate': '128k',
        'image_quality': 85
    },
    'archive': {
        'video_crf': 18,
        'video_preset': 'slow',
        'audio_bitrate': '192k',
        'image_quality': 95
    },
    'mobile': {
        'video_crf': 26,
        'video_preset': 'fast',
        'audio_bitrate': '96k',
        'image_quality': 80
    }
}


def check_dependencies() -> Tuple[bool, bool]:
    """Check if ffmpeg and imagemagick are available."""
    ffmpeg_available = subprocess.run(
        ['ffmpeg', '-version'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    ).returncode == 0

    magick_available = subprocess.run(
        ['magick', '-version'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    ).returncode == 0

    return ffmpeg_available, magick_available


def detect_media_type(file_path: Path) -> str:
    """Detect media type from file extension."""
    ext = file_path.suffix.lower()

    if ext in VIDEO_FORMATS:
        return 'video'
    elif ext in AUDIO_FORMATS:
        return 'audio'
    elif ext in IMAGE_FORMATS:
        return 'image'
    else:
        return 'unknown'


def build_video_command(
    input_path: Path,
    output_path: Path,
    preset: str = 'web'
) -> List[str]:
    """Build FFmpeg command for video conversion."""
    quality = QUALITY_PRESETS[preset]

    return [
        'ffmpeg', '-i', str(input_path),
        '-c:v', 'libx264',
        '-preset', quality['video_preset'],
        '-crf', str(quality['video_crf']),
        '-c:a', 'aac',
        '-b:a', quality['audio_bitrate'],
        '-movflags', '+faststart',
        '-y',
        str(output_path)
    ]


def build_audio_command(
    input_path: Path,
    output_path: Path,
    preset: str = 'web'
) -> List[str]:
    """Build FFmpeg command for audio conversion."""
    quality = QUALITY_PRESETS[preset]
    output_ext = output_path.suffix.lower()

    codec_map = {
        '.mp3': 'libmp3lame',
        '.aac': 'aac',
        '.m4a': 'aac',
        '.opus': 'libopus',
        '.flac': 'flac',
        '.wav': 'pcm_s16le',
        '.ogg': 'libvorbis'
    }

    codec = codec_map.get(output_ext, 'aac')

    cmd = ['ffmpeg', '-i', str(input_path), '-c:a', codec]

    # Add bitrate for lossy codecs
    if codec not in ['flac', 'pcm_s16le']:
        cmd.extend(['-b:a', quality['audio_bitrate']])

    cmd.extend(['-y', str(output_path)])
    return cmd


def build_image_command(
    input_path: Path,
    output_path: Path,
    preset: str = 'web'
) -> List[str]:
    """Build ImageMagick command for image conversion."""
    quality = QUALITY_PRESETS[preset]

    return [
        'magick', str(input_path),
        '-quality', str(quality['image_quality']),
        '-strip',
        str(output_path)
    ]


def convert_file(
    input_path: Path,
    output_path: Path,
    preset: str = 'web',
    dry_run: bool = False,
    verbose: bool = False
) -> bool:
    """Convert a single media file."""
    media_type = detect_media_type(input_path)

    if media_type == 'unknown':
        print(f"Error: Unsupported format for {input_path}", file=sys.stderr)
        return False

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Build command based on media type
    if media_type == 'video':
        cmd = build_video_command(input_path, output_path, preset)
    elif media_type == 'audio':
        cmd = build_audio_command(input_path, output_path, preset)
    else:  # image
        cmd = build_image_command(input_path, output_path, preset)

    if verbose or dry_run:
        print(f"Command: {' '.join(cmd)}")

    if dry_run:
        return True

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE if not verbose else None,
            stderr=subprocess.PIPE if not verbose else None,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error converting {input_path}: {e}", file=sys.stderr)
        if not verbose and e.stderr:
            print(e.stderr.decode(), file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error converting {input_path}: {e}", file=sys.stderr)
        return False


def batch_convert(
    input_paths: List[Path],
    output_dir: Optional[Path] = None,
    output_format: Optional[str] = None,
    preset: str = 'web',
    dry_run: bool = False,
    verbose: bool = False
) -> Tuple[int, int]:
    """Convert multiple files."""
    success_count = 0
    fail_count = 0

    for input_path in input_paths:
        if not input_path.exists():
            print(f"Error: {input_path} not found", file=sys.stderr)
            fail_count += 1
            continue

        # Determine output path
        if output_dir:
            output_name = input_path.stem
            if output_format:
                output_path = output_dir / f"{output_name}.{output_format.lstrip('.')}"
            else:
                output_path = output_dir / input_path.name
        else:
            if output_format:
                output_path = input_path.with_suffix(f".{output_format.lstrip('.')}")
            else:
                print(f"Error: No output format specified for {input_path}", file=sys.stderr)
                fail_count += 1
                continue

        print(f"Converting {input_path.name} -> {output_path.name}")

        if convert_file(input_path, output_path, preset, dry_run, verbose):
            success_count += 1
        else:
            fail_count += 1

    return success_count, fail_count


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Unified media conversion tool for video, audio, and images.'
    )
    parser.add_argument(
        'inputs',
        nargs='+',
        type=Path,
        help='Input file(s) to convert'
    )
    parser.add_argument(
        '-o', '--output',
        type=Path,
        help='Output file or directory for batch conversion'
    )
    parser.add_argument(
        '-f', '--format',
        help='Output format (e.g., mp4, jpg, mp3)'
    )
    parser.add_argument(
        '-p', '--preset',
        choices=['web', 'archive', 'mobile'],
        default='web',
        help='Quality preset (default: web)'
    )
    parser.add_argument(
        '-n', '--dry-run',
        action='store_true',
        help='Show commands without executing'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Check dependencies
    ffmpeg_ok, magick_ok = check_dependencies()
    if not ffmpeg_ok and not magick_ok:
        print("Error: Neither ffmpeg nor imagemagick found", file=sys.stderr)
        sys.exit(1)

    # Handle single file vs batch conversion
    if len(args.inputs) == 1 and args.output and not args.output.is_dir():
        # Single file conversion
        success = convert_file(
            args.inputs[0],
            args.output,
            args.preset,
            args.dry_run,
            args.verbose
        )
        sys.exit(0 if success else 1)
    else:
        # Batch conversion
        output_dir = args.output if args.output else Path.cwd()
        if not args.output:
            output_dir = None  # Will convert in place with new format

        success, fail = batch_convert(
            args.inputs,
            output_dir,
            args.format,
            args.preset,
            args.dry_run,
            args.verbose
        )

        print(f"\nResults: {success} succeeded, {fail} failed")
        sys.exit(0 if fail == 0 else 1)


if __name__ == '__main__':
    main()
