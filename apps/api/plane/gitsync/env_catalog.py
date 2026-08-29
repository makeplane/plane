# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Parse test-platform named environments without exec or files-API access."""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

SECRET_KEY_RE = re.compile(r"(password|secret|token|passwd|api_key|credential|private_key)", re.I)
ENV_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9._-]*$")
MAX_PARSE_BYTES = 256_000
ENV_LOCAL_REL = "config/env_local.py"
ENV_LOCAL_EXAMPLE_REL = "config/env_local.py.example"
ACTIVE_ENV_REL = "config/.active_env"


def read_limited_text(path: Path, max_bytes: int = MAX_PARSE_BYTES) -> str:
    try:
        size = path.stat().st_size
        if size > max_bytes:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def parse_python_assigns(text: str) -> dict[str, Any]:
    """Extract literal module-level assignments via AST. Never exec."""
    if not text.strip():
        return {}
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return {}
    result: dict[str, Any] = {}
    for node in tree.body:
        target_name = None
        value_node = None
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            target_name = node.targets[0].id
            value_node = node.value
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.value is not None:
            target_name = node.target.id
            value_node = node.value
        if not target_name or value_node is None:
            continue
        try:
            result[target_name] = ast.literal_eval(value_node)
        except (ValueError, TypeError):
            continue
    return result


