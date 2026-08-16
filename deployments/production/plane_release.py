#!/usr/bin/env python3
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Coordinated Plane release manifests, digest checks, and snapshots.

This module is used by GitHub Actions and by the production host. It does not
talk to Docker Hub or SSH. Callers supply inspect/pull results.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

SCHEMA_VERSION = 1
COMPONENTS = ("frontend", "admin", "space", "live", "backend", "proxy")
APP_SERVICES = ("web", "admin", "space", "api", "worker", "beat-worker", "live", "proxy")
DATASTORE_SERVICES = ("plane-db", "plane-redis", "plane-mq", "plane-minio")
MIGRATOR_SERVICE = "migrator"
WATCHTOWER_LABEL = "com.centurylinklabs.watchtower.enable"

COMPONENT_ENV = {
    "frontend": "PLANE_IMAGE_FRONTEND",
    "admin": "PLANE_IMAGE_ADMIN",
    "space": "PLANE_IMAGE_SPACE",
    "live": "PLANE_IMAGE_LIVE",
    "backend": "PLANE_IMAGE_BACKEND",
    "proxy": "PLANE_IMAGE_PROXY",
}

COMPONENT_SERVICES = {
    "frontend": ("web",),
    "admin": ("admin",),
    "space": ("space",),
    "live": ("live",),
    "backend": ("api", "worker", "beat-worker", "migrator"),
    "proxy": ("proxy",),
}

SHA256_RE = re.compile(r"^sha256:[a-f0-9]{64}$")
GIT_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
MAX_RELEASE_RECORDS = 10


class ReleaseError(ValueError):
    """Invalid manifest, digest mismatch, or incomplete release set."""


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def normalize_digest(value: str) -> str:
    if not value or not str(value).strip():
        raise ReleaseError("digest is required")
    raw = str(value).strip()
    if "@sha256:" in raw:
        raw = "sha256:" + raw.split("@sha256:", 1)[1]
    if raw.startswith("sha256:"):
        hexpart = raw[7:].split()[0].lower()
        digest = f"sha256:{hexpart}"
        if not SHA256_RE.match(digest):
            raise ReleaseError(f"invalid digest {value!r}")
        return digest
    raise ReleaseError(f"digest must be sha256:<64 hex>, got {value!r}")


def repository_from_ref(image_ref: str) -> str:
    if not image_ref or ":" not in image_ref:
        raise ReleaseError(f"image ref must include a tag: {image_ref!r}")
    if image_ref.startswith("makeplane/"):
        raise ReleaseError(f"makeplane/* application images are not allowed: {image_ref}")
    name = image_ref.rsplit(":", 1)[0]
    if not name or name.endswith(":"):
        raise ReleaseError(f"invalid image ref {image_ref!r}")
    return name


def digest_pull_spec(image_ref: str, digest: str) -> str:
    repo = repository_from_ref(image_ref)
    return f"{repo}@{normalize_digest(digest)}"


def build_manifest(
    *,
    revision: str,
    images: Mapping[str, Mapping[str, str]],
    built_at: str | None = None,
    repository: str = "AFZidan/plane",
) -> dict[str, Any]:
    revision = (revision or "").strip().lower()
    if not GIT_SHA_RE.match(revision):
        raise ReleaseError("revision must be a 40-character git SHA")
    payload_images: dict[str, dict[str, str]] = {}
    missing = [name for name in COMPONENTS if name not in images]
    if missing:
        raise ReleaseError(f"manifest missing components: {', '.join(missing)}")
    extra = sorted(set(images) - set(COMPONENTS))
    if extra:
        raise ReleaseError(f"manifest has unknown components: {', '.join(extra)}")
    for name in COMPONENTS:
        entry = images[name]
        ref = str(entry.get("ref") or "").strip()
        digest = normalize_digest(str(entry.get("digest") or ""))
        repository_from_ref(ref)
        payload_images[name] = {"ref": ref, "digest": digest}
    return {
        "schema_version": SCHEMA_VERSION,
        "revision": revision,
        "built_at": built_at or utc_now(),
        "repository": repository,
        "images": payload_images,
    }


