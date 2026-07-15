#!/usr/bin/env python3
"""Create a lightweight local source snapshot for Plane."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


IGNORE_DIRS = {
    ".git",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    "coverage",
}


def safe_rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def list_dirs(path: Path, root: Path) -> list[str]:
    if not path.exists():
        return []
    return [safe_rel(p, root) for p in sorted(path.iterdir()) if p.is_dir() and p.name not in IGNORE_DIRS]


def list_files_by_name(search_root: Path, repo_root: Path, names: set[str], max_items: int = 300) -> list[str]:
    found: list[str] = []
    for current, dirs, files in os.walk(search_root):
        dirs[:] = sorted(d for d in dirs if d not in IGNORE_DIRS)
        for name in sorted(files):
            if name in names:
                found.append(safe_rel(Path(current) / name, repo_root))
                if len(found) >= max_items:
                    return sorted(found)
    return sorted(found)


def list_files_by_suffix(search_root: Path, repo_root: Path, suffixes: tuple[str, ...], max_items: int = 600) -> list[str]:
    found: list[str] = []
    for current, dirs, files in os.walk(search_root):
        dirs[:] = sorted(d for d in dirs if d not in IGNORE_DIRS)
        for name in sorted(files):
            if name.endswith(suffixes):
                found.append(safe_rel(Path(current) / name, repo_root))
                if len(found) >= max_items:
                    return sorted(found)
    return sorted(found)


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_architecture(root: Path, snapshot: dict) -> None:
    docs_dir = root / "docs" / "ai"
    docs_dir.mkdir(parents=True, exist_ok=True)
    mappings_path = root / "docs" / "semantic" / "mappings.json"
    mappings = json.loads(mappings_path.read_text(encoding="utf-8")).get("mappings", [])
    active_mappings = [item for item in mappings if item.get("status") == "active"]
    lines = [
        "# Plane Local Architecture Snapshot",
        "",
        "This file is generated from local repository structure. Treat it as a navigation layer, not the only source of truth.",
        "",
        "## Repository",
        "",
        "- Root: repository checkout (`.`)",
        f"- Frontend apps: {len(snapshot['apps'])}",
        f"- Shared packages: {len(snapshot['packages'])}",
        f"- Backend path exists: {snapshot['backend']['exists']}",
        "",
        "## Apps",
        "",
    ]
    lines.extend([f"- `{item}`" for item in snapshot["apps"]] or ["- Not found"])
    lines.extend(["", "## Packages", ""])
    lines.extend([f"- `{item}`" for item in snapshot["packages"]] or ["- Not found"])
    lines.extend(["", "## Backend Entry Points", ""])
    lines.extend([f"- `{item}`" for item in snapshot["backend"]["entry_files"]] or ["- Not found"])
    lines.extend(["", "## Frontend Package Manifests", ""])
    lines.extend([f"- `{item}`" for item in snapshot["frontend"]["package_manifests"]] or ["- Not found"])
    lines.extend(["", "## Source-Backed Domain Mappings", ""])
    for mapping in active_mappings:
        lines.append(f"### `{mapping['id']}`")
        lines.append("")
        lines.append(f"- Domain: `{mapping['domain']}`")
        for field in ["api_paths", "backend_paths", "database_paths", "frontend_paths", "test_paths"]:
            label = field.removesuffix("_paths").replace("_", " ").title()
            paths = mapping.get(field, [])
            lines.append(f"- {label}: " + (", ".join(f"`{path}`" for path in paths) if paths else "Not mapped"))
        lines.append("")
    if not active_mappings:
        lines.append("- No active mappings")
    lines.extend(["", "## Next AI Steps", ""])
    lines.extend(
        [
            "- Promote seed domains in `docs/semantic/domains.json` only after source paths are confirmed.",
            "- Add source-backed rows to `docs/semantic/mappings.json` for each changed feature.",
            "- Run `powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath .` before asking an agent to implement code from documentation.",
        ]
    )
    (docs_dir / "architecture.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    snapshot = {
        "schema_version": "1.0",
        "root": ".",
        "apps": list_dirs(root / "apps", root),
        "packages": list_dirs(root / "packages", root),
        "backend": {
            "exists": (root / "apps" / "api").exists(),
            "entry_files": list_files_by_name(
                root / "apps" / "api",
                root,
                {"urls.py", "models.py", "views.py", "serializers.py", "tasks.py"},
                250,
            )
            if (root / "apps" / "api").exists()
            else [],
            "migration_files": list_files_by_suffix(
                root / "apps" / "api" / "plane" / "db" / "migrations",
                root,
                (".py",),
                600,
            )
            if (root / "apps" / "api" / "plane" / "db" / "migrations").exists()
            else [],
        },
        "frontend": {
            "package_manifests": list_files_by_name(root, root, {"package.json"}, 250),
            "route_like_files": list_files_by_suffix(
                root / "apps",
                root,
                ("routes.ts", "route.tsx", "routes.tsx", "router.tsx"),
                250,
            )
            if (root / "apps").exists()
            else [],
        },
    }
    write_json(root / "docs" / "semantic" / "local_scan.json", snapshot)
    write_architecture(root, snapshot)
    print("wrote docs/semantic/local_scan.json and docs/ai/architecture.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
