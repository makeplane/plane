#!/usr/bin/env python3
"""Extract all prompts from awesome-nano-banana-pro-prompts.md into CSV."""

import re
import csv
from pathlib import Path

def extract_prompts(md_content: str) -> list[dict]:
    """Extract all prompts with their metadata."""
    prompts = []

    # Split by prompt entries (### No. X:)
    entries = re.split(r'### No\. \d+:', md_content)

    for i, entry in enumerate(entries[1:], 1):  # Skip content before first entry
        prompt_data = {
            "id": i,
            "title": "",
            "category": "",
            "description": "",
            "prompt": "",
            "author": "",
            "source": "",
        }

        # Extract title (first line after split)
        title_match = re.search(r'^([^\n]+)', entry.strip())
        if title_match:
            prompt_data["title"] = title_match.group(1).strip()

        # Extract category from badges
        categories = re.findall(r'!\[([^\]]+)\]\([^)]+badge[^)]*\)', entry)
        if categories:
            # Filter out non-category badges
            cats = [c for c in categories if c not in ["Featured", "Raycast", "Language-ZH", "Language-EN", "Language-JA"]]
            prompt_data["category"] = ", ".join(cats[:3]) if cats else ""

        # Extract description
        desc_match = re.search(r'#### 📖 Description\s*\n\n([^\n#]+)', entry)
        if desc_match:
            prompt_data["description"] = desc_match.group(1).strip()

        # Extract prompt (between ``` markers after "#### 📝 Prompt")
        prompt_section = re.search(r'#### 📝 Prompt\s*\n\n```[^\n]*\n(.*?)```', entry, re.DOTALL)
        if prompt_section:
            prompt_data["prompt"] = prompt_section.group(1).strip()

        # Extract author
        author_match = re.search(r'\*\*Author:\*\*\s*\[([^\]]+)\]', entry)
        if author_match:
            prompt_data["author"] = author_match.group(1).strip()

        # Extract source URL
        source_match = re.search(r'\*\*Source:\*\*\s*\[([^\]]+)\]\(([^)]+)\)', entry)
        if source_match:
            prompt_data["source"] = source_match.group(2).strip()

        if prompt_data["prompt"]:  # Only add if we found a prompt
            prompts.append(prompt_data)

    return prompts


def save_to_csv(prompts: list[dict], output_path: Path):
    """Save prompts to CSV file."""
    fieldnames = ["id", "title", "category", "description", "prompt", "author", "source"]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for p in prompts:
            writer.writerow(p)

    print(f"Saved {len(prompts)} prompts to {output_path}")


def main():
    script_dir = Path(__file__).parent
    md_path = script_dir.parent / "references" / "awesome-nano-banana-pro-prompts.md"
    csv_path = script_dir.parent / "data" / "awesome-prompts.csv"

    print(f"Reading from: {md_path}")

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    prompts = extract_prompts(content)
    print(f"Extracted {len(prompts)} prompts")

    # Print sample
    if prompts:
        print("\nSample prompts:")
        for p in prompts[:3]:
            print(f"\n[{p['id']}] {p['title'][:50]}...")
            print(f"  Category: {p['category']}")
            print(f"  Prompt: {p['prompt'][:100]}...")

    save_to_csv(prompts, csv_path)


if __name__ == "__main__":
    main()
