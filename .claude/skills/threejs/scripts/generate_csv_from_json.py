#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate CSV files from examples-raw.json
"""

import csv
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SKILL_DIR = Path(__file__).parent.parent


def extract_keywords_from_file(filename):
    """Extract keywords from filename"""
    base = filename.replace('.html', '')
    parts = base.split('_')
    return ', '.join([p for p in parts if len(p) > 1])


def extract_name_from_file(filename):
    """Extract display name from filename"""
    base = filename.replace('.html', '')
    parts = base.split('_')[1:]  # Remove prefix like 'webgl'
    return ' / '.join(parts)


def generate_csvs():
    """Generate tracking and examples CSVs from JSON"""
    json_file = DATA_DIR / "examples-raw.json"

    with open(json_file, 'r', encoding='utf-8') as f:
        examples = json.load(f)

    print(f"Loaded {len(examples)} examples from JSON")

    # Count by category
    categories = {}
    for ex in examples:
        cat = ex['c']
        categories[cat] = categories.get(cat, 0) + 1

    print("\nExamples by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    # Generate tracking CSV
    tracking_file = SKILL_DIR / "extraction-progress.csv"
    tracking_rows = []
    for i, ex in enumerate(examples, 1):
        tracking_rows.append({
            'ID': i,
            'Category': ex['c'],
            'Name': extract_name_from_file(ex['f']),
            'File': ex['f'],
            'URL': f"https://threejs.org/examples/{ex['f']}",
            'Keywords': extract_keywords_from_file(ex['f']),
            'Status': 'extracted',
            'Extracted_At': '2026-01-21'
        })

    with open(tracking_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ID', 'Category', 'Name', 'File', 'URL', 'Keywords', 'Status', 'Extracted_At'])
        writer.writeheader()
        writer.writerows(tracking_rows)
    print(f"\nGenerated {len(tracking_rows)} entries in {tracking_file}")

    # Generate examples-all.csv
    examples_file = DATA_DIR / "examples-all.csv"
    examples_rows = []
    for i, ex in enumerate(examples, 1):
        name = extract_name_from_file(ex['f'])
        keywords = extract_keywords_from_file(ex['f'])

        # Determine complexity based on category
        complexity = "medium"
        if "advanced" in ex['c'] or "gpgpu" in ex['f'] or "compute" in ex['f']:
            complexity = "high"
        elif "basic" in ex['f'] or ex['c'] in ['css2d', 'css3d', 'svg']:
            complexity = "low"

        # Generate use cases based on keywords
        use_cases = []
        file_lower = ex['f'].lower()
        if 'animation' in file_lower:
            use_cases.append('character animation')
        if 'loader' in file_lower:
            use_cases.append('model loading')
        if 'material' in file_lower:
            use_cases.append('material effects')
        if 'postprocessing' in file_lower:
            use_cases.append('visual effects')
        if 'shadow' in file_lower:
            use_cases.append('realistic lighting')
        if 'physics' in file_lower:
            use_cases.append('physics simulation')
        if 'xr' in file_lower or 'vr' in file_lower or 'ar' in file_lower:
            use_cases.append('VR/AR experience')
        if 'interactive' in file_lower or 'raycaster' in file_lower:
            use_cases.append('user interaction')
        if 'particle' in file_lower or 'points' in file_lower:
            use_cases.append('particle effects')
        if 'terrain' in file_lower or 'geometry' in file_lower:
            use_cases.append('procedural generation')
        if 'tsl' in file_lower:
            use_cases.append('shader programming')
        if 'compute' in file_lower:
            use_cases.append('GPU compute')
        if not use_cases:
            use_cases.append('3D visualization')

        desc = f"Three.js {ex['c']} example demonstrating {name.replace(' / ', ', ')}"

        examples_rows.append({
            'ID': i,
            'Category': ex['c'],
            'Name': name,
            'File': ex['f'],
            'URL': f"https://threejs.org/examples/{ex['f']}",
            'Keywords': keywords,
            'Complexity': complexity,
            'Use Cases': '; '.join(use_cases),
            'Description': desc
        })

    with open(examples_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ID', 'Category', 'Name', 'File', 'URL', 'Keywords', 'Complexity', 'Use Cases', 'Description'])
        writer.writeheader()
        writer.writerows(examples_rows)
    print(f"Generated {len(examples_rows)} entries in {examples_file}")


if __name__ == "__main__":
    generate_csvs()
