#!/usr/bin/env python3
"""
Scan .claude/skills and regenerate the checked-in skill registries.

Modular design:
  - validate-skill-frontmatter.py  — category constants + schema validation
  - score-skill-description.py     — description scoring (Phase 2)
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

# yaml.safe_load preferred; falls back to hand-rolled parser if pyyaml unavailable.
try:
    import yaml as _yaml
    _HAS_YAML = True
except ImportError:
    _HAS_YAML = False

# Kebab-case filenames require importlib for Python imports.
import importlib.util as _ilu


def _load_sibling(filename: str, module_name: str):
    """Load a sibling Python module with a kebab-case filename."""
    path = Path(__file__).with_name(filename)
    spec = _ilu.spec_from_file_location(module_name, path)
    mod = _ilu.module_from_spec(spec)  # type: ignore[arg-type]
    sys.modules[module_name] = mod  # register so dataclasses can resolve
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


_vsfm = _load_sibling("validate-skill-frontmatter.py", "validate_skill_frontmatter")
CATEGORY_NAMES: dict[str, str] = _vsfm.CATEGORY_NAMES
CATEGORY_ORDER: list[str] = _vsfm.CATEGORY_ORDER
EXACT_CATEGORY_MAP: dict[str, str] = _vsfm.EXACT_CATEGORY_MAP
VALID_CATEGORIES: frozenset[str] = _vsfm.VALID_CATEGORIES

_scorer = _load_sibling("score-skill-description.py", "score_skill_description")

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


# ── Frontmatter extraction ────────────────────────────────────────────────────

def _fallback_frontmatter(content: str) -> dict:
    """Hand-rolled parser used when pyyaml is unavailable."""
    match = FRONTMATTER_RE.match(content)
    if not match:
        return {}
    result: dict = {}
    lines = match.group(1).splitlines()
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if not line.strip() or line.lstrip().startswith("#"):
            idx += 1
            continue
        fm = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not fm:
            idx += 1
            continue
        key, value = fm.group(1), fm.group(2).strip()
        if value in {">", ">-", "|", "|-"}:
            block: list[str] = []
            idx += 1
            while idx < len(lines) and lines[idx].startswith("  "):
                block.append(lines[idx][2:])
                idx += 1
            result[key] = " ".join(p.strip() for p in block if p.strip())
            continue
        if value:
            v = value.strip()
            is_quoted = len(v) >= 2 and v[0] == v[-1] and v[0] in {"'", '"'}
            if is_quoted:
                v = v[1:-1]
            if v == "true":
                result[key] = True
            elif v == "false":
                result[key] = False
            elif not is_quoted and v.startswith("[") and v.endswith("]"):
                result[key] = [
                    item.strip().strip("'\"")
                    for item in v[1:-1].split(",")
                    if item.strip()
                ]
            else:
                result[key] = v
        idx += 1
    return result


def extract_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter. Uses yaml.safe_load when pyyaml is available."""
    match = FRONTMATTER_RE.match(content)
    if not match:
        return {}
    if not _HAS_YAML:
        return _fallback_frontmatter(content)
    try:
        data = _yaml.safe_load(match.group(1))
        if not isinstance(data, dict):
            return {}
        result: dict = {}
        for key, val in data.items():
            if isinstance(val, (dict, list, bool, int, float)):
                result[key] = val          # preserve typed metadata values
            else:
                result[key] = str(val) if val is not None else ""
        return result
    except _yaml.YAMLError:
        return {}


def extract_first_paragraph(content: str) -> str:
    """Extract the first meaningful paragraph after frontmatter."""
    body = FRONTMATTER_RE.sub("", content, count=1)
    paragraph: list[str] = []
    for raw_line in body.splitlines():
        line = raw_line.strip()
        if line.startswith("#") or not line:
            if paragraph:
                break
            continue
        paragraph.append(line)
        if line.endswith(".") and len(" ".join(paragraph)) > 50:
            break
    return " ".join(paragraph)[:400]


# ── Categorization ────────────────────────────────────────────────────────────