def validate_manifest(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ReleaseError("manifest must be a JSON object")
    if data.get("schema_version") != SCHEMA_VERSION:
        raise ReleaseError("unsupported manifest schema_version")
    images = data.get("images")
    if not isinstance(images, dict):
        raise ReleaseError("manifest.images must be an object")
    return build_manifest(
        revision=str(data.get("revision") or ""),
        images=images,
        built_at=str(data.get("built_at") or utc_now()),
        repository=str(data.get("repository") or "AFZidan/plane"),
    )


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ReleaseError(f"cannot read manifest {path}: {exc}") from exc
    return validate_manifest(data)


def dump_manifest(manifest: Mapping[str, Any], path: Path) -> None:
    validated = validate_manifest(manifest)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(validated, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def actual_digest_from_inspect(inspect_payload: Any) -> str | None:
    """Extract a registry digest from `docker image inspect` JSON (one image)."""
    if isinstance(inspect_payload, list):
        if not inspect_payload:
            return None
        inspect_payload = inspect_payload[0]
    if not isinstance(inspect_payload, dict):
        return None
    repo_digests = inspect_payload.get("RepoDigests") or []
    for item in repo_digests:
        try:
            return normalize_digest(str(item))
        except ReleaseError:
            continue
    digest = inspect_payload.get("Digest")
    if isinstance(digest, str) and digest.startswith("sha256:"):
        try:
            return normalize_digest(digest)
        except ReleaseError:
            return None
    return None


def verify_component_digest(expected: str, actual: str | None, *, component: str, ref: str) -> None:
    expected_digest = normalize_digest(expected)
    if not actual:
        raise ReleaseError(f"{component} ({ref}): pulled image has no registry digest")
    actual_digest = normalize_digest(actual)
    if actual_digest != expected_digest:
        raise ReleaseError(
            f"{component} digest mismatch for {ref}: expected {expected_digest}, got {actual_digest}. "
            "A matching tag is not sufficient. Stop before recreating containers."
        )


def verify_manifest_images(
    manifest: Mapping[str, Any],
    inspect_by_component: Mapping[str, Any],
) -> None:
    validated = validate_manifest(manifest)
    for name in COMPONENTS:
        if name not in inspect_by_component:
            raise ReleaseError(f"{name}: image was not inspected after pull")
        actual = actual_digest_from_inspect(inspect_by_component[name])
        image = validated["images"][name]
        verify_component_digest(image["digest"], actual, component=name, ref=image["ref"])


def watchtower_enabled(labels: Mapping[str, Any] | None) -> bool:
    if not labels:
        return False
    value = str(labels.get(WATCHTOWER_LABEL) or "").strip().lower()
    return value in {"true", "1", "yes"}


def prune_release_dirs(root: Path, keep: int = MAX_RELEASE_RECORDS) -> list[Path]:
    if keep < 1:
        raise ReleaseError("keep must be >= 1")
    if not root.exists():
        return []
    dirs = sorted(
        [
            path
            for path in root.iterdir()
            if path.is_dir() and not path.is_symlink() and path.name != "current"
        ]
    )
    removed: list[Path] = []
    overflow = dirs[:-keep] if len(dirs) > keep else []
    for path in overflow:
        for child in sorted(path.rglob("*"), reverse=True):
            if child.is_file() or child.is_symlink():
                child.unlink()
            elif child.is_dir():
                child.rmdir()
        path.rmdir()
        removed.append(path)
    return removed


def snapshot_to_manifest(snapshot: Mapping[str, Any], repository: str = "AFZidan/plane") -> dict[str, Any]:
    revision = str(snapshot.get("build_revision") or snapshot.get("revision") or "")
    images = snapshot.get("images")
    if not isinstance(images, dict):
        raise ReleaseError("snapshot has no images object")
    return build_manifest(revision=revision, images=images, repository=repository, built_at=str(snapshot.get("recorded_at") or utc_now()))


def snapshot_record(
    *,
    recorded_at: str | None = None,
    build_revision: str | None,
    images: Mapping[str, Mapping[str, str]],
    containers: Mapping[str, Mapping[str, str]] | None = None,
) -> dict[str, Any]:
    return {
        "recorded_at": recorded_at or utc_now(),
        "build_revision": build_revision,
        "images": dict(images),
        "containers": dict(containers or {}),
    }


def policy_is_self_hosted_unlimited(payload: Mapping[str, Any]) -> None:
    capabilities = payload.get("capabilities") or {}
    policy = capabilities.get("policy") or payload.get("policy") or {}
    checks = {
        "self_hosted": True,
        "commercial_gating": False,
        "feature_tier": "unlimited",
    }
    for key, expected in checks.items():
        actual = policy.get(key)
        if actual != expected:
            raise ReleaseError(f"policy.{key} expected {expected!r}, got {actual!r}")


def build_revision_matches(payload: Mapping[str, Any], expected_sha: str) -> None:
    expected = expected_sha.strip().lower()
    config = payload.get("config") or {}
    actual = str(config.get("build_revision") or payload.get("build_revision") or "").strip().lower()
    if not actual:
        raise ReleaseError("API did not return config.build_revision")
    if actual != expected:
        raise ReleaseError(f"build_revision {actual} does not match release SHA {expected}")


def _parse_generate(args: argparse.Namespace) -> dict[str, Any]:
    images: dict[str, dict[str, str]] = {}
    for name in COMPONENTS:
        ref = getattr(args, f"{name}_ref")
        digest = getattr(args, f"{name}_digest")
        images[name] = {"ref": ref, "digest": digest}
    return build_manifest(
        revision=args.revision,
        images=images,
        built_at=args.built_at,
        repository=args.repository,
    )


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Plane coordinated release helper")
    sub = parser.add_subparsers(dest="command", required=True)

    generate = sub.add_parser("generate", help="Write a release manifest")
    generate.add_argument("--revision", required=True)
    generate.add_argument("--repository", default="AFZidan/plane")
    generate.add_argument("--built-at", default="")
    generate.add_argument("--output", required=True)
    for name in COMPONENTS:
        generate.add_argument(f"--{name}-ref", required=True)
        generate.add_argument(f"--{name}-digest", required=True)

    validate = sub.add_parser("validate", help="Validate a release manifest")
    validate.add_argument("--manifest", required=True)

    verify = sub.add_parser("verify-inspect", help="Compare inspect JSON to a manifest")
    verify.add_argument("--manifest", required=True)
    verify.add_argument(
        "--inspect-dir",
        required=True,
        help="Directory of <component>.json docker image inspect payloads",
    )

    prune = sub.add_parser("prune-releases", help="Keep the newest N release directories")
    prune.add_argument("--root", required=True)
    prune.add_argument("--keep", type=int, default=MAX_RELEASE_RECORDS)

    promote = sub.add_parser("snapshot-to-manifest", help="Convert a complete snapshot into a manifest")
    promote.add_argument("--snapshot", required=True)
    promote.add_argument("--output", required=True)

    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        if args.command == "generate":
            manifest = _parse_generate(args)
            dump_manifest(manifest, Path(args.output))
            print(json.dumps(manifest, indent=2))
            return 0
        if args.command == "validate":
            manifest = load_manifest(Path(args.manifest))
            print(json.dumps(manifest, indent=2))
            return 0
        if args.command == "verify-inspect":
            manifest = load_manifest(Path(args.manifest))
            inspect_dir = Path(args.inspect_dir)
            inspect_by_component = {}
            for name in COMPONENTS:
                path = inspect_dir / f"{name}.json"
                inspect_by_component[name] = json.loads(path.read_text(encoding="utf-8"))
            verify_manifest_images(manifest, inspect_by_component)
            print("digests match")
            return 0
        if args.command == "prune-releases":
            removed = prune_release_dirs(Path(args.root), keep=args.keep)
            print(json.dumps([str(path) for path in removed]))
            return 0
        if args.command == "snapshot-to-manifest":
            snapshot = json.loads(Path(args.snapshot).read_text(encoding="utf-8"))
            manifest = snapshot_to_manifest(snapshot)
            dump_manifest(manifest, Path(args.output))
            print(json.dumps(manifest, indent=2))
            return 0
    except ReleaseError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 1


if __name__ == "__main__":
    sys.exit(main())
