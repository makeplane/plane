# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Convention scanners for gitsync product modules. No git subprocess."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from plane.gitsync.env_catalog import scan_named_environments
from plane.gitsync.files import is_environment_template, is_feature_file
from plane.gitsync.registry import (
    MODULE_ENVIRONMENTS,
    MODULE_FEATURES,
    MODULE_PRD,
    MODULE_TESTHUB,
    MODULE_WIKI,
)
from plane.gitsync.workdir import read_git_meta

SKIP_DIR_NAMES = {".git", ".venv", "venv", "node_modules", "__pycache__", ".mypy_cache", ".pytest_cache"}
SECRET_KEY_RE = re.compile(r"(password|secret|token|passwd|api_key|credential|private_key)", re.I)
ASSIGN_RE = re.compile(r"""^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['\"])(.*?)\2\s*(?:#.*)?$""")
YAML_RE = re.compile(r"""^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:['\"]([^'\"]*)['\"]|([^#\s][^#]*?))\s*$""")
MAX_SCAN_FILES = 4000
MAX_PARSE_BYTES = 256_000


class ConventionError(ValueError):
    pass


def scan_module_catalog(module_key: str, workdir: str) -> dict[str, Any]:
    if module_key == MODULE_TESTHUB:
        raise ConventionError("TestCopilot catalog is produced by apps.index_platform.")
    root = Path(workdir)
    if not root.is_dir():
        raise ConventionError(f"workdir missing: {workdir}")
    git = read_git_meta(root)
    payload: dict[str, Any] = {
        "catalog_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "module_key": module_key,
        "git": git,
    }
    if module_key == MODULE_FEATURES:
        payload.update(_scan_features(root))
    elif module_key == MODULE_ENVIRONMENTS:
        payload.update(_scan_environments(root))
    elif module_key == MODULE_WIKI:
        payload["documents"] = _list_markdown(root, ("docs", "wiki"))
    elif module_key == MODULE_PRD:
        payload["documents"] = _list_markdown(root, ("prd",))
    else:
        raise ConventionError(f"Unknown module: {module_key}")
    return payload


def _scan_features(root: Path) -> dict[str, Any]:
    features = []
    seen: set[str] = set()
    for search in (root / "tests", root):
        if not search.is_dir():
            continue
        for path in _iter_files(search):
            rel = _rel(root, path)
            if rel in seen or not is_feature_file(rel):
                continue
            seen.add(rel)
            features.append(_parse_feature(rel, _read_text(path)))
        if features:
            break
    ddl = scan_ddl(root)
    return {
        "counts": {
            "features": len(features),
            "scenarios": sum(len(item["scenarios"]) for item in features),
            "ddl_tables": sum(block["table_count"] for block in ddl),
        },
        "features": features,
        "knowledge": {"ddl": ddl},
    }


def _scan_environments(root: Path) -> dict[str, Any]:
    named = scan_named_environments(root)
    if named is not None:
        return named
    environments = []
    for path in _iter_files(root):
        rel = _rel(root, path)
        if not is_environment_template(rel):
            continue
        environments.append(_parse_env_file(rel, _read_text(path)))
    return {
        "counts": {
            "environments": len(environments),
        },
        "environments": environments,
        "active_env": None,
        "env_local_present": (root / "config" / "env_local.py").is_file(),
        "mode": "legacy",
    }


def scan_ddl(root: Path) -> list[dict[str, Any]]:
    ddl_dir = root / "assets" / "ddl"
    ddl: list[dict[str, Any]] = []
    if not ddl_dir.is_dir():
        return ddl
    children = sorted(p for p in ddl_dir.iterdir() if p.name not in SKIP_DIR_NAMES)
    subdirs = [p for p in children if p.is_dir()]
    files = [p for p in children if p.is_file()]
    if subdirs:
        for folder in subdirs:
            tables = sorted(p.stem for p in folder.iterdir() if p.is_file() and p.name not in SKIP_DIR_NAMES)
            ddl.append(
                {
                    "datasource": folder.name,
                    "path": _rel(root, folder),
                    "table_count": len(tables),
                    "tables": tables,
                }
            )
        return ddl
    if files:
        tables = sorted(p.stem for p in files)
        ddl.append(
            {
                "datasource": "default",
                "path": _rel(root, ddl_dir),
                "table_count": len(tables),
                "tables": tables,
            }
        )
    return ddl


