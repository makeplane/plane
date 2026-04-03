#!/usr/bin/env python3
"""Generate llms.txt from a docs directory following llmstxt.org specification.

Usage:
  python3 generate-llms-txt.py --source <path> [--output <path>] [--base-url <url>] [--full] [--project-name <name>] [--project-description <desc>]

Examples:
  python3 generate-llms-txt.py --source ./docs --base-url https://example.com/docs
  python3 generate-llms-txt.py --source ./docs --output ./public --full --project-name "My Project"
"""

import argparse
import os
import re
import sys
from pathlib import Path


def extract_title(content: str, filepath: Path) -> str:
    """Extract H1 title from markdown content, fallback to filename."""
    match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return filepath.stem.replace("-", " ").replace("_", " ").title()


def extract_description(content: str) -> str:
    """Extract first meaningful paragraph after H1 as description."""
    lines = content.split("\n")
    found_h1 = False
    paragraph_lines = []

    for line in lines:
        stripped = line.strip()
        if not found_h1:
            if stripped.startswith("# "):
                found_h1 = True
            continue
        # Skip empty lines, frontmatter, other headings
        if not stripped:
            if paragraph_lines:
                break
            continue
        if stripped.startswith("#") or stripped.startswith("---"):
            if paragraph_lines:
                break
            continue
        if stripped.startswith(">"):
            # Use blockquote content as description
            paragraph_lines.append(stripped.lstrip("> ").strip())
            continue
        if stripped.startswith("- ") or stripped.startswith("* "):
            if paragraph_lines:
                break
            continue
        paragraph_lines.append(stripped)

    desc = " ".join(paragraph_lines)
    # Truncate to ~150 chars
    if len(desc) > 150:
        desc = desc[:147].rsplit(" ", 1)[0] + "..."
    return desc


def categorize_file(filepath: Path) -> str:
    """Categorize a doc file into a section based on path/name heuristics."""
    parts = [p.lower() for p in filepath.parts]
    name = filepath.stem.lower()

    category_map = {
        "api": "API Reference",
        "api-reference": "API Reference",
        "reference": "API Reference",
        "guide": "Guides",
        "guides": "Guides",
        "tutorial": "Guides",
        "tutorials": "Guides",
        "getting-started": "Getting Started",
        "quickstart": "Getting Started",
        "quick-start": "Getting Started",
        "setup": "Getting Started",
        "installation": "Getting Started",
        "install": "Getting Started",
        "config": "Configuration",
        "configuration": "Configuration",
        "settings": "Configuration",
        "deploy": "Deployment",
        "deployment": "Deployment",
        "hosting": "Deployment",
        "architecture": "Architecture",
        "design": "Architecture",
        "faq": "Optional",
        "changelog": "Optional",
        "contributing": "Optional",
        "migration": "Optional",
        "troubleshoot": "Optional",
        "troubleshooting": "Optional",
    }

    # Check path parts and filename
    for part in parts + [name]:
        if part in category_map:
            return category_map[part]

    return "Documentation"


def scan_docs(source: Path) -> list[dict]:
    """Scan directory for markdown files and extract metadata."""
    docs = []
    extensions = {".md", ".mdx"}

    for filepath in sorted(source.rglob("*")):
        if filepath.suffix not in extensions:
            continue
        if filepath.name.startswith("."):
            continue
        # Skip node_modules, hidden dirs
        if any(p.startswith(".") or p == "node_modules" for p in filepath.parts):
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        title = extract_title(content, filepath)
        description = extract_description(content)
        category = categorize_file(filepath.relative_to(source))
        rel_path = filepath.relative_to(source)

        docs.append({
            "title": title,
            "description": description,
            "category": category,
            "rel_path": str(rel_path),
            "abs_path": str(filepath),
            "content": content,
        })

    return docs


def build_url(rel_path: str, base_url: str) -> str:
    """Build full URL from relative path and base URL."""
    if not base_url:
        return rel_path
    base = base_url.rstrip("/")
    # Remove .md/.mdx extension for web URLs
    clean_path = re.sub(r"\.(md|mdx)$", "", rel_path)
    return f"{base}/{clean_path}"


