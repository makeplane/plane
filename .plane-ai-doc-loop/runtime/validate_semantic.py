#!/usr/bin/env python3
"""Validate Plane AI-loop semantic JSON files without third-party packages."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REQUIRED_FILES = [
    "docs/semantic/reverse_index.json",
    "docs/semantic/domains.json",
    "docs/semantic/mappings.json",
    "docs/semantic/docs_index.json",
    "docs/semantic/open_questions.json",
]
PATH_FIELDS = ["frontend_paths", "backend_paths", "database_paths", "api_paths", "test_paths"]
MAPPING_STATUSES = {"needs_scan", "active", "deprecated"}
DOMAIN_STATUSES = {"seed", "active", "deprecated"}
QUESTION_STATUSES = {"open", "resolved", "deferred"}


def load_json(root: Path, rel: str) -> dict:
    path = root / rel
    if not path.exists():
        raise SystemExit(f"missing required file: {rel}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid JSON in {rel}: {exc}") from exc


def ensure_unique(items: list[dict], key: str, label: str) -> set[str]:
    seen: set[str] = set()
    for item in items:
        value = item.get(key)
        if not value:
            raise SystemExit(f"{label} item missing {key}: {item}")
        if value in seen:
            raise SystemExit(f"duplicate {label} id: {value}")
        seen.add(value)
    return seen


def existing_path(root: Path, rel: str) -> bool:
    return (root / rel).exists()


def require_existing_paths(root: Path, mapping: dict, fields: list[str]) -> None:
    for field in fields:
        values = mapping.get(field, [])
        if not isinstance(values, list):
            raise SystemExit(f"mapping {mapping['id']} field {field} must be a list")
        for rel in values:
            if not isinstance(rel, str) or not rel:
                raise SystemExit(f"mapping {mapping['id']} has invalid {field} path: {rel!r}")
            if not existing_path(root, rel):
                raise SystemExit(f"mapping {mapping['id']} has missing {field} path: {rel}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Plane repository root")
    parser.add_argument("--strict-paths", action="store_true", help="require active mapping source paths to exist")
    parser.add_argument("--require-baseline", action="store_true", help="require an active, non-blocked semantic baseline")
    parser.add_argument("--require-generated", action="store_true", help="require indexed generated documents to exist")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    data = {rel: load_json(root, rel) for rel in REQUIRED_FILES}

    domains = data["docs/semantic/domains.json"].get("domains", [])
    mappings = data["docs/semantic/mappings.json"].get("mappings", [])
    questions = data["docs/semantic/open_questions.json"].get("questions", [])
    documents = data["docs/semantic/docs_index.json"].get("documents", [])

    domain_ids = ensure_unique(domains, "id", "domain")
    question_ids = ensure_unique(questions, "id", "question")
    ensure_unique(mappings, "id", "mapping")
    ensure_unique(documents, "id", "document")

    for domain in domains:
        if domain.get("status") not in DOMAIN_STATUSES:
            raise SystemExit(f"domain {domain['id']} has invalid status: {domain.get('status')}")
        if domain.get("status") == "active":
            evidence = domain.get("source_evidence", [])
            if not evidence:
                raise SystemExit(f"active domain lacks source evidence: {domain['id']}")
            for rel in evidence:
                if not existing_path(root, rel):
                    raise SystemExit(f"active domain {domain['id']} has missing source evidence: {rel}")
        for qid in domain.get("open_questions", []):
            if qid not in question_ids:
                raise SystemExit(f"domain {domain['id']} references missing open question: {qid}")

    for question in questions:
        if question.get("domain") not in domain_ids:
            raise SystemExit(f"question {question['id']} references missing domain: {question.get('domain')}")
        if question.get("status") not in QUESTION_STATUSES:
            raise SystemExit(f"question {question['id']} has invalid status: {question.get('status')}")
        if question.get("status") == "resolved":
            evidence = question.get("resolution_evidence", [])
            if not evidence:
                raise SystemExit(f"resolved question lacks resolution evidence: {question['id']}")
            for rel in evidence:
                if not existing_path(root, rel):
                    raise SystemExit(f"question {question['id']} has missing resolution evidence: {rel}")

    for mapping in mappings:
        domain_id = mapping.get("domain")
        if domain_id not in domain_ids:
            raise SystemExit(f"mapping {mapping['id']} references missing domain: {domain_id}")
        status = mapping.get("status")
        if status not in MAPPING_STATUSES:
            raise SystemExit(f"mapping {mapping['id']} has invalid status: {status}")
        if status == "active":
            if not mapping.get("backend_paths") and not mapping.get("frontend_paths"):
                raise SystemExit(f"active mapping lacks frontend or backend paths: {mapping['id']}")
            if not mapping.get("test_paths"):
                raise SystemExit(f"active mapping lacks test paths: {mapping['id']}")
            if not mapping.get("source_evidence"):
                raise SystemExit(f"active mapping lacks source evidence: {mapping['id']}")
            require_existing_paths(root, mapping, PATH_FIELDS + ["source_evidence"])
        elif args.strict_paths:
            require_existing_paths(root, mapping, PATH_FIELDS + ["source_evidence"])

    for doc in documents:
        for rel in doc.get("source_models", []):
            if rel.startswith(".ua/"):
                continue
            if not existing_path(root, rel):
                raise SystemExit(f"document {doc['id']} references missing source model: {rel}")
        if args.require_generated and not existing_path(root, doc.get("path", "")):
            raise SystemExit(f"indexed document output is missing: {doc.get('path')}")

    if args.require_baseline:
        active_domains = {item["id"] for item in domains if item.get("status") == "active"}
        active_mappings = [item for item in mappings if item.get("status") == "active"]
        blocking_questions = [item["id"] for item in questions if item.get("status") == "open" and item.get("blocking")]
        if not active_domains:
            raise SystemExit("semantic baseline has no active domains")
        if not active_mappings:
            raise SystemExit("semantic baseline has no active mappings")
        for mapping in active_mappings:
            if mapping.get("domain") not in active_domains:
                raise SystemExit(f"active mapping references non-active domain: {mapping['id']}")
        if blocking_questions:
            raise SystemExit(f"semantic baseline has blocking open questions: {', '.join(blocking_questions)}")

    print("semantic validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
