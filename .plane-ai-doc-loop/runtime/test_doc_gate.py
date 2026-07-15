#!/usr/bin/env python3
"""Integration tests for the deterministic Plane documentation gate."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


def run(command: list[str], cwd: Path, expected: int = 0) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.update(
        {
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_EDITOR": "true",
            "GIT_PAGER": "cat",
            "GIT_TERMINAL_PROMPT": "0",
        }
    )
    result = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=15,
    )
    if result.returncode != expected:
        output = "\n".join(item for item in [result.stdout.strip(), result.stderr.strip()] if item)
        raise AssertionError(
            f"expected exit {expected}, got {result.returncode}: {' '.join(command)}\n{output}"
        )
    return result


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def git(git_path: str, root: Path, *arguments: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
    return run([git_path, "-C", str(root), *arguments], root, expected)


def commit(git_path: str, root: Path, message: str) -> None:
    git(git_path, root, "add", ".")
    run(
        [
            git_path,
            "-C",
            str(root),
            "-c",
            "user.name=Plane Loop Test",
            "-c",
            "user.email=plane-loop@example.invalid",
            "commit",
            "--quiet",
            "--no-verify",
            "-m",
            message,
        ],
        root,
    )


def initialize_gate_repo(git_path: str, root: Path) -> str:
    write_text(root / "apps/web/feature.ts", "export const value = 1;\n")
    write_text(root / "apps/web/feature.test.ts", "test baseline\n")
    write_json(root / "docs/semantic/domains.json", {"domains": [{"id": "work_items", "status": "active"}]})
    write_json(
        root / "docs/semantic/mappings.json",
        {
            "mappings": [
                {
                    "id": "map.work_items.core",
                    "domain": "work_items",
                    "status": "active",
                    "frontend_paths": ["apps/web/feature.ts"],
                    "backend_paths": [],
                    "database_paths": [],
                    "api_paths": [],
                    "test_paths": ["apps/web/feature.test.ts"],
                }
            ]
        },
    )
    write_json(
        root / "docs/semantic/change_declaration.json",
        {
            "change_id": "baseline",
            "intent": "Create the test baseline.",
            "documentation_impact": "updated",
            "test_impact": "covered",
            "affected_domains": ["work_items"],
            "mapping_ids": ["map.work_items.core"],
            "test_paths": ["apps/web/feature.test.ts"],
            "evidence_paths": ["apps/web/feature.ts"],
            "rationale": "The baseline establishes deterministic integration-test fixtures.",
        },
    )
    write_json(root / "docs/semantic/change_impact.json", {})
    write_json(root / "docs/semantic/local_scan.json", {})
    write_text(root / "docs/ai/change-impact.md", "# Baseline\n")
    write_text(root / "docs/ai/architecture.md", "# Baseline\n")
    git(git_path, root, "init", "--quiet")
    commit(git_path, root, "baseline")
    return git(git_path, root, "rev-parse", "HEAD").stdout.strip()


def update_declaration(root: Path) -> None:
    write_json(
        root / "docs/semantic/change_declaration.json",
        {
            "change_id": "feature.work-items",
            "intent": "Change mapped Work Items behavior.",
            "documentation_impact": "updated",
            "test_impact": "covered",
            "affected_domains": ["work_items"],
            "mapping_ids": ["map.work_items.core"],
            "test_paths": ["apps/web/feature.test.ts"],
            "evidence_paths": ["apps/web/feature.ts"],
            "rationale": "The mapping and test cover the changed Work Items source path.",
        },
    )


def generate_and_commit(
    git_path: str,
    python_path: str,
    impact_script: Path,
    root: Path,
    base: str,
) -> None:
    run(
        [python_path, str(impact_script), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
    )
    commit(git_path, root, "generated impact")
    run(
        [python_path, str(impact_script), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
    )


def test_empty_active_mapping(python_path: str, validator: Path, root: Path) -> None:
    write_text(root / "evidence.txt", "evidence\n")
    write_json(root / "docs/semantic/reverse_index.json", {})
    write_json(
        root / "docs/semantic/domains.json",
        {"domains": [{"id": "domain", "status": "active", "source_evidence": ["evidence.txt"], "open_questions": []}]},
    )
    write_json(
        root / "docs/semantic/mappings.json",
        {
            "mappings": [
                {
                    "id": "map.domain",
                    "domain": "domain",
                    "status": "active",
                    "source_evidence": ["evidence.txt"],
                    "frontend_paths": [],
                    "backend_paths": [],
                    "database_paths": [],
                    "api_paths": [],
                    "test_paths": [],
                }
            ]
        },
    )
    write_json(root / "docs/semantic/docs_index.json", {"documents": []})
    write_json(root / "docs/semantic/open_questions.json", {"questions": []})
    result = run(
        [python_path, str(validator), "--root", str(root), "--strict-paths", "--require-baseline"],
        root,
        expected=1,
    )
    if "active mapping lacks frontend or backend paths" not in result.stderr:
        raise AssertionError("empty active mapping failed for the wrong reason")


def test_code_without_declaration(git_path: str, python_path: str, gate: Path, root: Path) -> None:
    base = initialize_gate_repo(git_path, root)
    write_text(root / "apps/web/feature.ts", "export const value = 2;\n")
    commit(git_path, root, "code only")
    result = run(
        [python_path, str(gate), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
        expected=1,
    )
    if "change_declaration.json was not updated" not in result.stderr:
        raise AssertionError("code-without-declaration failed for the wrong reason")


def test_uncovered_mapping(
    git_path: str,
    python_path: str,
    gate: Path,
    impact_script: Path,
    root: Path,
) -> None:
    base = initialize_gate_repo(git_path, root)
    write_text(root / "apps/web/feature.ts", "export const value = 2;\n")
    write_text(root / "apps/web/feature.test.ts", "test changed behavior\n")
    update_declaration(root)
    mappings = json.loads((root / "docs/semantic/mappings.json").read_text(encoding="utf-8"))
    mappings["mappings"][0]["frontend_paths"] = ["apps/web/other.ts"]
    mappings["mappings"][0]["confidence"] = 0.8
    write_json(root / "docs/semantic/mappings.json", mappings)
    commit(git_path, root, "uncovered mapping")
    generate_and_commit(git_path, python_path, impact_script, root, base)
    result = run(
        [python_path, str(gate), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
        expected=1,
    )
    if "not covered by declared active mappings" not in result.stderr:
        raise AssertionError("uncovered mapping failed for the wrong reason")


def test_valid_and_untracked(
    git_path: str,
    python_path: str,
    gate: Path,
    impact_script: Path,
    root: Path,
) -> None:
    base = initialize_gate_repo(git_path, root)
    write_text(root / "apps/web/feature.ts", "export const value = 2;\n")
    write_text(root / "apps/web/feature.test.ts", "test changed behavior\n")
    update_declaration(root)
    mappings = json.loads((root / "docs/semantic/mappings.json").read_text(encoding="utf-8"))
    mappings["mappings"][0]["confidence"] = 0.95
    write_json(root / "docs/semantic/mappings.json", mappings)
    commit(git_path, root, "valid mapped change")
    generate_and_commit(git_path, python_path, impact_script, root, base)
    run(
        [python_path, str(gate), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
    )
    write_text(root / "docs/ai/untracked.md", "# Untracked generated file\n")
    result = run(
        [python_path, str(gate), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
        expected=1,
    )
    if "generated documentation is not committed or is stale" not in result.stderr:
        raise AssertionError("untracked generated file failed for the wrong reason")


def test_initial_untracked_impact(
    git_path: str,
    python_path: str,
    impact_script: Path,
    root: Path,
) -> None:
    write_text(root / "tracked.txt", "baseline\n")
    git(git_path, root, "init", "--quiet")
    commit(git_path, root, "baseline")
    base = git(git_path, root, "rev-parse", "HEAD").stdout.strip()
    write_text(root / "apps/web/untracked.ts", "export const untracked = true;\n")
    run(
        [python_path, str(impact_script), "--root", str(root), "--base", f"{base}...", "--git", git_path],
        root,
    )
    impact = json.loads((root / "docs/semantic/change_impact.json").read_text(encoding="utf-8"))
    if "apps/web/untracked.ts" not in impact.get("changed_paths", []):
        raise AssertionError("base impact analysis omitted an untracked source file")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--git", default="git", help="Git executable path")
    parser.add_argument("--python", default=sys.executable, help="Python executable path")
    args = parser.parse_args()

    runtime = Path(__file__).resolve().parent
    gate = runtime / "check_doc_gate.py"
    validator = runtime / "validate_semantic.py"
    impact_script = runtime / "impact_from_git_diff.py"

    scenarios = [
        ("empty active mapping", lambda root: test_empty_active_mapping(args.python, validator, root)),
        ("code without declaration", lambda root: test_code_without_declaration(args.git, args.python, gate, root)),
        (
            "changed code outside mapping",
            lambda root: test_uncovered_mapping(args.git, args.python, gate, impact_script, root),
        ),
        (
            "valid mapping and untracked output",
            lambda root: test_valid_and_untracked(args.git, args.python, gate, impact_script, root),
        ),
        (
            "initial untracked impact",
            lambda root: test_initial_untracked_impact(args.git, args.python, impact_script, root),
        ),
    ]

    for name, scenario in scenarios:
        with tempfile.TemporaryDirectory(prefix="plane-doc-gate-") as directory:
            scenario(Path(directory))
        print(f"passed: {name}")

    print(f"documentation gate integration tests passed ({len(scenarios)} scenarios)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