def scan_sql_files(workdir: str | Path) -> list[dict[str, str]]:
    root = Path(workdir)
    sql_dir = root / "assets" / "sql"
    sql_files: list[dict[str, str]] = []
    if not sql_dir.is_dir():
        return sql_files
    for path in _iter_files(sql_dir):
        rel = _rel(root, path)
        sql_files.append({"path": rel, "name": path.name})
    return sql_files


def _parse_feature(rel: str, text: str) -> dict[str, Any]:
    feature_name = Path(rel).stem
    feature_tags: list[str] = []
    pending_tags: list[str] = []
    scenarios: list[dict[str, Any]] = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if stripped.startswith("@"):
            pending_tags = [part.lstrip("@") for part in stripped.split() if part.startswith("@")]
            continue
        lower = stripped.lower()
        if lower.startswith("feature:"):
            name = stripped.split(":", 1)[1].strip()
            feature_name = name or feature_name
            feature_tags = pending_tags
            pending_tags = []
            continue
        if lower.startswith("scenario outline:") or lower.startswith("scenario:"):
            kind = "outline" if "outline" in lower else "scenario"
            name = stripped.split(":", 1)[1].strip()
            scenarios.append({"name": name, "tags": pending_tags, "type": kind})
            pending_tags = []
    return {"path": rel, "name": feature_name, "tags": feature_tags, "scenarios": scenarios}


def _parse_env_file(rel: str, text: str) -> dict[str, Any]:
    env_id = Path(rel).stem
    variables: list[dict[str, Any]] = []
    secret_keys: list[str] = []
    targets: list[dict[str, str]] = []
    ds_map: dict[str, dict[str, Any]] = {}
    for key, value in _iter_assignments(rel, text):
        if SECRET_KEY_RE.search(key):
            secret_keys.append(key)
            continue
        variables.append({"key": key, "value": value})
        if value.startswith("http://") or value.startswith("https://"):
            kind = "ui" if "ui" in key.lower() or "web" in key.lower() else "api"
            targets.append({"id": key.lower(), "kind": kind, "base_url": value, "source": rel})
        _maybe_datasource(ds_map, key, value)
    return {
        "id": env_id,
        "name": env_id,
        "source": rel,
        "mode": "legacy",
        "active": False,
        "targets": targets,
        "datasources": list(ds_map.values()),
        "secret_keys": sorted(set(secret_keys)),
        "variables": variables,
        "source_files": [{"path": rel, "name": Path(rel).name}],
    }


def _maybe_datasource(ds_map: dict[str, dict[str, Any]], key: str, value: str) -> None:
    upper = key.upper()
    alias = "default"
    field = None
    for prefix in ("ARGON_DB_", "TEST_DB_", "DB_"):
        if upper.startswith(prefix):
            field = upper[len(prefix) :].lower()
            alias = prefix.rstrip("_").lower()
            break
    if field is None:
        return
    bucket = ds_map.setdefault(alias, {"alias": alias, "engine": "", "database": "", "host": "", "secret_keys": []})
    if field in {"host", "hostname"}:
        bucket["host"] = value
    elif field in {"name", "database", "db"}:
        bucket["database"] = value
    elif field in {"engine", "driver"}:
        bucket["engine"] = value


def _iter_assignments(rel: str, text: str) -> Iterable[tuple[str, str]]:
    suffix = Path(rel).suffix.lower()
    if suffix == ".json":
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, (str, int, float, bool)):
                    yield str(key), str(value)
        return
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        assign = ASSIGN_RE.match(stripped)
        if assign:
            yield assign.group(1), assign.group(3)
            continue
        yaml_match = YAML_RE.match(stripped)
        if yaml_match:
            value = yaml_match.group(2) if yaml_match.group(2) is not None else (yaml_match.group(3) or "").strip()
            yield yaml_match.group(1), value.rstrip(",")


def _list_markdown(root: Path, folders: tuple[str, ...]) -> list[dict[str, str]]:
    docs = []
    for folder in folders:
        base = root / folder
        if not base.is_dir():
            continue
        for path in _iter_files(base):
            if path.suffix.lower() not in {".md", ".markdown"}:
                continue
            rel = _rel(root, path)
            docs.append({"path": rel, "name": path.stem})
    return docs


def _iter_files(root: Path) -> Iterable[Path]:
    if not root.is_dir():
        return
    count = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        count += 1
        if count > MAX_SCAN_FILES:
            return
        yield path


def _rel(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _read_text(path: Path) -> str:
    try:
        size = path.stat().st_size
        if size > MAX_PARSE_BYTES:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""
