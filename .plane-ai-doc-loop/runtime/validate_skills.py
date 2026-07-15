#!/usr/bin/env python3
"""Validate Plane loop skills without third-party packages."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
FRONTMATTER_PATTERN = re.compile(r"^---\n(?P<body>.*?)\n---(?:\n|$)", re.DOTALL)


def parse_frontmatter(skill_file: Path) -> dict[str, str]:
    content = skill_file.read_text(encoding="utf-8").replace("\r\n", "\n")
    match = FRONTMATTER_PATTERN.match(content)
    if not match:
        raise ValueError("missing or invalid YAML frontmatter")

    fields: dict[str, str] = {}
    for line in match.group("body").splitlines():
        if not line.strip():
            continue
        key, separator, value = line.partition(":")
        if not separator or not key.strip() or not value.strip():
            raise ValueError(f"unsupported frontmatter line: {line}")
        fields[key.strip()] = value.strip().strip('"')
    return fields


def yaml_string(content: str, key: str) -> str:
    match = re.search(rf'^\s*{re.escape(key)}:\s*"(?P<value>.*)"\s*$', content, re.MULTILINE)
    return match.group("value") if match else ""


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_file = skill_dir / "SKILL.md"
    agent_file = skill_dir / "agents" / "openai.yaml"

    if not skill_file.is_file():
        return [f"{skill_dir.name}: SKILL.md is missing"]

    try:
        fields = parse_frontmatter(skill_file)
    except ValueError as exc:
        return [f"{skill_dir.name}: {exc}"]

    unexpected = sorted(set(fields) - {"name", "description"})
    name = fields.get("name", "")
    description = fields.get("description", "")
    if unexpected:
        errors.append(f"{skill_dir.name}: unexpected frontmatter fields: {', '.join(unexpected)}")
    if name != skill_dir.name:
        errors.append(f"{skill_dir.name}: frontmatter name must match directory")
    if not NAME_PATTERN.fullmatch(name) or len(name) > 64:
        errors.append(f"{skill_dir.name}: name must be hyphen-case and at most 64 characters")
    if not description or len(description) > 1024 or "<" in description or ">" in description:
        errors.append(f"{skill_dir.name}: description is missing or invalid")

    if not agent_file.is_file():
        errors.append(f"{skill_dir.name}: agents/openai.yaml is missing")
        return errors

    agent = agent_file.read_text(encoding="utf-8")
    display_name = yaml_string(agent, "display_name")
    short_description = yaml_string(agent, "short_description")
    default_prompt = yaml_string(agent, "default_prompt")
    if not display_name:
        errors.append(f"{skill_dir.name}: display_name is missing")
    if not 25 <= len(short_description) <= 64:
        errors.append(f"{skill_dir.name}: short_description must be 25-64 characters")
    if f"${name}" not in default_prompt:
        errors.append(f"{skill_dir.name}: default_prompt must mention ${name}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    skills_root = root / ".agents" / "skills"
    if not skills_root.is_dir():
        raise SystemExit(f"skills directory is missing: {skills_root}")

    manifest_path = root / ".plane-ai-doc-loop" / "manifest.json"
    try:
        managed_skills = json.loads(manifest_path.read_text(encoding="utf-8"))["managed_skills"]
    except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise SystemExit(f"invalid loop manifest: {manifest_path}: {exc}") from exc
    if not managed_skills:
        raise SystemExit("loop manifest contains no managed skills")

    skill_dirs = [skills_root / name for name in managed_skills]

    errors = [error for skill_dir in skill_dirs for error in validate_skill(skill_dir)]
    if errors:
        raise SystemExit("\n".join(errors))

    print(f"skill validation passed ({len(skill_dirs)} skills)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
