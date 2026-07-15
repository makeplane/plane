#!/usr/bin/env python3
"""Simulate the Plane documentation workflow from an initial integration commit."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path


def run(command: list[str], cwd: Path, timeout: int = 30) -> subprocess.CompletedProcess[str]:
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
        timeout=timeout,
    )
    if result.returncode != 0:
        output = "\n".join(item for item in [result.stdout.strip(), result.stderr.strip()] if item)
        raise SystemExit(f"command failed: {' '.join(command)}\n{output}")
    return result


def git(git_path: str, source: Path, root: Path, *arguments: str) -> subprocess.CompletedProcess[str]:
    safe = source if root == source else root
    return run([git_path, "-c", f"safe.directory={safe}", "-C", str(root), *arguments], source)


def copy_tree(source: Path, target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)


def run_workflow(python_path: str, git_path: str, root: Path, base: str) -> None:
    runtime = root / ".plane-ai-doc-loop" / "runtime"
    commands = [
        [python_path, str(runtime / "validate_skills.py"), "--root", str(root)],
        [python_path, str(runtime / "validate_workflow.py"), "--root", str(root)],
        [
            python_path,
            str(runtime / "validate_semantic.py"),
            "--root",
            str(root),
            "--strict-paths",
            "--require-baseline",
        ],
        [python_path, str(runtime / "plane_repo_snapshot.py"), "--root", str(root)],
        [
            python_path,
            str(runtime / "impact_from_git_diff.py"),
            "--root",
            str(root),
            "--base",
            f"{base}...",
            "--git",
            git_path,
        ],
        [
            python_path,
            str(runtime / "validate_semantic.py"),
            "--root",
            str(root),
            "--strict-paths",
            "--require-baseline",
            "--require-generated",
        ],
        [
            python_path,
            str(runtime / "check_doc_gate.py"),
            "--root",
            str(root),
            "--base",
            f"{base}...",
            "--git",
            git_path,
        ],
    ]
    for command in commands:
        run(command, root)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Installed Plane repository root")
    parser.add_argument("--git", default="git", help="Git executable path")
    parser.add_argument("--python", default=sys.executable, help="Python executable path")
    args = parser.parse_args()

    source = Path(args.root).resolve()
    audit_root = source.parent / f".plane-loop-ci-audit-{uuid.uuid4().hex}"
    if audit_root.exists():
        raise SystemExit(f"audit path already exists: {audit_root}")

    worktree_created = False
    try:
        git(args.git, source, source, "worktree", "add", "--quiet", "--detach", str(audit_root), "HEAD")
        worktree_created = True
        base = git(args.git, source, audit_root, "rev-parse", "HEAD").stdout.strip()

        copy_tree(source / ".agents", audit_root / ".agents")
        copy_tree(source / ".plane-ai-doc-loop", audit_root / ".plane-ai-doc-loop")
        copy_tree(source / "docs" / "ai", audit_root / "docs" / "ai")
        copy_tree(source / "docs" / "semantic", audit_root / "docs" / "semantic")
        shutil.copy2(
            source / ".github" / "workflows" / "plane-ai-doc-loop.yml",
            audit_root / ".github" / "workflows" / "plane-ai-doc-loop.yml",
        )

        runtime = audit_root / ".plane-ai-doc-loop" / "runtime"
        run([args.python, str(runtime / "validate_skills.py"), "--root", str(audit_root)], audit_root)
        run(
            [
                args.python,
                str(runtime / "validate_semantic.py"),
                "--root",
                str(audit_root),
                "--strict-paths",
                "--require-baseline",
            ],
            audit_root,
        )
        run([args.python, str(runtime / "plane_repo_snapshot.py"), "--root", str(audit_root)], audit_root)
        run(
            [
                args.python,
                str(runtime / "impact_from_git_diff.py"),
                "--root",
                str(audit_root),
                "--base",
                f"{base}...",
                "--git",
                args.git,
            ],
            audit_root,
        )

        git(
            args.git,
            source,
            audit_root,
            "add",
            ".agents",
            ".plane-ai-doc-loop",
            "docs",
            ".github/workflows/plane-ai-doc-loop.yml",
        )
        run(
            [
                args.git,
                "-c",
                f"safe.directory={audit_root}",
                "-C",
                str(audit_root),
                "-c",
                "user.name=Plane Loop CI",
                "-c",
                "user.email=plane-loop@example.invalid",
                "commit",
                "--quiet",
                "--no-verify",
                "-m",
                "install Plane AI doc loop",
            ],
            source,
        )

        run_workflow(args.python, args.git, audit_root, base)
        status = git(args.git, source, audit_root, "status", "--porcelain=v1", "--untracked-files=all").stdout.strip()
        if status:
            raise SystemExit(f"cold-start workflow left a dirty worktree:\n{status}")

        integration_commit = git(args.git, source, audit_root, "rev-parse", "HEAD").stdout.strip()
        print(f"CI cold-start passed ({base} -> {integration_commit}, clean worktree)")
        return 0
    finally:
        if worktree_created:
            git(args.git, source, source, "worktree", "remove", "--force", str(audit_root))
        elif audit_root.exists():
            shutil.rmtree(audit_root)


if __name__ == "__main__":
    raise SystemExit(main())
