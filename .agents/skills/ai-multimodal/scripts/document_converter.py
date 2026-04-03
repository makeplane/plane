#!/usr/bin/env python3
"""
Convert documents to Markdown using Gemini API.

Supports all document types:
- PDF documents (native vision processing)
- Images (JPEG, PNG, WEBP, HEIC)
- Office documents (DOCX, XLSX, PPTX)
- HTML, TXT, and other text formats

Features:
- Converts to clean markdown format
- Preserves structure, tables, and formatting
- Extracts text from images and scanned documents
- Batch conversion support
- Saves to docs/assets/document-extraction.md by default
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed")
    print("Install with: pip install google-genai")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def find_api_key() -> Optional[str]:
    """Find Gemini API key using correct priority order.

    Priority order (highest to lowest):
    1. process.env (runtime environment variables)
    2. .claude/skills/ai-multimodal/.env (skill-specific config)
    3. .claude/skills/.env (shared skills config)
    4. .claude/.env (Claude global config)
    """
    # Priority 1: Already in process.env (highest)
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        return api_key

    # Load .env files if dotenv available
    if load_dotenv:
        # Determine base paths
        script_dir = Path(__file__).parent
        skill_dir = script_dir.parent  # .claude/skills/ai-multimodal
        skills_dir = skill_dir.parent   # .claude/skills
        claude_dir = skills_dir.parent  # .claude

        # Priority 2: Skill-specific .env
        env_file = skill_dir / '.env'
        if env_file.exists():
            load_dotenv(env_file)
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                return api_key

        # Priority 3: Shared skills .env
        env_file = skills_dir / '.env'
        if env_file.exists():
            load_dotenv(env_file)
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                return api_key

        # Priority 4: Claude global .env
        env_file = claude_dir / '.env'
        if env_file.exists():
            load_dotenv(env_file)
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                return api_key

    return None


def find_project_root() -> Path:
    """Find project root directory."""
    script_dir = Path(__file__).parent

    # Look for .git or .claude directory
    for parent in [script_dir] + list(script_dir.parents):
        if (parent / '.git').exists() or (parent / '.claude').exists():
            return parent

    return script_dir


def get_mime_type(file_path: str) -> str:
    """Determine MIME type from file extension."""
    ext = Path(file_path).suffix.lower()

    mime_types = {
        # Documents
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
        # Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        # Office (need to be uploaded as binary)
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }

    return mime_types.get(ext, 'application/octet-stream')


def upload_file(client: genai.Client, file_path: str, verbose: bool = False) -> Any:
    """Upload file to Gemini File API."""
    if verbose:
        print(f"Uploading {file_path}...")

    myfile = client.files.upload(file=file_path)

    # Wait for processing if needed
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


def convert_to_markdown(
    client: genai.Client,
    file_path: str,
    model: str = 'gemini-2.5-flash',
    custom_prompt: Optional[str] = None,
    verbose: bool = False,
    max_retries: int = 3
) -> Dict[str, Any]:
    """Convert a document to markdown using Gemini."""

    for attempt in range(max_retries):
        try:
            file_path_obj = Path(file_path)
            file_size = file_path_obj.stat().st_size
            use_file_api = file_size > 20 * 1024 * 1024  # >20MB

            # Default prompt for markdown conversion
            if custom_prompt:
                prompt = custom_prompt
            else:
                prompt = """Convert this document to clean, well-formatted Markdown.

