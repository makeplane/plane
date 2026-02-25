#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Artist Generate - Nano Banana image generation with 3 creative modes

Uses 129 actual prompts from awesome-nano-banana-pro-prompts collection.

Usage:
    python generate.py "<concept>" --output <path.png> [options]

Modes:
    --mode search   : Find best matching prompt (default)
    --mode creative : Remix elements from multiple prompts
    --mode wild     : AI-enhanced out-of-the-box interpretation
    --mode all      : Generate all 3 variations
"""

import argparse
import sys
import os
import re
import random
from pathlib import Path

# Add parent for core imports
sys.path.insert(0, str(Path(__file__).parent))
from core import search

# Gemini API setup
CLAUDE_ROOT = Path.home() / '.claude'
sys.path.insert(0, str(CLAUDE_ROOT / 'scripts'))
PROJECT_CLAUDE = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_CLAUDE / 'scripts'))
try:
    from resolve_env import resolve_env
    CENTRALIZED_RESOLVER = True
except ImportError:
    CENTRALIZED_RESOLVER = False
    try:
        from dotenv import load_dotenv
        load_dotenv(Path.home() / '.claude' / '.env')
        load_dotenv(Path.home() / '.claude' / 'skills' / '.env')
    except ImportError:
        pass

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


# ============ CONFIGURATION ============
NANO_BANANA_MODELS = {
    "flash": "gemini-2.5-flash-image",
    "pro": "gemini-3-pro-image-preview",
}
DEFAULT_MODEL = "flash"
ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]


def get_api_key() -> str:
    """Get Gemini API key from environment."""
    if CENTRALIZED_RESOLVER:
        return resolve_env('GEMINI_API_KEY', skill='ai-multimodal')
    return os.getenv('GEMINI_API_KEY')


def adapt_prompt(template_prompt: str, concept: str, **kwargs) -> str:
    """Adapt a template prompt to the user's concept.

    Intelligently replaces variables and adapts the prompt while keeping
    the original structure and Nano Banana narrative style.
    """
    prompt = template_prompt

    # Replace common variable patterns
    replacements = {
        # Raycast-style arguments
        r'\{argument name="[^"]*" default="[^"]*"\}': concept,
        r'\{argument name=[^}]+\}': concept,
        # Bracket variables
        r'\[insert [^\]]+\]': concept,
        r'\[subject\]': concept,
        r'\[concept\]': concept,
        r'\[topic\]': concept,
        r'\[product\]': concept,
        r'\[scene\]': concept,
        r'\[description\]': concept,
        # Generic placeholders
        r'\{[^}]+\}': lambda m: kwargs.get(m.group(0)[1:-1], concept),
    }

    for pattern, replacement in replacements.items():
        if callable(replacement):
            prompt = re.sub(pattern, replacement, prompt, flags=re.IGNORECASE)
        else:
            prompt = re.sub(pattern, replacement, prompt, flags=re.IGNORECASE)

    # Ensure negative constraints exist (Nano Banana style)
    if "NEVER" not in prompt and "DO NOT" not in prompt:
        prompt += " NEVER add watermarks or unwanted text. DO NOT include labels."

    return prompt


def mode_search(concept: str, verbose: bool = False) -> tuple[str, dict]:
    """Mode 1: Find best matching prompt from awesome collection."""
    result = search(concept, "awesome", 1)

    if result.get("count", 0) > 0:
        match = result["results"][0]
        prompt = adapt_prompt(match["prompt"], concept)

        if verbose:
            print(f"  [SEARCH] Matched: {match['title'][:60]}...")
            print(f"  Author: {match.get('author', 'Unknown')}")

        return prompt, {"mode": "search", "match": match}

    # Fallback to basic prompt
    prompt = f"A professional image of {concept}. High quality, detailed. Professional photography. NEVER add watermarks."
    return prompt, {"mode": "search", "match": None}


def mode_creative(concept: str, verbose: bool = False) -> tuple[str, dict]:
    """Mode 2: Creative remix - combine elements from multiple prompts."""
    # Get top 3 matches
    result = search(concept, "awesome", 3)
    matches = result.get("results", [])

    if len(matches) < 2:
        return mode_search(concept, verbose)

    # Extract key elements from each prompt
    elements = []
    for m in matches:
        prompt = m.get("prompt", "")
        # Extract style descriptions, lighting, composition hints
        if "style" in prompt.lower() or "lighting" in prompt.lower():
            elements.append(prompt[:200])

    if verbose:
        print(f"  [CREATIVE] Remixing {len(matches)} prompts:")
        for m in matches:
            print(f"    - {m['title'][:50]}...")

    # Build creative remix
    base = matches[0]["prompt"]
    style_hints = []

    # Extract style from second match
    if len(matches) > 1:
        m2 = matches[1]["prompt"]
        style_match = re.search(r'(style[^.]+\.)', m2, re.IGNORECASE)
        if style_match:
            style_hints.append(style_match.group(1))

    # Extract lighting/mood from third match
    if len(matches) > 2:
        m3 = matches[2]["prompt"]
        light_match = re.search(r'(lighting[^.]+\.)', m3, re.IGNORECASE)
        if light_match:
            style_hints.append(light_match.group(1))

    # Adapt and enhance
    prompt = adapt_prompt(base, concept)
    if style_hints:
        prompt += " " + " ".join(style_hints)

    return prompt, {"mode": "creative", "matches": [m["title"] for m in matches]}


def mode_wild(concept: str, verbose: bool = False) -> tuple[str, dict]:
    """Mode 3: Wild/Out-of-the-box - AI-enhanced creative interpretation."""
    result = search(concept, "awesome", 5)
    matches = result.get("results", [])

    # Creative transformations
    transformations = [
        "reimagined as a Japanese Ukiyo-e woodblock print with Prussian blue and vermilion",
        "transformed into a premium liquid glass Bento grid infographic",
        "captured as a vintage 1800s patent document with technical drawings",
        "rendered as a surreal dreamscape with volumetric god rays",
        "depicted in cyberpunk neon aesthetic with holographic elements",
        "illustrated as a hand-drawn chalkboard explanation",
        "visualized as an isometric 3D diorama with miniature figures",
        "presented as a cinematic movie poster with dramatic lighting",
        "created as a vaporwave aesthetic with glitch effects and Roman statues",
        "designed as a premium Apple-style product showcase",
    ]

    # Pick random transformation
    transform = random.choice(transformations)

    if matches:
        # Use structure from a random match but apply wild transformation
        base = random.choice(matches)
        prompt = f"{concept}, {transform}. "

        # Extract any technical camera/quality settings from matched prompt
        tech_match = re.search(r'(\d+mm lens|f/[\d.]+|Canon|Nikon|professional photography)', base["prompt"])
        if tech_match:
            prompt += f"Shot with {tech_match.group(1)}. "

        if verbose:
            print(f"  [WILD] Transform: {transform}")
            print(f"  Based on: {base['title'][:50]}...")
    else:
        prompt = f"{concept}, {transform}. Professional quality."

    prompt += " NEVER add watermarks. DO NOT include unwanted text."

    return prompt, {"mode": "wild", "transformation": transform}


def generate_image(
    prompt: str,
    output_path: str,
    model: str = DEFAULT_MODEL,
    aspect_ratio: str = "1:1",
    size: str = "2K",
    verbose: bool = False
) -> dict:
    """Generate image using Nano Banana (Gemini image models)."""

    if not GENAI_AVAILABLE:
        return {"status": "error", "error": "google-genai not installed. Run: pip install google-genai"}

    api_key = get_api_key()
    if not api_key:
        return {"status": "error", "error": "GEMINI_API_KEY not found"}

    model_id = NANO_BANANA_MODELS.get(model, model)

    if verbose:
        print(f"\n[Nano Banana Generation]")
        print(f"  Model: {model_id}")
        print(f"  Aspect: {aspect_ratio}")
        print(f"  Prompt: {prompt[:100]}...")

    try:
        client = genai.Client(api_key=api_key)

        # Build config
        image_config_args = {'aspect_ratio': aspect_ratio}
        if 'pro' in model_id.lower() and size:
            image_config_args['image_size'] = size

        config = types.GenerateContentConfig(
            response_modalities=['IMAGE'],
            image_config=types.ImageConfig(**image_config_args)
        )

        response = client.models.generate_content(
            model=model_id,
            contents=[prompt],
            config=config
        )

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        if hasattr(response, 'candidates') and response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    with open(output_file, 'wb') as f:
                        f.write(part.inline_data.data)

                    if verbose:
                        print(f"  Generated: {output_file}")

                    return {"status": "success", "output": str(output_file), "model": model_id}

        return {"status": "error", "error": "No image in response"}

    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="AI Artist Generate - Nano Banana with 3 creative modes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Modes:
  search   : Find best matching prompt from 129 curated prompts (default)
  creative : Remix elements from multiple matching prompts
  wild     : AI-enhanced out-of-the-box creative interpretation
  all      : Generate all 3 variations

Examples:
  # Search mode (default)
  python generate.py "tech conference banner" -o banner.png

  # Creative remix
  python generate.py "AI workshop" -o workshop.png --mode creative

  # Wild/experimental
  python generate.py "product showcase" -o product.png --mode wild

  # Generate all 3 variations
  python generate.py "futuristic city" -o city.png --mode all
"""
    )

    parser.add_argument("concept", help="Core concept/subject to generate")
    parser.add_argument("--output", "-o", required=True, help="Output image path")
    parser.add_argument("--mode", "-m", choices=["search", "creative", "wild", "all"],
                       default="search", help="Generation mode")
    parser.add_argument("--model", choices=list(NANO_BANANA_MODELS.keys()),
                       default=DEFAULT_MODEL, help="Model: flash or pro")
    parser.add_argument("--aspect-ratio", "-ar", choices=ASPECT_RATIOS, default="1:1")
    parser.add_argument("--size", choices=["1K", "2K", "4K"], default="2K")
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--show-prompt", action="store_true", help="Print generated prompt")
    parser.add_argument("--dry-run", action="store_true", help="Build prompt without generating")

    args = parser.parse_args()

    if args.verbose:
        print(f"[Concept: {args.concept}]")

    # Determine modes to run
    modes = ["search", "creative", "wild"] if args.mode == "all" else [args.mode]

    for mode in modes:
        if args.verbose or len(modes) > 1:
            print(f"\n{'='*50}")
            print(f"[Mode: {mode.upper()}]")

        # Build prompt based on mode
        if mode == "search":
            prompt, meta = mode_search(args.concept, args.verbose)
        elif mode == "creative":
            prompt, meta = mode_creative(args.concept, args.verbose)
        elif mode == "wild":
            prompt, meta = mode_wild(args.concept, args.verbose)

        if args.show_prompt or args.verbose:
            print(f"\n[Prompt]\n{prompt}\n")

        if args.dry_run:
            print("[Dry run - no generation]")
            continue

        # Generate output path for mode
        output_path = args.output
        if len(modes) > 1:
            base = Path(args.output)
            output_path = str(base.parent / f"{base.stem}-{mode}{base.suffix}")

        result = generate_image(
            prompt=prompt,
            output_path=output_path,
            model=args.model,
            aspect_ratio=args.aspect_ratio,
            size=args.size,
            verbose=args.verbose
        )

        if result["status"] == "success":
            print(f"✓ Generated: {result['output']}")
        else:
            print(f"✗ Error: {result['error']}")


if __name__ == "__main__":
    main()
