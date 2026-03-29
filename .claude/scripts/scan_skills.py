#!/usr/bin/env python3
"""
Scan .claude/skills directory and extract skill metadata.
"""

import re
from pathlib import Path
from typing import Dict, List
try:
    import yaml
except ModuleNotFoundError:
    raise SystemExit(
        "PyYAML is required. Install with: python3 -m pip install -r .claude/scripts/requirements.txt"
    )

# Exact mappings for high-signal CK skills to avoid falling into "other".
EXACT_CATEGORY_MAP = {
    "ask": "utilities",
    "code-review": "utilities",
    "coding-level": "utilities",
    "debug": "utilities",
    "docs": "utilities",
    "journal": "utilities",
    "plan": "utilities",
    "research": "utilities",
    "sequential-thinking": "utilities",
    "test": "utilities",
    "watzup": "utilities",
    "find-skills": "dev-tools",
    "git": "dev-tools",
    "kanban": "dev-tools",
    "plans-kanban": "dev-tools",
    "scout": "dev-tools",
    "use-mcp": "dev-tools",
    "worktree": "dev-tools",
    "preview": "utilities",
    "project-management": "utilities",
    "bootstrap": "utilities",
    "brainstorm": "utilities",
    "cook": "utilities",
    "fix": "utilities",
    "team": "dev-tools",
}

def extract_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except:
            return {}
    return {}

def extract_first_paragraph(content: str) -> str:
    """Extract first meaningful paragraph after frontmatter."""
    # Remove frontmatter
    content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)

    # Find first paragraph (after headings)
    lines = content.split('\n')
    paragraph = []

    for line in lines:
        line = line.strip()
        # Skip headings and empty lines
        if line.startswith('#') or not line:
            if paragraph:  # If we've started collecting, stop
                break
            continue

        paragraph.append(line)

        # Stop after first paragraph
        if line.endswith('.') and len(' '.join(paragraph)) > 50:
            break

    return ' '.join(paragraph)[:200]

def scan_skills(base_path: Path) -> List[Dict]:
    """Scan all skill files and extract metadata."""
    skills = []

    for skill_file in sorted(base_path.rglob('SKILL.md')):
        # Get skill directory name
        skill_dir = skill_file.parent
        skill_name = skill_dir.name

        # Skip template
        if skill_name == 'template-skill':
            continue

        # Handle nested skills (like document-skills/*)
        if skill_dir.parent.name != 'skills':
            parent_name = skill_dir.parent.name
            skill_name = f"{parent_name}/{skill_name}"

        try:
            content = skill_file.read_text()
            frontmatter = extract_frontmatter(content)

            description = frontmatter.get('description', '')
            if not description:
                description = extract_first_paragraph(content)

            # Categorize based on content/name
            category = categorize_skill(skill_name, description, content)

            skill_entry = {
                'name': skill_name,
                'path': str(skill_file.relative_to(Path('.claude/skills'))),
                'description': description,
                'category': category,
                'has_scripts': (skill_dir / 'scripts').exists(),
                'has_references': (skill_dir / 'references').exists()
            }

            # Include argument-hint if present in frontmatter
            argument_hint = frontmatter.get('argument-hint', '')
            if argument_hint:
                skill_entry['argument_hint'] = str(argument_hint)

            skills.append(skill_entry)
        except Exception as e:
            print(f"Error processing {skill_file}: {e}")

    return skills

def categorize_skill(name: str, description: str, content: str) -> str:
    """Categorize skill based on name and content."""
    lower_name = name.lower()
    if lower_name in EXACT_CATEGORY_MAP:
        return EXACT_CATEGORY_MAP[lower_name]

    # AI/ML
    if any(x in lower_name for x in ['ai-', 'gemini', 'multimodal', 'adk']):
        return 'ai-ml'

    # Frontend
    if any(x in lower_name for x in ['frontend', 'ui', 'design', 'aesthetic', 'threejs']):
        return 'frontend'

    # Backend
    if any(x in lower_name for x in ['backend', 'auth', 'payment']):
        return 'backend'

    # Infrastructure
    if any(x in lower_name for x in ['devops', 'docker', 'cloudflare', 'gcloud']):
        return 'infrastructure'

    # Database
    if any(x in lower_name for x in ['database', 'mongodb', 'postgresql', 'sql']):
        return 'database'

    # Development Tools
    if any(x in lower_name for x in ['mcp', 'skill-creator', 'repomix', 'docs-seeker']):
        return 'dev-tools'

    # Multimedia
    if any(x in lower_name for x in ['media', 'chrome-devtools', 'document-skills']):
        return 'multimedia'

    # Frameworks
    if any(x in lower_name for x in ['web-frameworks', 'mobile', 'shopify']):
        return 'frameworks'

    # Utilities
    if any(x in lower_name for x in ['debug', 'problem', 'code-review', 'planning', 'research', 'sequential']):
        return 'utilities'

    return 'other'

def group_by_category(skills: List[Dict]) -> Dict[str, List[Dict]]:
    """Group skills by category."""
    categories = {}

    for skill in skills:
        category = skill['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(skill)

    return categories

def main():
    """Main execution."""
    base_path = Path('.claude/skills')

    if not base_path.exists():
        print(f"Error: {base_path} not found")
        return

    print("Scanning skills...")
    skills = scan_skills(base_path)

    print(f"\nFound {len(skills)} skills\n")

    # Group by category
    categories = group_by_category(skills)

    category_names = {
        'ai-ml': 'AI & Machine Learning',
        'frontend': 'Frontend & Design',
        'backend': 'Backend Development',
        'infrastructure': 'Infrastructure & DevOps',
        'database': 'Database & Storage',
        'dev-tools': 'Development Tools',
        'multimedia': 'Multimedia & Processing',
        'frameworks': 'Frameworks & Platforms',
        'utilities': 'Utilities & Helpers',
        'other': 'Other'
    }

    for category, skills_list in sorted(categories.items()):
        print(f"\n{category_names.get(category, category.upper())}:")
        for skill in skills_list:
            scripts = '📦' if skill['has_scripts'] else '  '
            refs = '📚' if skill['has_references'] else '  '
            print(f"  {scripts}{refs} {skill['name']:30} {skill['description'][:80]}")

    # Output YAML to scripts directory
    output_path = Path('.claude/scripts/skills_data.yaml')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(yaml.dump(skills, allow_unicode=True, default_flow_style=False))
    print(f"\n✓ Saved metadata to {output_path}")

if __name__ == '__main__':
    main()