Requirements:
- Preserve all content, structure, and formatting
- Convert tables to markdown table format
- Maintain heading hierarchy (# ## ### etc)
- Preserve lists, code blocks, and quotes
- Extract text from images if present
- Keep formatting consistent and readable

Output only the markdown content without any preamble or explanation."""

            # Upload or inline the file
            if use_file_api:
                myfile = upload_file(client, str(file_path), verbose)
                content = [prompt, myfile]
            else:
                with open(file_path, 'rb') as f:
                    file_bytes = f.read()

                mime_type = get_mime_type(str(file_path))
                content = [
                    prompt,
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
                ]

            # Generate markdown
            response = client.models.generate_content(
                model=model,
                contents=content
            )

            markdown_content = response.text if hasattr(response, 'text') else ''

            return {
                'file': str(file_path),
                'status': 'success',
                'markdown': markdown_content
            }

        except Exception as e:
            if attempt == max_retries - 1:
                return {
                    'file': str(file_path),
                    'status': 'error',
                    'error': str(e),
                    'markdown': None
                }

            wait_time = 2 ** attempt
            if verbose:
                print(f"  Retry {attempt + 1} after {wait_time}s: {e}")
            time.sleep(wait_time)


def batch_convert(
    files: List[str],
    output_file: Optional[str] = None,
    auto_name: bool = False,
    model: str = 'gemini-2.5-flash',
    custom_prompt: Optional[str] = None,
    verbose: bool = False
) -> List[Dict[str, Any]]:
    """Batch convert multiple files to markdown."""

    api_key = find_api_key()
    if not api_key:
        print("Error: GEMINI_API_KEY not found")
        print("Set via: export GEMINI_API_KEY='your-key'")
        print("Or create .env file with: GEMINI_API_KEY=your-key")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    results = []

    # Determine output path
    if not output_file:
        project_root = find_project_root()
        output_dir = project_root / 'docs' / 'assets'

        if auto_name and len(files) == 1:
            # Auto-generate meaningful filename from input
            input_path = Path(files[0])
            base_name = input_path.stem
            output_file = str(output_dir / f"{base_name}-extraction.md")
        else:
            output_file = str(output_dir / 'document-extraction.md')

    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Process each file
    for i, file_path in enumerate(files, 1):
        if verbose:
            print(f"\n[{i}/{len(files)}] Converting: {file_path}")

        result = convert_to_markdown(
            client=client,
            file_path=file_path,
            model=model,
            custom_prompt=custom_prompt,
            verbose=verbose
        )

        results.append(result)

        if verbose:
            status = result.get('status', 'unknown')
            print(f"  Status: {status}")

    # Save combined markdown
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Document Extraction Results\n\n")
        f.write(f"Converted {len(files)} document(s) to markdown.\n\n")
        f.write("---\n\n")

        for result in results:
            f.write(f"## {Path(result['file']).name}\n\n")

            if result['status'] == 'success' and result.get('markdown'):
                f.write(result['markdown'])
                f.write("\n\n")
            elif result['status'] == 'success':
                f.write("**Note**: Conversion succeeded but no content was returned.\n\n")
            else:
                f.write(f"**Error**: {result.get('error', 'Unknown error')}\n\n")

            f.write("---\n\n")

    if verbose or True:  # Always show output location
        print(f"\n{'='*50}")
        print(f"Converted: {len(results)} file(s)")
        print(f"Success: {sum(1 for r in results if r['status'] == 'success')}")
        print(f"Failed: {sum(1 for r in results if r['status'] == 'error')}")
        print(f"Output saved to: {output_path}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Convert documents to Markdown using Gemini API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert single PDF to markdown (default name)
  %(prog)s --input document.pdf

  # Auto-generate meaningful filename
  %(prog)s --input testpdf.pdf --auto-name
  # Output: docs/assets/testpdf-extraction.md

  # Convert multiple files
  %(prog)s --input doc1.pdf doc2.docx image.png

  # Specify custom output location
  %(prog)s --input document.pdf --output ./output.md

  # Use custom prompt
  %(prog)s --input document.pdf --prompt "Extract only the tables as markdown"

  # Batch convert directory
  %(prog)s --input ./documents/*.pdf --verbose

Supported formats:
  - PDF documents (up to 1,000 pages)
  - Images (JPEG, PNG, WEBP, HEIC)
  - Office documents (DOCX, XLSX, PPTX)
  - Text formats (TXT, HTML, Markdown, CSV)

Default output: <project-root>/docs/assets/document-extraction.md
        """
    )

    parser.add_argument('--input', '-i', nargs='+', required=True,
                       help='Input file(s) to convert')
    parser.add_argument('--output', '-o',
                       help='Output markdown file (default: docs/assets/document-extraction.md)')
    parser.add_argument('--auto-name', '-a', action='store_true',
                       help='Auto-generate meaningful output filename from input (e.g., document.pdf -> document-extraction.md)')
    parser.add_argument('--model', default='gemini-2.5-flash',
                       help='Gemini model to use (default: gemini-2.5-flash)')
    parser.add_argument('--prompt', '-p',
                       help='Custom prompt for conversion')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')

    args = parser.parse_args()

    # Validate input files
    files = []
    for file_pattern in args.input:
        file_path = Path(file_pattern)
        if file_path.exists() and file_path.is_file():
            files.append(str(file_path))
        else:
            # Try glob pattern
            import glob
            matched = glob.glob(file_pattern)
            files.extend([f for f in matched if Path(f).is_file()])

    if not files:
        print("Error: No valid input files found")
        sys.exit(1)

    # Convert files
    batch_convert(
        files=files,
        output_file=args.output,
        auto_name=args.auto_name,
        model=args.model,
        custom_prompt=args.prompt,
        verbose=args.verbose
    )


if __name__ == '__main__':
    main()
