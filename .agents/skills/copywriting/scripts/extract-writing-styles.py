#!/usr/bin/env python3
"""
Extract Writing Styles from assets/writing-styles/ directory.

Supports multiple file types:
- Text: .md, .txt
- Documents: .pdf, .docx, .xlsx, .pptx (via document_converter.py)
- Media: .jpg, .jpeg, .png, .webp, .mp4, .mov (via gemini_batch_process.py)

Usage:
    python extract-writing-styles.py --list         # List available style files
    python extract-writing-styles.py --style <name> # Extract specific style
    python extract-writing-styles.py --all          # Extract all styles
    python extract-writing-styles.py --all --json   # Output as JSON
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


# File type categories
TEXT_FORMATS = {'.md', '.txt'}
DOC_FORMATS = {'.pdf', '.docx', '.xlsx', '.pptx'}
IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}
VIDEO_FORMATS = {'.mp4', '.mov', '.avi', '.mkv'}
ALL_FORMATS = TEXT_FORMATS | DOC_FORMATS | IMAGE_FORMATS | VIDEO_FORMATS


def find_project_root(start_dir: Path) -> Path:
    """Find project root by looking for .claude directory."""
    for parent in [start_dir] + list(start_dir.parents):
        if (parent / '.claude').exists():
            return parent
    return start_dir


PROJECT_ROOT = find_project_root(Path(__file__).parent)
STYLES_DIR = PROJECT_ROOT / 'assets' / 'writing-styles'
AI_MULTIMODAL_SCRIPTS = PROJECT_ROOT / '.claude' / 'skills' / 'ai-multimodal' / 'scripts'


def get_style_files() -> Dict[str, Any]:
    """List all style files in the writing-styles directory."""
    if not STYLES_DIR.exists():
        return {'error': f'Directory not found: {STYLES_DIR}', 'files': []}

    files = []
    for f in STYLES_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in ALL_FORMATS:
            files.append({
                'name': f.stem,
                'path': str(f),
                'type': get_file_type(f),
                'size': f.stat().st_size
            })

    return {'files': sorted(files, key=lambda x: x['name']), 'directory': str(STYLES_DIR)}


def get_file_type(file_path: Path) -> str:
    """Categorize file by type."""
    ext = file_path.suffix.lower()
    if ext in TEXT_FORMATS:
        return 'text'
    if ext in DOC_FORMATS:
        return 'document'
    if ext in IMAGE_FORMATS:
        return 'image'
    if ext in VIDEO_FORMATS:
        return 'video'
    return 'unknown'


def extract_text_content(file_path: Path) -> str:
    """Extract content from text files (.md, .txt)."""
    try:
        return file_path.read_text(encoding='utf-8')
    except Exception as e:
        return f'Error reading file: {e}'


def extract_document_content(file_path: Path, verbose: bool = False) -> str:
    """Extract content from documents using document_converter.py."""
    converter = AI_MULTIMODAL_SCRIPTS / 'document_converter.py'
    if not converter.exists():
        return f'Error: document_converter.py not found at {converter}'

    output_file = STYLES_DIR / f'.temp_{file_path.stem}_extraction.md'

    try:
        cmd = [
            sys.executable, str(converter),
            '--input', str(file_path),
            '--output', str(output_file),
            '--prompt', '''Extract the writing style characteristics from this document.
Identify: tone, vocabulary, sentence structure, rhetorical devices, formatting patterns.
Output as structured markdown with clear sections.'''
        ]
        if verbose:
            cmd.append('--verbose')

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if output_file.exists():
            content = output_file.read_text(encoding='utf-8')
            output_file.unlink()  # Clean up temp file
            return content
        else:
            return f'Conversion failed: {result.stderr}'

    except subprocess.TimeoutExpired:
        return 'Error: Document conversion timed out'
    except Exception as e:
        return f'Error: {e}'


def extract_media_content(file_path: Path, verbose: bool = False) -> str:
    """Extract writing style from media using gemini_batch_process.py."""
    processor = AI_MULTIMODAL_SCRIPTS / 'gemini_batch_process.py'
    if not processor.exists():
        return f'Error: gemini_batch_process.py not found at {processor}'

    try:
        prompt = '''Analyze this content and identify any writing style characteristics visible.
Look for: text overlays, captions, typography choices, messaging tone, branding voice.
Describe the writing style in terms of: tone, vocabulary level, sentence structure, key phrases.
Output as structured analysis.'''

        cmd = [
            sys.executable, str(processor),
            '--files', str(file_path),
            '--task', 'analyze',
            '--prompt', prompt
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.stdout if result.stdout else result.stderr

    except subprocess.TimeoutExpired:
        return 'Error: Media analysis timed out'
    except Exception as e:
        return f'Error: {e}'


def extract_style_content(file_path: Path, verbose: bool = False) -> Dict[str, Any]:
    """Extract writing style content from any supported file type."""
    if not file_path.exists():
        return {'error': f'File not found: {file_path}'}

    file_type = get_file_type(file_path)

    if file_type == 'text':
        content = extract_text_content(file_path)
    elif file_type == 'document':
        content = extract_document_content(file_path, verbose)
    elif file_type in ('image', 'video'):
        content = extract_media_content(file_path, verbose)
    else:
        return {'error': f'Unsupported file type: {file_path.suffix}'}

    # Parse the content for style information
    result = {
        'file': str(file_path),
        'type': file_type,
        'title': '',
        'sections': [],
        'styles': [],
        'rawContent': content
    }

    # Extract title from first H1
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if title_match:
        result['title'] = title_match.group(1).strip()

    # Extract sections (H2 headers)
    for i, match in enumerate(re.finditer(r'^##\s+(.+)$', content, re.MULTILINE)):
        result['sections'].append({
            'title': match.group(1).strip(),
            'lineNumber': content[:match.start()].count('\n') + 1
        })

    # Extract style entries from tables
    table_pattern = r'\|.*?\|.*?\|.*?\|'
    for match in re.finditer(table_pattern, content, re.MULTILINE):
        row = match.group(0)
        if '---' not in row and 'Style' not in row:
            cols = [c.strip() for c in row.split('|') if c.strip()]
            if len(cols) >= 2:
                result['styles'].append({
                    'name': re.sub(r'\*+', '', cols[0]),
                    'keywords': cols[1] if len(cols) > 1 else '',
                    'description': ' | '.join(cols[2:]) if len(cols) > 2 else ''
                })

    return result


def format_output(data: Dict[str, Any], as_json: bool = False) -> str:
    """Format output for display."""
    if as_json:
        return json.dumps(data, indent=2, ensure_ascii=False)

    if 'error' in data:
        return f"Error: {data['error']}"

    output = []

    if 'files' in data:
        # List mode
        output.append('# Available Writing Styles\n')
        output.append(f"Directory: {data['directory']}\n")

        if not data['files']:
            output.append('\nNo style files found. Add files to assets/writing-styles/')
        else:
            output.append('\n| Style | Type | Size |')
            output.append('|---|---|---|')
            for f in data['files']:
                size_kb = f['size'] / 1024
                output.append(f"| {f['name']} | {f['type']} | {size_kb:.1f}KB |")

    elif 'title' in data:
        # Single style extraction
        if data.get('title'):
            output.append(f"# {data['title']}\n")

        output.append(f"**File Type:** {data.get('type', 'unknown')}\n")

        if data.get('styles'):
            output.append(f"\n## Extracted Styles ({len(data['styles'])})\n")
            for s in data['styles'][:30]:  # Limit to 30 styles
                output.append(f"### {s['name']}")
                output.append(f"**Keywords:** {s['keywords']}\n")

        if data.get('sections'):
            output.append('\n## Sections\n')
            for s in data['sections']:
                output.append(f"- {s['title']} (line {s['lineNumber']})")

    return '\n'.join(output)


def main():
    parser = argparse.ArgumentParser(
        description='Extract writing styles from assets/writing-styles/ directory',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Supported formats:
  Text:      .md, .txt
  Documents: .pdf, .docx, .xlsx, .pptx (requires GEMINI_API_KEY)
  Images:    .jpg, .jpeg, .png, .webp (requires GEMINI_API_KEY)
  Videos:    .mp4, .mov (requires GEMINI_API_KEY)

Examples:
  python extract-writing-styles.py --list
  python extract-writing-styles.py --style default
  python extract-writing-styles.py --all --json
        '''
    )

    parser.add_argument('--list', action='store_true', help='List available style files')
    parser.add_argument('--style', type=str, help='Extract specific style by name')
    parser.add_argument('--all', action='store_true', help='Extract all styles')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    args = parser.parse_args()

    if args.list or (not args.style and not args.all):
        result = get_style_files()
    elif args.style:
        # Find the file with matching name
        style_files = get_style_files()
        if 'error' in style_files:
            result = style_files
        else:
            matching = [f for f in style_files['files'] if f['name'] == args.style]
            if matching:
                result = extract_style_content(Path(matching[0]['path']), args.verbose)
            else:
                result = {'error': f"Style '{args.style}' not found"}
    elif args.all:
        style_files = get_style_files()
        if 'error' in style_files:
            result = style_files
        else:
            result = {
                'title': 'All Writing Styles',
                'files': []
            }
            for f in style_files['files']:
                extracted = extract_style_content(Path(f['path']), args.verbose)
                result['files'].append({'name': f['name'], **extracted})
    else:
        result = get_style_files()

    print(format_output(result, args.json))


if __name__ == '__main__':
    main()