def parse_python_file(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    return parse_python_assigns(read_limited_text(path))


def read_active_env_name(root: Path) -> str | None:
    path = root / "config" / ".active_env"
    if not path.is_file():
        return None
    for line in read_limited_text(path).splitlines():
        text = line.strip()
        if text and not text.startswith("#"):
            return text
    return None


def merge_databases(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    merged: dict[str, Any] = {str(alias): dict(cfg) for alias, cfg in base.items() if isinstance(cfg, dict)}
    for alias, cfg in overlay.items():
        if not isinstance(cfg, dict):
            continue
        key = str(alias)
        if key in merged:
            merged[key] = {**merged[key], **cfg}
        else:
            merged[key] = dict(cfg)
    return merged


def apply_profile(base: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    target = {
        "DATABASES": dict(base.get("DATABASES") or {}) if isinstance(base.get("DATABASES"), dict) else {},
        "TEST_BASE_URL": base.get("TEST_BASE_URL") or "",
        "TEST_ACCOUNT": base.get("TEST_ACCOUNT"),
    }
    extra = profile.get("DATABASES")
    if isinstance(extra, dict):
        target["DATABASES"] = merge_databases(target["DATABASES"], extra)
    url = profile.get("TEST_BASE_URL")
    if url:
        target["TEST_BASE_URL"] = str(url)
    account = profile.get("TEST_ACCOUNT")
    if account:
        target["TEST_ACCOUNT"] = account
    return target


def merge_module(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    extra = overlay.get("DATABASES")
    databases = dict(base.get("DATABASES") or {}) if isinstance(base.get("DATABASES"), dict) else {}
    if isinstance(extra, dict):
        databases = merge_databases(databases, extra)
    url = overlay.get("TEST_BASE_URL")
    account = overlay.get("TEST_ACCOUNT")
    return {
        "DATABASES": databases,
        "TEST_BASE_URL": str(url) if url else (base.get("TEST_BASE_URL") or ""),
        "TEST_ACCOUNT": account if account else base.get("TEST_ACCOUNT"),
        "ENVIRONMENTS": overlay.get("ENVIRONMENTS", base.get("ENVIRONMENTS")),
        "ACTIVE_ENV": overlay.get("ACTIVE_ENV", base.get("ACTIVE_ENV")),
    }


def resolve_catalog_active_name(
    *,
    available: list[str],
    module_default: str | None,
    active_file_text: str | None,
) -> str | None:
    known = [name for name in available if name]
    if not known:
        return None
    for chosen in (active_file_text, module_default):
        text = (chosen or "").strip()
        if text and text in known:
            return text
    if len(known) == 1:
        return known[0]
    return None


def named_environment_ids(payload: dict[str, Any]) -> list[str]:
    return [
        str(item.get("id") or "")
        for item in (payload.get("environments") or [])
        if item.get("mode") == "named" and item.get("id")
    ]


def catalog_entry(
    *,
    env_id: str,
    name: str,
    source: str,
    mode: str,
    databases: dict[str, Any],
    test_base_url: Any,
    test_account: Any,
    source_files: list[dict[str, str]],
    active: bool,
) -> dict[str, Any]:
    secret_keys: list[str] = []
    variables: list[dict[str, Any]] = []
    targets: list[dict[str, str]] = []
    datasources: list[dict[str, Any]] = []

    url = str(test_base_url or "").strip()
    if url:
        variables.append({"key": "TEST_BASE_URL", "value": url})
        if url.startswith("http://") or url.startswith("https://"):
            targets.append({"id": "test_base_url", "kind": "api", "base_url": url, "source": source})

    if isinstance(test_account, dict):
        username = test_account.get("username")
        if username is not None and not SECRET_KEY_RE.search("username"):
            variables.append({"key": "TEST_ACCOUNT.username", "value": str(username)})
        for key in test_account:
            if SECRET_KEY_RE.search(str(key)):
                secret_keys.append(f"TEST_ACCOUNT.{key}")

    for alias, cfg in (databases or {}).items():
        if not isinstance(cfg, dict):
            continue
        ds_secrets: list[str] = []
        for field, value in cfg.items():
            field_name = str(field)
            if SECRET_KEY_RE.search(field_name):
                ds_secrets.append(field_name)
                secret_keys.append(f"{alias}.{field_name}")
                continue
            if value is None:
                continue
            variables.append({"key": f"{alias}.{field_name}", "value": str(value)})
        datasources.append(
            {
                "alias": str(alias),
                "engine": str(cfg.get("type") or cfg.get("engine") or ""),
                "database": str(cfg.get("database") or ""),
                "host": str(cfg.get("host") or ""),
                "secret_keys": ds_secrets,
            }
        )

    return {
        "id": env_id,
        "name": name,
        "source": source,
        "mode": mode,
        "active": active,
        "targets": targets,
        "datasources": datasources,
        "secret_keys": sorted(set(secret_keys)),
        "variables": variables,
        "source_files": source_files,
    }


def scan_named_environments(root: Path) -> dict[str, Any] | None:
    """Return a named/template/flat catalog, or None to fall back to flat file scan."""
    env_py = root / "config" / "env.py"
    overlay_py = root / "config" / "env_overlay.py"
    local_py = root / "config" / "env_local.py"
    example_py = root / "config" / "env_local.py.example"
    env_local_present = local_py.is_file()

    base = parse_python_file(env_py)
    overlay = parse_python_file(overlay_py)
    if overlay:
        base = merge_module(base, overlay)

    source_files: list[dict[str, str]] = []
    if env_py.is_file():
        source_files.append({"path": "config/env.py", "name": "env.py"})
    if overlay_py.is_file():
        source_files.append({"path": "config/env_overlay.py", "name": "env_overlay.py"})

    local: dict[str, Any] = {}
    local_rel = ""
    if local_py.is_file():
        local = parse_python_file(local_py)
        local_rel = ENV_LOCAL_REL
        source_files.append({"path": ENV_LOCAL_REL, "name": "env_local.py"})
    elif example_py.is_file():
        local = parse_python_file(example_py)
        local_rel = ENV_LOCAL_EXAMPLE_REL
        source_files.append({"path": ENV_LOCAL_EXAMPLE_REL, "name": "env_local.py.example"})

    environments_map = local.get("ENVIRONMENTS")
    has_databases = isinstance(base.get("DATABASES"), dict) and bool(base.get("DATABASES"))
    has_named = isinstance(environments_map, dict) and bool(environments_map)
    if not has_named and not has_databases:
        return None

    pointer = read_active_env_name(root)
    default = str(local.get("ACTIVE_ENV") or "") or None

    if has_named:
        names = [str(key) for key in environments_map if str(key).strip()]
        active = resolve_catalog_active_name(
            available=names,
            module_default=default,
            active_file_text=pointer,
        )
        environments = []
        for name in names:
            profile = environments_map.get(name)
            if not isinstance(profile, dict):
                continue
            applied = apply_profile(base, profile)
            environments.append(
                catalog_entry(
                    env_id=name,
                    name=name,
                    source=local_rel or "config/env.py",
                    mode="named",
                    databases=applied["DATABASES"],
                    test_base_url=applied["TEST_BASE_URL"],
                    test_account=applied["TEST_ACCOUNT"],
                    source_files=source_files,
                    active=name == active,
                )
            )
        return {
            "counts": {"environments": len(environments)},
            "environments": environments,
            "active_env": active,
            "env_local_present": env_local_present,
            "mode": "named",
        }

    merged = merge_module(base, local) if local else base
    mode = "flat" if env_local_present else "template"
    env_id = "default"
    environments = [
        catalog_entry(
            env_id=env_id,
            name=env_id,
            source=local_rel or "config/env.py",
            mode=mode,
            databases=merged.get("DATABASES") if isinstance(merged.get("DATABASES"), dict) else {},
            test_base_url=merged.get("TEST_BASE_URL"),
            test_account=merged.get("TEST_ACCOUNT"),
            source_files=source_files,
            active=True,
        )
    ]
    return {
        "counts": {"environments": len(environments)},
        "environments": environments,
        "active_env": env_id,
        "env_local_present": env_local_present,
        "mode": mode,
    }


def read_env_local_payload(workdir: str, max_bytes: int = MAX_PARSE_BYTES) -> dict[str, Any]:
    root = Path(workdir)
    target = root / "config" / "env_local.py"
    example = root / "config" / "env_local.py.example"
    if target.is_file():
        size = target.stat().st_size
        if size > max_bytes:
            raise ValueError(f"file too large ({size} bytes)")
        return {
            "path": ENV_LOCAL_REL,
            "exists": True,
            "example": False,
            "content": target.read_text(encoding="utf-8", errors="replace"),
        }
    if example.is_file():
        size = example.stat().st_size
        if size > max_bytes:
            raise ValueError(f"file too large ({size} bytes)")
        return {
            "path": ENV_LOCAL_REL,
            "exists": False,
            "example": True,
            "content": example.read_text(encoding="utf-8", errors="replace"),
        }
    return {"path": ENV_LOCAL_REL, "exists": False, "example": False, "content": ""}
