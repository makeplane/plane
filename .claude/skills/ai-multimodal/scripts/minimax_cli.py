#!/usr/bin/env python3
"""
MiniMax CLI entry point - standalone CLI for MiniMax generation tasks.

Can be called directly or delegated to from gemini_batch_process.py
when MiniMax models are detected.

Usage:
  python minimax_cli.py --task generate --prompt "A cat" --model image-01
  python minimax_cli.py --task generate-video --prompt "A dancer" --model MiniMax-Hailuo-2.3
  python minimax_cli.py --task generate-speech --text "Hello" --model speech-2.8-hd --voice English_Warm_Bestie
  python minimax_cli.py --task generate-music --lyrics "La la la" --prompt "pop song" --model music-2.5
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

from minimax_api_client import find_minimax_api_key
from minimax_generate import (
    generate_image, generate_video, generate_speech, generate_music
)

TASK_DEFAULTS = {
    'generate': 'image-01',
    'generate-video': 'MiniMax-Hailuo-2.3',
    'generate-speech': 'speech-2.8-hd',
    'generate-music': 'music-2.5'
}


def main():
    parser = argparse.ArgumentParser(
        description='MiniMax AI generation CLI (image/video/speech/music)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate image
  %(prog)s --task generate --prompt "A cyberpunk city at night" --model image-01 --aspect-ratio 16:9

  # Generate video (async, ~30-60s)
  %(prog)s --task generate-video --prompt "A dancer performing" --model MiniMax-Hailuo-2.3

  # Generate speech
  %(prog)s --task generate-speech --text "Welcome to the show" --model speech-2.8-hd --voice English_Warm_Bestie

  # Generate music with lyrics
  %(prog)s --task generate-music --lyrics "Verse 1\\nHello world" --prompt "upbeat pop" --model music-2.5
        """
    )

    parser.add_argument('--task', required=True,
                        choices=['generate', 'generate-video',
                                 'generate-speech', 'generate-music'],
                        help='Generation task type')
    parser.add_argument('--prompt', help='Text prompt for generation')
    parser.add_argument('--text', help='Text for speech generation')
    parser.add_argument('--lyrics', help='Lyrics for music generation')
    parser.add_argument('--model', help='Model name (auto-detected from task)')
    parser.add_argument('--aspect-ratio', default='1:1',
                        choices=['1:1', '16:9', '4:3', '3:2', '2:3',
                                 '3:4', '9:16', '21:9'],
                        help='Aspect ratio for image generation')
    parser.add_argument('--num-images', type=int, default=1,
                        help='Number of images (1-9, default: 1)')
    parser.add_argument('--duration', type=int, default=6,
                        choices=[6, 10],
                        help='Video duration in seconds (6 or 10)')
    parser.add_argument('--resolution', default='1080P',
                        choices=['720P', '1080P'],
                        help='Video resolution')
    parser.add_argument('--voice', default='English_expressive_narrator',
                        help='Voice ID for speech (default: English_expressive_narrator)')
    parser.add_argument('--emotion', default='neutral',
                        choices=['happy', 'sad', 'angry', 'fearful',
                                 'disgusted', 'surprised', 'neutral'],
                        help='Emotion for speech')
    parser.add_argument('--output-format', default='mp3',
                        choices=['mp3', 'wav', 'flac', 'pcm'],
                        help='Audio output format')
    parser.add_argument('--first-frame', help='Image URL for video first frame')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--verbose', '-v', action='store_true')

    args = parser.parse_args()

    # Auto-detect model from task
    if not args.model:
        args.model = TASK_DEFAULTS.get(args.task, 'image-01')
        if args.verbose:
            print(f"Auto-detected model: {args.model}")

    # Find API key
    api_key = find_minimax_api_key()
    if not api_key:
        print("Error: MINIMAX_API_KEY not found")
        print("\nSetup:")
        print("1. export MINIMAX_API_KEY='your-key'")
        print("2. Or add to .env: MINIMAX_API_KEY=your-key")
        print("\nGet key at: https://platform.minimax.io/user-center/basic-information/interface-key")
        sys.exit(1)

    # Dispatch to task handler
    try:
        if args.task == 'generate':
            if not args.prompt:
                parser.error("--prompt required for image generation")
            result = generate_image(
                api_key, args.prompt, args.model,
                args.aspect_ratio, args.num_images,
                args.output, args.verbose
            )
        elif args.task == 'generate-video':
            if not args.prompt:
                parser.error("--prompt required for video generation")
            result = generate_video(
                api_key, args.prompt, args.model,
                args.duration, args.resolution,
                args.first_frame, args.output, args.verbose
            )
        elif args.task == 'generate-speech':
            text = args.text or args.prompt
            if not text:
                parser.error("--text or --prompt required for speech")
            result = generate_speech(
                api_key, text, args.model,
                args.voice, args.emotion, args.output_format,
                output=args.output, verbose=args.verbose
            )
        elif args.task == 'generate-music':
            if not args.lyrics and not args.prompt:
                parser.error("--lyrics or --prompt required for music")
            result = generate_music(
                api_key, args.lyrics or '', args.prompt or '',
                args.model, args.output_format,
                args.output, args.verbose
            )
        else:
            parser.error(f"Unknown task: {args.task}")
            return

        # Print results
        print_result(result, args.task)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)


def print_result(result: dict, task: str):
    """Print generation result in LLM-friendly format."""
    print(f"\n=== RESULTS ===\n")
    print(f"[{task}]")
    print(f"Status: {result.get('status', 'unknown')}")

    if result.get('status') == 'success':
        if 'generated_images' in result:
            for img in result['generated_images']:
                print(f"Generated image: {img}")
        if 'generated_video' in result:
            print(f"Generated video: {result['generated_video']}")
            if 'generation_time' in result:
                print(f"Generation time: {result['generation_time']:.1f}s")
        if 'generated_audio' in result:
            print(f"Generated audio: {result['generated_audio']}")
            if 'duration_ms' in result:
                dur = result['duration_ms'] / 1000
                print(f"Duration: {dur:.1f}s")
    elif result.get('error'):
        print(f"Error: {result['error']}")

    print(f"\nModel: {result.get('model', 'unknown')}")


if __name__ == '__main__':
    main()
