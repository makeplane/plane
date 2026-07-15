#!/usr/bin/env python3
"""Validate critical Plane documentation workflow invariants without YAML dependencies."""

from __future__ import annotations

import argparse
from pathlib import Path


REQUIRED_SNIPPETS = {
    "self trigger": '      - ".github/workflows/plane-ai-doc-loop.yml"',
    "full history": "          fetch-depth: 0",
    "diff base": 'echo "DIFF_BASE=$diff_base" >> "$GITHUB_ENV"',
    "strict baseline": "validate_semantic.py --strict-paths --require-baseline",
    "generated validation": "--require-generated",
    "deterministic gate": 'check_doc_gate.py --base "$DIFF_BASE"',
    "frontend condition": "if: needs.semantic-docs.outputs.frontend_changed == 'true'",
    "manual frontend input": "run_frontend_checks:",
    "manual frontend activation": 'inputs.run_frontend_checks }}" == "true"',
    "frontend workspace filter": r"/^packages\// || (/^apps\//",
    "frontend workspace exclusions": r"$0 !~ /^apps\/(api|proxy)\//",
    "frontend checks": "run: pnpm check",
    "backend condition": "if: needs.semantic-docs.outputs.backend_changed == 'true'",
    "manual backend input": "run_backend_tests:",
    "manual backend activation": 'inputs.run_backend_tests }}" == "true"',
    "backend tests": "docker compose -f docker-compose-test.yml run --rm --build api-tests pytest -m unit",
    "backend cleanup": "docker compose -f docker-compose-test.yml down -v",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    args = parser.parse_args()

    path = Path(args.root).resolve() / ".github" / "workflows" / "plane-ai-doc-loop.yml"
    try:
        content = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise SystemExit(f"workflow is missing: {path}") from exc

    missing = [label for label, snippet in REQUIRED_SNIPPETS.items() if snippet not in content]
    if missing:
        raise SystemExit("workflow is missing required invariants: " + ", ".join(missing))
    if content.count("jobs:") != 1:
        raise SystemExit("workflow must contain exactly one jobs block")
    for job in ("semantic-docs:", "frontend-checks:", "backend-tests:"):
        if content.count(job) != 1:
            raise SystemExit(f"workflow must contain exactly one {job} job")

    print(f"workflow validation passed ({len(REQUIRED_SNIPPETS)} invariants)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