def generate_llms_txt(
    docs: list[dict],
    project_name: str,
    project_desc: str,
    base_url: str,
) -> str:
    """Generate llms.txt content from scanned docs."""
    lines = [f"# {project_name}", ""]

    if project_desc:
        lines.append(f"> {project_desc}")
        lines.append("")

    # Group by category
    categories: dict[str, list[dict]] = {}
    for doc in docs:
        cat = doc["category"]
        categories.setdefault(cat, []).append(doc)

    # Sort categories: Getting Started first, Optional last, rest alphabetical
    priority = {"Getting Started": 0, "Documentation": 5, "Optional": 99}

    sorted_cats = sorted(
        categories.keys(),
        key=lambda c: (priority.get(c, 10), c),
    )

    for cat in sorted_cats:
        cat_docs = categories[cat]
        lines.append(f"## {cat}")
        lines.append("")
        for doc in cat_docs:
            url = build_url(doc["rel_path"], base_url)
            desc_part = f": {doc['description']}" if doc["description"] else ""
            lines.append(f"- [{doc['title']}]({url}){desc_part}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def generate_llms_full_txt(
    docs: list[dict],
    project_name: str,
    project_desc: str,
) -> str:
    """Generate llms-full.txt with inline content."""
    lines = [f"# {project_name}", ""]

    if project_desc:
        lines.append(f"> {project_desc}")
        lines.append("")

    # Group by category
    categories: dict[str, list[dict]] = {}
    for doc in docs:
        cat = doc["category"]
        categories.setdefault(cat, []).append(doc)

    priority = {"Getting Started": 0, "Documentation": 5, "Optional": 99}
    sorted_cats = sorted(
        categories.keys(),
        key=lambda c: (priority.get(c, 10), c),
    )

    for cat in sorted_cats:
        cat_docs = categories[cat]
        lines.append(f"## {cat}")
        lines.append("")
        for doc in cat_docs:
            lines.append(f"### {doc['title']}")
            lines.append("")
            # Include full content minus the H1
            content = doc["content"]
            # Strip frontmatter
            content = re.sub(
                r"^---\s*\n.*?\n---\s*\n", "", content, flags=re.DOTALL
            )
            # Strip H1
            content = re.sub(r"^#\s+.+\n*", "", content)
            lines.append(content.strip())
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def detect_project_info(source: Path) -> tuple[str, str]:
    """Try to detect project name and description from common files."""
    name = source.resolve().name
    desc = ""

    # Check package.json
    pkg = source / "package.json"
    if not pkg.exists():
        pkg = source.parent / "package.json"
    if pkg.exists():
        try:
            import json
            data = json.loads(pkg.read_text(encoding="utf-8"))
            name = data.get("name", name)
            desc = data.get("description", desc)
        except (OSError, json.JSONDecodeError):
            pass

    # Check README for H1 + first paragraph
    for readme_name in ["README.md", "readme.md", "Readme.md"]:
        readme = source / readme_name
        if not readme.exists():
            readme = source.parent / readme_name
        if readme.exists():
            try:
                content = readme.read_text(encoding="utf-8")
                h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
                if h1_match:
                    name = h1_match.group(1).strip()
                if not desc:
                    desc = extract_description(content)
            except OSError:
                pass
            break

    return name, desc


def main():
    parser = argparse.ArgumentParser(
        description="Generate llms.txt from documentation directory"
    )
    parser.add_argument(
        "--source", required=True, help="Path to docs directory"
    )
    parser.add_argument(
        "--output",
        default=".",
        help="Output directory (default: current directory)",
    )
    parser.add_argument(
        "--base-url",
        default="",
        help="Base URL prefix for doc links",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Also generate llms-full.txt with inline content",
    )
    parser.add_argument(
        "--project-name",
        default="",
        help="Project name (auto-detected if not provided)",
    )
    parser.add_argument(
        "--project-description",
        default="",
        help="Project description (auto-detected if not provided)",
    )

    args = parser.parse_args()
    source = Path(args.source).resolve()

    if not source.is_dir():
        print(f"Error: Source path '{source}' is not a directory", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    # Detect or use provided project info
    auto_name, auto_desc = detect_project_info(source)
    project_name = args.project_name or auto_name
    project_desc = args.project_description or auto_desc

    # Scan docs
    docs = scan_docs(source)
    if not docs:
        print(f"Warning: No markdown files found in '{source}'", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(docs)} documentation files")

    # Generate llms.txt
    llms_txt = generate_llms_txt(docs, project_name, project_desc, args.base_url)
    llms_path = output_dir / "llms.txt"
    llms_path.write_text(llms_txt, encoding="utf-8")
    print(f"Generated: {llms_path}")

    # Generate llms-full.txt if requested
    if args.full:
        llms_full = generate_llms_full_txt(docs, project_name, project_desc)
        full_path = output_dir / "llms-full.txt"
        full_path.write_text(llms_full, encoding="utf-8")
        print(f"Generated: {full_path}")

    print("Done!")


if __name__ == "__main__":
    main()
