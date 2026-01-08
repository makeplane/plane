# Python imports
import json
import os
import re
import shutil
import tempfile
from pathlib import Path

# Django imports
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework.serializers import ValidationError

MANIFEST_VERSION = 1

_SEGMENT_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def _now_iso() -> str:
    return timezone.now().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def validate_segment(value: str, field: str) -> str:
    if not value or not _SEGMENT_RE.match(value):
        raise ValidationError({field: "Invalid value."})
    return value


def media_library_root() -> Path:
    return Path(settings.MEDIA_LIBRARY_ROOT).resolve(strict=False)


def safe_join(base: Path, *segments: str) -> Path:
    base_resolved = Path(base).resolve(strict=False)
    path = base_resolved
    for seg in segments:
        validate_segment(seg, "path")
        path = path / seg
    resolved = path.resolve(strict=False)
    if os.path.commonpath([str(base_resolved), str(resolved)]) != str(base_resolved):
        raise ValidationError({"path": "Resolved path escapes base directory."})
    return resolved


def package_root(project_id: str, package_id: str) -> Path:
    validate_segment(project_id, "projectId")
    validate_segment(package_id, "packageId")
    return safe_join(
        media_library_root(),
        "projects",
        project_id,
        "packages",
        package_id,
    )


def project_root(project_id: str) -> Path:
    validate_segment(project_id, "projectId")
    return safe_join(media_library_root(), "projects", project_id)


def ensure_project_library(project_id: str) -> Path:
    root = project_root(project_id)
    packages_root = root / "packages"
    packages_root.mkdir(parents=True, exist_ok=True)
    return packages_root


def manifest_path(project_id: str, package_id: str) -> Path:
    return package_root(project_id, package_id) / "manifest.json"


def create_manifest(project_id: str, package_id: str, name: str, title: str, artifacts=None) -> dict:
    timestamp = _now_iso()
    return {
        "manifestVersion": MANIFEST_VERSION,
        "id": package_id,
        "type": "package",
        "projectId": project_id,
        "name": name,
        "title": title,
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "artifacts": list(artifacts) if artifacts else [],
    }


def read_manifest(path: Path) -> dict:
    if not path.exists():
        raise ValidationError({"manifest": "Manifest not found."})
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data.get("artifacts"), list):
        raise ValidationError({"manifest": "Invalid manifest: artifacts must be a list."})
    return data


def write_manifest_atomic(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, sort_keys=False)
            handle.write("\n")
        os.replace(tmp_path, path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def delete_project_library(project_id: str) -> bool:
    root = project_root(project_id)
    if not root.exists():
        return False
    shutil.rmtree(root)
    return True
