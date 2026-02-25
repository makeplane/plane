#!/usr/bin/env python3
"""
Video size optimization with quality/size balance.

Supports resolution reduction, frame rate adjustment, audio bitrate optimization,
multi-pass encoding, and comparison metrics.
"""

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple


@dataclass
class VideoInfo:
    """Video file information."""
    path: Path
    duration: float
    width: int
    height: int
    bitrate: int
    fps: float
    size: int
    codec: str
    audio_codec: str
    audio_bitrate: int


class VideoOptimizer:
    """Handle video optimization operations using FFmpeg."""

    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.verbose = verbose
        self.dry_run = dry_run

    def check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available."""
        try:
            subprocess.run(
                ['ffmpeg', '-version'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def get_video_info(self, input_path: Path) -> Optional[VideoInfo]:
        """Extract video information using ffprobe."""
        try:
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                str(input_path)
            ]

            result = subprocess.run(cmd, capture_output=True, check=True)
            data = json.loads(result.stdout)

            # Find video and audio streams
            video_stream = None
            audio_stream = None

            for stream in data['streams']:
                if stream['codec_type'] == 'video' and not video_stream:
                    video_stream = stream
                elif stream['codec_type'] == 'audio' and not audio_stream:
                    audio_stream = stream

            if not video_stream:
                return None

            # Parse frame rate
            fps_parts = video_stream.get('r_frame_rate', '0/1').split('/')
            fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 0

            return VideoInfo(
                path=input_path,
                duration=float(data['format'].get('duration', 0)),
                width=int(video_stream.get('width', 0)),
                height=int(video_stream.get('height', 0)),
                bitrate=int(data['format'].get('bit_rate', 0)),
                fps=fps,
                size=int(data['format'].get('size', 0)),
                codec=video_stream.get('codec_name', 'unknown'),
                audio_codec=audio_stream.get('codec_name', 'none') if audio_stream else 'none',
                audio_bitrate=int(audio_stream.get('bit_rate', 0)) if audio_stream else 0
            )

        except Exception as e:
            print(f"Error getting video info: {e}", file=sys.stderr)
            return None

    def calculate_target_resolution(
        self,
        width: int,
        height: int,
        max_width: Optional[int],
        max_height: Optional[int]
    ) -> Tuple[int, int]:
        """Calculate target resolution maintaining aspect ratio."""
        if not max_width and not max_height:
            return width, height

        aspect_ratio = width / height

        if max_width and max_height:
            # Fit within both constraints
            if width > max_width or height > max_height:
                if width / max_width > height / max_height:
                    new_width = max_width
                    new_height = int(max_width / aspect_ratio)
                else:
                    new_height = max_height
                    new_width = int(max_height * aspect_ratio)
            else:
                new_width, new_height = width, height
        elif max_width:
            new_width = min(width, max_width)
            new_height = int(new_width / aspect_ratio)
        else:
            new_height = min(height, max_height)
            new_width = int(new_height * aspect_ratio)

        # Ensure dimensions are even (required by some codecs)
        new_width = new_width - (new_width % 2)
        new_height = new_height - (new_height % 2)

        return new_width, new_height

    def optimize_video(
        self,
        input_path: Path,
        output_path: Path,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        target_fps: Optional[float] = None,
        crf: int = 23,
        audio_bitrate: str = '128k',
        preset: str = 'medium',
        two_pass: bool = False
    ) -> bool:
        """Optimize a video file."""
        # Get input video info
        info = self.get_video_info(input_path)
        if not info:
            print(f"Error: Could not read video info for {input_path}", file=sys.stderr)
            return False

        if self.verbose:
            print(f"\nInput video info:")
            print(f"  Resolution: {info.width}x{info.height}")
            print(f"  FPS: {info.fps:.2f}")
            print(f"  Bitrate: {info.bitrate // 1000} kbps")
            print(f"  Size: {info.size / (1024*1024):.2f} MB")

        # Calculate target resolution
        target_width, target_height = self.calculate_target_resolution(
            info.width, info.height, max_width, max_height
        )

        # Build FFmpeg command
        cmd = ['ffmpeg', '-i', str(input_path)]

        # Video filters
        filters = []
        if target_width != info.width or target_height != info.height:
            filters.append(f'scale={target_width}:{target_height}')

        if filters:
            cmd.extend(['-vf', ','.join(filters)])

        # Frame rate adjustment
        if target_fps and target_fps < info.fps:
            cmd.extend(['-r', str(target_fps)])

        # Video encoding
        if two_pass:
            # Two-pass encoding for better quality
            target_bitrate = int(info.bitrate * 0.7)  # 30% reduction

            # Pass 1
            pass1_cmd = cmd + [
                '-c:v', 'libx264',
                '-preset', preset,
                '-b:v', str(target_bitrate),
                '-pass', '1',
                '-an',
                '-f', 'null',
                '/dev/null' if sys.platform != 'win32' else 'NUL'
            ]

            if self.verbose or self.dry_run:
                print(f"Pass 1: {' '.join(pass1_cmd)}")

            if not self.dry_run:
                try:
                    subprocess.run(pass1_cmd, check=True, capture_output=not self.verbose)
                except subprocess.CalledProcessError as e:
                    print(f"Error in pass 1: {e}", file=sys.stderr)
                    return False

            # Pass 2
            cmd.extend([
                '-c:v', 'libx264',
                '-preset', preset,
                '-b:v', str(target_bitrate),
                '-pass', '2'
            ])
        else:
            # Single-pass CRF encoding
            cmd.extend([
                '-c:v', 'libx264',
                '-preset', preset,
                '-crf', str(crf)
            ])

        # Audio encoding
        cmd.extend([
            '-c:a', 'aac',
            '-b:a', audio_bitrate
        ])

        # Output
        cmd.extend(['-movflags', '+faststart', '-y', str(output_path)])

        if self.verbose or self.dry_run:
            print(f"Command: {' '.join(cmd)}")

        if self.dry_run:
            return True

        # Execute
        try:
            subprocess.run(cmd, check=True, capture_output=not self.verbose)

            # Get output info
            output_info = self.get_video_info(output_path)
            if output_info and self.verbose:
                print(f"\nOutput video info:")
                print(f"  Resolution: {output_info.width}x{output_info.height}")
                print(f"  FPS: {output_info.fps:.2f}")
                print(f"  Bitrate: {output_info.bitrate // 1000} kbps")
                print(f"  Size: {output_info.size / (1024*1024):.2f} MB")
                reduction = (1 - output_info.size / info.size) * 100
                print(f"  Size reduction: {reduction:.1f}%")

            return True

        except subprocess.CalledProcessError as e:
            print(f"Error optimizing video: {e}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"Error optimizing video: {e}", file=sys.stderr)
            return False
        finally:
            # Clean up two-pass log files
            if two_pass and not self.dry_run:
                for log_file in Path('.').glob('ffmpeg2pass-*.log*'):
                    log_file.unlink(missing_ok=True)

    def compare_videos(self, original: Path, optimized: Path) -> None:
        """Compare original and optimized videos."""
        orig_info = self.get_video_info(original)
        opt_info = self.get_video_info(optimized)

        if not orig_info or not opt_info:
            print("Error: Could not compare videos", file=sys.stderr)
            return

        print(f"\n{'Metric':<20} {'Original':<20} {'Optimized':<20} {'Change':<15}")
        print("-" * 75)

        # Resolution
        orig_res = f"{orig_info.width}x{orig_info.height}"
        opt_res = f"{opt_info.width}x{opt_info.height}"
        print(f"{'Resolution':<20} {orig_res:<20} {opt_res:<20}")

        # FPS
        fps_change = opt_info.fps - orig_info.fps
        print(f"{'FPS':<20} {orig_info.fps:<20.2f} {opt_info.fps:<20.2f} {fps_change:+.2f}")

        # Bitrate
        orig_br = f"{orig_info.bitrate // 1000} kbps"
        opt_br = f"{opt_info.bitrate // 1000} kbps"
        br_change = ((opt_info.bitrate / orig_info.bitrate) - 1) * 100
        print(f"{'Bitrate':<20} {orig_br:<20} {opt_br:<20} {br_change:+.1f}%")

        # Size
        orig_size = f"{orig_info.size / (1024*1024):.2f} MB"
        opt_size = f"{opt_info.size / (1024*1024):.2f} MB"
        size_reduction = (1 - opt_info.size / orig_info.size) * 100
        print(f"{'Size':<20} {orig_size:<20} {opt_size:<20} {-size_reduction:.1f}%")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Video size optimization with quality/size balance.'
    )
    parser.add_argument(
        'input',
        type=Path,
        help='Input video file'
    )
    parser.add_argument(
        '-o', '--output',
        type=Path,
        required=True,
        help='Output video file'
    )
    parser.add_argument(
        '-w', '--max-width',
        type=int,
        help='Maximum width in pixels'
    )
    parser.add_argument(
        '-H', '--max-height',
        type=int,
        help='Maximum height in pixels'
    )
    parser.add_argument(
        '--fps',
        type=float,
        help='Target frame rate'
    )
    parser.add_argument(
        '--crf',
        type=int,
        default=23,
        help='CRF quality (18-28, lower=better, default: 23)'
    )
    parser.add_argument(
        '--audio-bitrate',
        default='128k',
        help='Audio bitrate (default: 128k)'
    )
    parser.add_argument(
        '--preset',
        choices=['ultrafast', 'superfast', 'veryfast', 'faster', 'fast',
                 'medium', 'slow', 'slower', 'veryslow'],
        default='medium',
        help='Encoding preset (default: medium)'
    )
    parser.add_argument(
        '--two-pass',
        action='store_true',
        help='Use two-pass encoding (better quality)'
    )
    parser.add_argument(
        '--compare',
        action='store_true',
        help='Compare original and optimized videos'
    )
    parser.add_argument(
        '-n', '--dry-run',
        action='store_true',
        help='Show command without executing'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Validate input
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # Initialize optimizer
    optimizer = VideoOptimizer(verbose=args.verbose, dry_run=args.dry_run)

    # Check dependencies
    if not optimizer.check_ffmpeg():
        print("Error: FFmpeg not found", file=sys.stderr)
        sys.exit(1)

    # Optimize video
    print(f"Optimizing {args.input.name}...")
    success = optimizer.optimize_video(
        args.input,
        args.output,
        args.max_width,
        args.max_height,
        args.fps,
        args.crf,
        args.audio_bitrate,
        args.preset,
        args.two_pass
    )

    if not success:
        sys.exit(1)

    # Compare if requested
    if args.compare and not args.dry_run:
        optimizer.compare_videos(args.input, args.output)

    print(f"\nOptimized video saved to: {args.output}")


if __name__ == '__main__':
    main()