def categorize_skill(name: str, frontmatter: dict | None = None) -> str:
    """Categorize skill. Prefers frontmatter 'category', falls back to heuristics."""
    if frontmatter:
        cat = frontmatter.get("category")
        if cat and cat in VALID_CATEGORIES:
            return cat
    lower = name.lower()
    if lower in EXACT_CATEGORY_MAP:
        return EXACT_CATEGORY_MAP[lower]
    if any(x in lower for x in ["ai-", "gemini", "multimodal", "adk"]):
        return "ai-ml"
    if any(x in lower for x in ["mcp", "skill-creator", "repomix", "docs-seeker"]):
        return "dev-tools"
    if any(x in lower for x in ["frontend", "ui", "design", "aesthetic", "threejs"]):
        return "frontend"
    if any(x in lower for x in ["backend", "auth", "payment"]):
        return "backend"
    if any(x in lower for x in ["devops", "docker", "cloudflare", "gcloud"]):
        return "infrastructure"
    if any(x in lower for x in ["database", "mongodb", "postgresql", "sql"]):
        return "database"
    if any(x in lower for x in ["media", "document-skills"]):
        return "multimedia"
    if any(x in lower for x in ["web-frameworks", "mobile", "shopify"]):
        return "frameworks"
    if any(x in lower for x in ["debug", "problem", "code-review", "planning", "research", "sequential"]):
        return "utilities"
    return "other"


def normalize_display_name(internal_name: str, frontmatter: dict) -> str:
    raw = frontmatter.get("name", "")
    if raw.startswith("ck:"):
        return raw[3:]
    return raw if raw else internal_name


# ── Scanner ───────────────────────────────────────────────────────────────────

def scan_skills(base_path: Path) -> list[dict]:
    """Scan all skill SKILL.md files and extract metadata. Skips symlinks."""
    skills: list[dict] = []
    resolved_base = base_path.resolve()

    for skill_file in sorted(base_path.rglob("SKILL.md")):
        if skill_file.is_symlink() or not skill_file.resolve().is_relative_to(resolved_base):
            print(f"WARNING: Skipping symlinked or escaped path: {skill_file}", file=sys.stderr)
            continue
        skill_dir = skill_file.parent
        internal_name = skill_dir.name
        if skill_dir.parent.name != "skills":
            internal_name = f"{skill_dir.parent.name}/{internal_name}"

        content = skill_file.read_text(encoding="utf-8")
        frontmatter = extract_frontmatter(content)
        description = frontmatter.get("description") or extract_first_paragraph(content)
        entry: dict = {
            "name": internal_name,
            "display_name": normalize_display_name(internal_name, frontmatter),
            "path": str(skill_file.relative_to(base_path)),
            "description": description,
            "category": categorize_skill(internal_name, frontmatter),
            "has_scripts": (skill_dir / "scripts").exists(),
            "has_references": (skill_dir / "references").exists(),
        }
        for fm_key, entry_key in [("argument-hint", "argument_hint"), ("maturity", "maturity")]:
            val = frontmatter.get(fm_key, "")
            if val:
                entry[entry_key] = val
        for list_key in ("keywords", "requires", "related"):
            val = frontmatter.get(list_key)
            if isinstance(val, list) and val:
                entry[list_key] = val
        skills.append(entry)
    return skills


def group_by_category(skills: list[dict]) -> dict[str, list[dict]]:
    cats: dict[str, list[dict]] = defaultdict(list)
    for skill in skills:
        cats[str(skill["category"])].append(skill)
    return cats


# ── Output writers ────────────────────────────────────────────────────────────

def _qs(value: str) -> str:
    """Quoted YAML scalar with full escape handling."""
    return '"' + (
        value
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
        .replace("\0", "")
    ) + '"'


def _yaml_list(items: list) -> str:
    """YAML inline list with properly escaped items."""
    return "[" + ", ".join(_qs(str(i)) for i in items) + "]"


def _skill_yaml_lines(skill: dict, indent: str = "") -> list[str]:
    lines = [
        f'{indent}- name: {_qs(str(skill["display_name"]))}',
        f'{indent}  path: {_qs(str(skill["path"]))}',
        f'{indent}  description: {_qs(str(skill["description"]))}',
        f'{indent}  category: {_qs(str(skill["category"]))}',
        f'{indent}  has_scripts: {"true" if skill["has_scripts"] else "false"}',
        f'{indent}  has_references: {"true" if skill["has_references"] else "false"}',
    ]
    for opt in ("argument_hint", "maturity"):
        if opt in skill:
            lines.append(f'{indent}  {opt}: {_qs(str(skill[opt]))}')
    for lst in ("keywords", "requires", "related"):
        if lst in skill:
            lines.append(f'{indent}  {lst}: {_yaml_list(skill[lst])}')
    return lines


