#!/usr/bin/env python3
"""
Scan .claude/commands directory and extract command metadata.
"""

import re
from pathlib import Path
from typing import Dict, List
import yaml

def extract_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except:
            return {}
    return {}

def scan_commands(base_path: Path) -> List[Dict]:
    """Scan all command files and extract metadata."""
    commands = []

    for cmd_file in sorted(base_path.rglob('*.md')):
        # Get relative path from commands directory
        rel_path = cmd_file.relative_to(base_path)

        # Build command name from path
        parts = list(rel_path.parts[:-1]) + [rel_path.stem]
        command_name = '/ck:' + ':'.join(parts)

        # Read file and extract frontmatter
        try:
            content = cmd_file.read_text()
            frontmatter = extract_frontmatter(content)

            description = frontmatter.get('description', '')
            arg_hint = frontmatter.get('argument-hint', '')

            # Extract power level (⚡ count)
            power_level = description.count('⚡')
            clean_desc = description.replace('⚡', '').strip()

            commands.append({
                'name': command_name,
                'path': str(rel_path),
                'description': clean_desc,
                'argument_hint': arg_hint,
                'power_level': power_level,
                'category': parts[0] if len(parts) > 1 else 'core'
            })
        except Exception as e:
            print(f"Error processing {cmd_file}: {e}")

    return commands

def group_by_category(commands: List[Dict]) -> Dict[str, List[Dict]]:
    """Group commands by category."""
    categories = {}

    for cmd in commands:
        category = cmd['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(cmd)

    return categories

def main():
    """Main execution."""
    base_path = Path('.claude/commands')

    if not base_path.exists():
        print(f"Error: {base_path} not found")
        return

    print("Scanning commands...")
    commands = scan_commands(base_path)

    print(f"\nFound {len(commands)} commands\n")

    # Group by category
    categories = group_by_category(commands)

    for category, cmds in sorted(categories.items()):
        print(f"\n{category.upper()}:")
        for cmd in cmds:
            power = '⚡' * cmd['power_level'] if cmd['power_level'] > 0 else ''
            print(f"  {cmd['name']:40} {power:10} {cmd['description'][:80]}")

    # Output YAML for processing (generate_catalogs.py expects YAML format)
    output_path = Path('.claude/scripts/commands_data.yaml')
    output_path.write_text(yaml.dump(commands, allow_unicode=True, default_flow_style=False))
    print(f"\n✓ Saved metadata to {output_path}")

if __name__ == '__main__':
    main()
