#!/usr/bin/env python3
"""Generate a Plane AI-loop change impact note from git diff paths."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


SELF_GENERATED_PATHS = {
    "docs/ai/change-impact.md",
    "docs/semantic/change_impact.json",
}


def run_git(git: str, root: Path, arguments: list[str]) -> list[str]:
    cmd = [git, "-c", f"safe.directory={root}", "-c", "core.quotepath=false", "-C", str(root), *arguments]
    result = subprocess.run(cmd, check=False, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or "git diff failed")
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def git_changed(git: str, root: Path, base: str | None) -> list[str]:
    if base:
        changed = run_git(git, root, ["diff", "--name-only", base, "--"])
        changed.extend(run_git(git, root, ["ls-files", "--others", "--exclude-standard"]))
        return sorted(set(changed))

    changed = run_git(git, root, ["diff", "--name-only", "--"])
    changed.extend(run_git(git, root, ["diff", "--cached", "--name-only", "--"]))
    changed.extend(run_git(git, root, ["ls-files", "--others", "--exclude-standard"]))
    return sorted(set(changed))


def classify(path: str) -> str:
    if path.startswith("apps/api/"):
        return "backend"
    if path.startswith("apps/"):
        return "frontend_app"
    if path.startswith("packages/"):
        return "shared_package"
    if path.startswith("docs/semantic/"):
        return "semantic_model"
    if path.startswith("docs/"):
        return "documentation"
    if path.endswith((".yml", ".yaml", ".json", ".toml")):
        return "configuration"
    return "other"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    parser.add_argument("--base", default=None, help="optional git diff base, for example origin/preview...")
    parser.add_argument("--git", default="git", help="Git executable path")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    changed = [path for path in git_changed(args.git, root, args.base) if path not in SELF_GENERATED_PATHS]
    groups: dict[str, list[str]] = {}
    for path in changed:
        groups.setdefault(classify(path), []).append(path)

    payload = {
        "schema_version": "1.0",
        "base": args.base or "working_tree",
        "changed_paths": changed,
        "groups": groups,
        "required_followups": [],
    }

    if any(path.startswith("apps/api/") for path in changed):
        payload["required_followups"].append("Run backend pytest subset and update backend/domain mappings.")
    if any(path.startswith(("apps/", "packages/")) for path in changed):
        payload["required_followups"].append("Run pnpm check or targeted turbo checks and update frontend/package mappings.")
    if any(path.startswith("docs/semantic/") for path in changed):
        payload["required_followups"].append("Run .plane-ai-doc-loop/runtime/validate_semantic.py and regenerate derived docs.")

    out_json = root / "docs" / "semantic" / "change_impact.json"
    out_md = root / "docs" / "ai" / "change-impact.md"
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# Plane Change Impact",
        "",
        f"Base: `{payload['base']}`",
        "",
        "## Changed Paths",
        "",
    ]
    lines.extend([f"- `{path}`" for path in changed] or ["- No changed paths detected"])
    lines.extend(["", "## Impact Groups", ""])
    for group, paths in sorted(groups.items()):
        lines.append(f"- `{group}`: {len(paths)}")
    lines.extend(["", "## Required Follow-ups", ""])
    lines.extend([f"- {item}" for item in payload["required_followups"]] or ["- No automatic follow-up inferred"])
    out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote docs/semantic/change_impact.json and docs/ai/change-impact.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