def write_skills_registry(skills: list[dict], repo_root: Path) -> Path:
    out = repo_root / "claude" / "scripts" / "skills_data.yaml"
    lines: list[str] = []
    for skill in skills:
        # Registry uses internal name (not display_name)
        lines.extend(_skill_yaml_lines({**skill, "display_name": skill["name"]}))
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def write_catalog_yaml(skills: list[dict], repo_root: Path) -> Path:
    cats = group_by_category(skills)
    active = [c for c in CATEGORY_ORDER if cats.get(c)]
    out = repo_root / "guide" / "SKILLS.yaml"
    lines = [
        "metadata:",
        f"  title: {_qs('Skills Catalog')}",
        f"  description: {_qs('Auto-generated catalog of all available skills in ClaudeKit Engineer')}",
        f"  last_updated: '{date.today().isoformat()}'",
        f"  total_skills: {len(skills)}",
        "categories:",
        *[f"  {c}: {_qs(CATEGORY_NAMES[c])}" for c in active],
        "legend:",
        f"  has_scripts: {_qs('Has executable scripts')}",
        f"  has_references: {_qs('Has reference documentation')}",
        "skills:",
    ]
    for cat in active:
        lines.append(f"  {cat}:")
        for skill in sorted(cats[cat], key=lambda s: str(s["display_name"]).lower()):
            lines.extend(_skill_yaml_lines(skill, indent="  "))
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def write_catalog_markdown(skills: list[dict], repo_root: Path) -> Path:
    cats = group_by_category(skills)
    active = [c for c in CATEGORY_ORDER if cats.get(c)]
    out = repo_root / "guide" / "SKILLS.md"
    lines = [
        "# Skills Catalog", "",
        "Auto-generated catalog of all available skills in ClaudeKit Engineer.", "",
        f"**Last Updated**: {date.today().isoformat()}", "",
        f"**Total Skills**: {len(skills)}", "",
        "## Categories", "",
        *[f"- [{CATEGORY_NAMES[c]}](#{c})" for c in active],
        "", "## Legend", "",
        "- 📦 Has executable scripts", "- 📚 Has reference documentation", "",
    ]
    for cat in active:
        lines.extend([f"## {CATEGORY_NAMES[cat]}", ""])
        for skill in sorted(cats[cat], key=lambda s: str(s["display_name"]).lower()):
            icons = ("📦 " if skill["has_scripts"] else "") + ("📚 " if skill["has_references"] else "")
            desc_safe = str(skill["description"]).replace("\n", " ").strip()
            lines.extend([
                f"### {icons}`{skill['display_name']}`", "",
                desc_safe, "",
                f"**Location**: `.claude/skills/{skill['path']}`", "",
            ])
    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return out


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    base_path = repo_root / "claude" / "skills"
    if not base_path.exists():
        raise SystemExit(f"Error: {base_path} not found")

    strict = "--strict" in sys.argv

    print("Scanning skills...")
    skills = scan_skills(base_path)
    print(f"Found {len(skills)} skills")

    cats = group_by_category(skills)
    for cat in CATEGORY_ORDER:
        cat_skills = cats.get(cat, [])
        if not cat_skills:
            continue
        print(f"\n{CATEGORY_NAMES[cat]}:")
        for skill in sorted(cat_skills, key=lambda s: str(s["display_name"]).lower()):
            s_icon = "📦" if skill["has_scripts"] else "  "
            r_icon = "📚" if skill["has_references"] else "  "
            print(f"  {s_icon}{r_icon} {str(skill['display_name']):30} {str(skill['description'])[:80]}")

    registry = write_skills_registry(skills, repo_root)
    cat_yaml = write_catalog_yaml(skills, repo_root)
    cat_md = write_catalog_markdown(skills, repo_root)
    print(f"\n✓ Saved registry to {registry.relative_to(repo_root)}")
    print(f"✓ Saved catalog to {cat_yaml.relative_to(repo_root)}")
    print(f"✓ Saved catalog to {cat_md.relative_to(repo_root)}")

    # Format compliance scoring (Phase 2).
    scores = [
        _scorer.score_description(str(s["name"]), str(s["description"]))
        for s in skills
    ]
    confusable = _scorer.check_confusable_pairs(skills)
    cycles = _scorer.validate_dependency_graph(skills)
    _scorer.print_format_compliance_report(scores, confusable, cycles)

    if strict:
        failures = [s for s in scores if not s.passed]
        if failures or cycles:
            print(f"\n[X] --strict: {len(failures)} description failures, {len(cycles)} cycles")
            raise SystemExit(1)


if __name__ == "__main__":
    main()
