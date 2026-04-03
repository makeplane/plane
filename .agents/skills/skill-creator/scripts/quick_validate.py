#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version
"""

import sys
import re
from pathlib import Path

from encoding_utils import configure_utf8_console, read_text_utf8

# Fix Windows console encoding for Unicode output
configure_utf8_console()

def validate_skill(skill_path):
    """Basic validation of a skill"""
    skill_path = Path(skill_path)
    
    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"
    
    # Read and validate frontmatter
    content = read_text_utf8(skill_md)
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"
    
    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"
    
    frontmatter = match.group(1)
    
    # Check required fields
    if 'name:' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description:' not in frontmatter:
        return False, "Missing 'description' in frontmatter"
    
    # Extract name for validation
    name_match = re.search(r'name:\s*(.+)', frontmatter)
    if name_match:
        name = name_match.group(1).strip().strip('"').strip("'")

        # Support namespaced identifiers: ck:skill-name (single namespace segment)
        if name.count(':') > 1:
            return False, (
                f"Name '{name}' is invalid. Use either 'skill-name' or "
                "'namespace:skill-name' with a single colon."
            )

        namespace = None
        skill_id = name
        if ':' in name:
            namespace, skill_id = name.split(':', 1)

        id_pattern = r'^[a-z0-9-]+$'
        if namespace and not re.match(id_pattern, namespace):
            return False, (
                f"Namespace '{namespace}' must be lowercase letters, digits, and hyphens only"
            )

        if not re.match(id_pattern, skill_id):
            return False, (
                f"Skill id '{skill_id}' must be lowercase letters, digits, and hyphens only"
            )

        for segment_name, segment in [("namespace", namespace), ("skill id", skill_id)]:
            if segment and (segment.startswith('-') or segment.endswith('-') or '--' in segment):
                return False, (
                    f"{segment_name.capitalize()} '{segment}' cannot start/end with hyphen "
                    "or contain consecutive hyphens"
                )

    # Validate name length (official max: 64 chars)
    if name_match:
        if len(skill_id) > 64:
            return False, f"Skill id '{skill_id}' exceeds 64 characters ({len(skill_id)})"
        if namespace and len(namespace) > 64:
            return False, f"Namespace '{namespace}' exceeds 64 characters ({len(namespace)})"

    # Extract and validate description
    desc_match = re.search(r'description:\s*(.+)', frontmatter)
    if desc_match:
        description = desc_match.group(1).strip().strip('"').strip("'")

        # YAML block scalar indicators are valid (e.g. description: >-)
        if description in {'>', '>-', '|', '|-'}:
            description = ''

        # Check for angle brackets
        if '<' in description or '>' in description:
            return False, "Description cannot contain angle brackets (< or >)"

        # Check description length (official max: 1024 chars)
        if len(description) > 1024:
            return False, f"Description exceeds 1024 characters ({len(description)})"

    return True, "Skill is valid!"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        sys.exit(1)
    
    valid, message = validate_skill(sys.argv[1])
    print(message)
    sys.exit(0 if valid else 1)
