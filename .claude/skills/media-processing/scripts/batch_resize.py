#!/usr/bin/env python3
"""
Batch image resizing with multiple strategies.

Supports aspect ratio maintenance, smart cropping, thumbnail generation,
watermarks, format conversion, and parallel processing.
"""

import argparse
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Optional, Tuple


class ImageResizer:
    """Handle image resizing operations using ImageMagick."""

    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.verbose = verbose
        self.dry_run = dry_run

    def check_imagemagick(self) -> bool:
        """Check if ImageMagick is available."""
        try:
            subprocess.run(
                ['magick', '-version'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def build_resize_command(
        self,
        input_path: Path,
        output_path: Path,
        width: Optional[int],
        height: Optional[int],
        strategy: str,
        quality: int,
        watermark: Optional[Path] = None
    ) -> List[str]:
        """Build ImageMagick resize command based on strategy."""
        cmd = ['magick', str(input_path)]

        # Apply resize strategy
        if strategy == 'fit':
            # Fit within dimensions, maintain aspect ratio
            geometry = f"{width or ''}x{height or ''}"
            cmd.extend(['-resize', geometry])

        elif strategy == 'fill':
            # Fill dimensions, crop excess
            if not width or not height:
                raise ValueError("Both width and height required for 'fill' strategy")
            cmd.extend([
                '-resize', f'{width}x{height}^',
                '-gravity', 'center',
                '-extent', f'{width}x{height}'
            ])

        elif strategy == 'cover':
            # Cover dimensions, may exceed
            if not width or not height:
                raise ValueError("Both width and height required for 'cover' strategy")
            cmd.extend(['-resize', f'{width}x{height}^'])

        elif strategy == 'exact':
            # Force exact dimensions, ignore aspect ratio
            if not width or not height:
                raise ValueError("Both width and height required for 'exact' strategy")
            cmd.extend(['-resize', f'{width}x{height}!'])

        elif strategy == 'thumbnail':
            # Create square thumbnail
            size = width or height or 200
            cmd.extend([
                '-resize', f'{size}x{size}^',
                '-gravity', 'center',
                '-extent', f'{size}x{size}'
            ])

        # Add watermark if specified
        if watermark:
            cmd.extend([
                str(watermark),
                '-gravity', 'southeast',
                '-geometry', '+10+10',
                '-composite'
            ])

        # Output settings
        cmd.extend([
            '-quality', str(quality),
            '-strip',
            str(output_path)
        ])

        return cmd

    def resize_image(
        self,
        input_path: Path,
        output_path: Path,
        width: Optional[int],
        height: Optional[int],
        strategy: str = 'fit',
        quality: int = 85,
        watermark: Optional[Path] = None
    ) -> bool:
        """Resize a single image."""
        try:
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)

            cmd = self.build_resize_command(
                input_path, output_path, width, height,
                strategy, quality, watermark
            )

            if self.verbose or self.dry_run:
                print(f"Command: {' '.join(cmd)}")

            if self.dry_run:
                return True

            subprocess.run(
                cmd,
                stdout=subprocess.PIPE if not self.verbose else None,
                stderr=subprocess.PIPE if not self.verbose else None,
                check=True
            )
            return True

        except subprocess.CalledProcessError as e:
            print(f"Error resizing {input_path}: {e}", file=sys.stderr)
            if not self.verbose and e.stderr:
                print(e.stderr.decode(), file=sys.stderr)
            return False
        except Exception as e:
            print(f"Error processing {input_path}: {e}", file=sys.stderr)
            return False

    def batch_resize(
        self,
        input_paths: List[Path],
        output_dir: Path,
        width: Optional[int],
        height: Optional[int],
        strategy: str = 'fit',
        quality: int = 85,
        format_ext: Optional[str] = None,
        watermark: Optional[Path] = None,
        parallel: int = 1
    ) -> Tuple[int, int]:
        """Resize multiple images."""
        success_count = 0
        fail_count = 0

        def process_image(input_path: Path) -> Tuple[Path, bool]:
            """Process single image for parallel execution."""
            if not input_path.exists() or not input_path.is_file():
                return input_path, False

            # Determine output path
            output_name = input_path.stem
            if format_ext:
                output_path = output_dir / f"{output_name}.{format_ext.lstrip('.')}"
            else:
                output_path = output_dir / input_path.name

            if not self.dry_run:
                print(f"Processing {input_path.name} -> {output_path.name}")

            success = self.resize_image(
                input_path, output_path, width, height,
                strategy, quality, watermark
            )

            return input_path, success

        # Process images
        if parallel > 1:
            with ThreadPoolExecutor(max_workers=parallel) as executor:
                futures = [executor.submit(process_image, path) for path in input_paths]

                for future in as_completed(futures):
                    _, success = future.result()
                    if success:
                        success_count += 1
                    else:
                        fail_count += 1
        else:
            for input_path in input_paths:
                _, success = process_image(input_path)
                if success:
                    success_count += 1
                else:
                    fail_count += 1

        return success_count, fail_count


def collect_images(paths: List[Path], recursive: bool = False) -> List[Path]:
    """Collect image files from paths."""
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'}
    images = []

    for path in paths:
        if path.is_file() and path.suffix.lower() in image_exts:
            images.append(path)
        elif path.is_dir():
            pattern = '**/*' if recursive else '*'
            for img_path in path.glob(pattern):
                if img_path.is_file() and img_path.suffix.lower() in image_exts:
                    images.append(img_path)

    return images


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Batch image resizing with multiple strategies.'
    )
    parser.add_argument(
        'inputs',
        nargs='+',
        type=Path,
        help='Input image(s) or directory'
    )
    parser.add_argument(
        '-o', '--output',
        type=Path,
        required=True,
        help='Output directory'
    )
    parser.add_argument(
        '-w', '--width',
        type=int,
        help='Target width in pixels'
    )
    parser.add_argument(
        '-h', '--height',
        type=int,
        dest='img_height',
        help='Target height in pixels'
    )
    parser.add_argument(
        '-s', '--strategy',
        choices=['fit', 'fill', 'cover', 'exact', 'thumbnail'],
        default='fit',
        help='Resize strategy (default: fit)'
    )
    parser.add_argument(
        '-q', '--quality',
        type=int,
        default=85,
        help='Output quality 0-100 (default: 85)'
    )
    parser.add_argument(
        '-f', '--format',
        help='Output format (e.g., jpg, png, webp)'
    )
    parser.add_argument(
        '-wm', '--watermark',
        type=Path,
        help='Watermark image to overlay'
    )
    parser.add_argument(
        '-p', '--parallel',
        type=int,
        default=1,
        help='Number of parallel processes (default: 1)'
    )
    parser.add_argument(
        '-r', '--recursive',
        action='store_true',
        help='Process directories recursively'
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

    # Validate dimensions
    if not args.width and not args.img_height:
        print("Error: At least one of --width or --height required", file=sys.stderr)
        sys.exit(1)

    # Initialize resizer
    resizer = ImageResizer(verbose=args.verbose, dry_run=args.dry_run)

    # Check dependencies
    if not resizer.check_imagemagick():
        print("Error: ImageMagick not found", file=sys.stderr)
        sys.exit(1)

    # Collect input images
    images = collect_images(args.inputs, args.recursive)

    if not images:
        print("Error: No images found", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(images)} image(s) to process")

    # Create output directory
    if not args.dry_run:
        args.output.mkdir(parents=True, exist_ok=True)

    # Process images
    success, fail = resizer.batch_resize(
        images,
        args.output,
        args.width,
        args.img_height,
        args.strategy,
        args.quality,
        args.format,
        args.watermark,
        args.parallel
    )

    print(f"\nResults: {success} succeeded, {fail} failed")
    sys.exit(0 if fail == 0 else 1)


if __name__ == '__main__':
    main()
