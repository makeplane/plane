#!/usr/bin/env python3
"""Enforce deterministic code, semantic-model, test, and generated-doc consistency."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


DECLARATION_PATH = "docs/semantic/change_declaration.json"
GENERATED_ROOTS = ("docs/semantic", "docs/ai")
CODE_ROOTS = ("apps/", "packages/")
TEST_MARKERS = ("/tests/", "/test/", "/__tests__/", ".test.", ".spec.")


def run_git(git: str, root: Path, arguments: list[str], check: bool = True) -> list[str]:
    result = subprocess.run(
        [git, "-c", f"safe.directory={root}", "-c", "core.quotepath=false", "-C", str(root), *arguments],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and result.returncode != 0:
        raise SystemExit(result.stderr.strip() or f"git {' '.join(arguments)} failed")
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"missing required file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid JSON in {path}: {exc}") from exc


def ensure_string(payload: dict, field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise SystemExit(f"change declaration requires non-empty {field}")
    return value.strip()


def ensure_string_list(payload: dict, field: str) -> list[str]:
    value = payload.get(field)
    if not isinstance(value, list) or not value or not all(isinstance(item, str) and item for item in value):
        raise SystemExit(f"change declaration requires non-empty string list {field}")
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    parser.add_argument("--base", required=True, help="git diff base, for example origin/preview...")
    parser.add_argument("--git", default="git", help="Git executable path")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    changed = sorted(set(run_git(args.git, root, ["diff", "--name-only", args.base, "--"])))
    code_changed = [path for path in changed if path.startswith(CODE_ROOTS)]
    non_test_code_changed = [path for path in code_changed if not any(marker in path for marker in TEST_MARKERS)]
    declaration = read_json(root / DECLARATION_PATH)

    ensure_string(declaration, "change_id")
    ensure_string(declaration, "intent")
    documentation_impact = ensure_string(declaration, "documentation_impact")
    test_impact = ensure_string(declaration, "test_impact")
    if documentation_impact not in {"updated", "not_applicable"}:
        raise SystemExit("documentation_impact must be updated or not_applicable")
    if test_impact not in {"covered", "not_applicable"}:
        raise SystemExit("test_impact must be covered or not_applicable")

    domains = read_json(root / "docs/semantic/domains.json").get("domains", [])
    mappings = read_json(root / "docs/semantic/mappings.json").get("mappings", [])
    domain_ids = {item.get("id") for item in domains if item.get("status") == "active"}
    active_mappings = {item.get("id"): item for item in mappings if item.get("status") == "active"}
    mapping_ids = set(active_mappings)

    affected_domains = ensure_string_list(declaration, "affected_domains")
    declared_mappings = ensure_string_list(declaration, "mapping_ids")
    unknown_domains = sorted(set(affected_domains) - domain_ids)
    unknown_mappings = sorted(set(declared_mappings) - mapping_ids)
    if unknown_domains:
        raise SystemExit(f"change declaration references non-active domains: {', '.join(unknown_domains)}")
    if unknown_mappings:
        raise SystemExit(f"change declaration references non-active mappings: {', '.join(unknown_mappings)}")

    declared_mapping_paths: set[str] = set()
    for mapping_id in declared_mappings:
        mapping = active_mappings[mapping_id]
        for field in ("frontend_paths", "backend_paths", "database_paths", "api_paths", "test_paths"):
            declared_mapping_paths.update(mapping.get(field, []))

    evidence_paths = ensure_string_list(declaration, "evidence_paths")
    for rel in evidence_paths:
        if not (root / rel).exists():
            raise SystemExit(f"change declaration evidence path is missing: {rel}")

    if code_changed:
        if DECLARATION_PATH not in changed:
            raise SystemExit(f"code changed but {DECLARATION_PATH} was not updated")
        if documentation_impact == "updated" and "docs/semantic/mappings.json" not in changed:
            raise SystemExit("documentation_impact is updated but docs/semantic/mappings.json did not change")
        if documentation_impact == "not_applicable" and len(ensure_string(declaration, "rationale")) < 20:
            raise SystemExit("documentation not_applicable requires a substantive rationale")
        uncovered = sorted(path for path in code_changed if path not in declared_mapping_paths)
        if uncovered:
            raise SystemExit(
                "changed code paths are not covered by declared active mappings:\n" + "\n".join(uncovered)
            )

        if test_impact == "covered":
            test_paths = ensure_string_list(declaration, "test_paths")
            for rel in test_paths:
                if not (root / rel).exists():
                    raise SystemExit(f"declared test path is missing: {rel}")
            if non_test_code_changed and not any(path in changed for path in test_paths):
                raise SystemExit("test_impact is covered but none of the declared test paths changed")
        elif len(ensure_string(declaration, "rationale")) < 20:
            raise SystemExit("test not_applicable requires a substantive rationale")

    status = run_git(
        args.git,
        root,
        ["status", "--porcelain=v1", "--untracked-files=all", "--", *GENERATED_ROOTS],
    )
    if status:
        raise SystemExit("generated documentation is not committed or is stale:\n" + "\n".join(status))

    print(
        f"documentation gate passed ({len(changed)} changed paths, "
        f"{len(code_changed)} code paths, declaration {declaration['change_id']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
