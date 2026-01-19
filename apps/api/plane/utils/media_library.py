# Python imports
import json
import logging
import os
import re
import shutil
import tempfile
import subprocess
import time
from contextlib import contextmanager
from pathlib import Path

# Django imports
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework.serializers import ValidationError

MANIFEST_VERSION = 1

_SEGMENT_RE = re.compile(r"^[A-Za-z0-9_-]+$")
logger = logging.getLogger(__name__)
META_FILTER_EXCLUDED_KEYS = {
    "duration",
    "duration_sec",
    "durationSec",
    "for",
    "hls",
    "kind",
    "source",
    "source_format",
    "source format",
}


def _get_meta_dict(meta: object) -> dict:
    return meta if isinstance(meta, dict) else {}


def _normalize_meta_values(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        trimmed = value.strip()
        return [trimmed] if trimmed else []
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        results: list[str] = []
        for entry in value:
            results.extend(_normalize_meta_values(entry))
        return results
    return [json.dumps(value)]


def _get_meta_string(meta: dict, keys: list[str], fallback: str = "") -> str:
    for key in keys:
        value = meta.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return fallback


def _get_primary_tag(meta: dict) -> str:
    return _get_meta_string(meta, ["category", "sport", "program"], "Library")


def _get_secondary_tag(meta: dict) -> str:
    return _get_meta_string(meta, ["season", "level", "coach"], "Media")


def _get_author(meta: dict) -> str:
    return _get_meta_string(meta, ["coach", "author", "creator"], "Media Library")


def _stringify_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def _build_query_haystack(artifact: dict) -> str:
    meta = _get_meta_dict(artifact.get("meta"))
    docs = meta.get("docs")
    docs_text = ""
    if isinstance(docs, list):
        docs_text = " ".join([entry for entry in docs if isinstance(entry, str)])

    items_count = meta.get("itemsCount")
    if items_count is None:
        items_count = meta.get("items_count")

    values = [
        _stringify_value(artifact.get("title")),
        _get_author(meta),
        _stringify_value(artifact.get("created_at") or artifact.get("updated_at")),
        _stringify_value(meta.get("views")),
        _get_primary_tag(meta),
        _get_secondary_tag(meta),
        _stringify_value(items_count),
        docs_text,
    ]
    return " ".join([value for value in values if value]).lower()


def filter_media_library_artifacts(
    artifacts: list[dict],
    query: str | None = None,
    filters: list[dict] | None = None,
    section: str | None = None,
    formats: list[str] | None = None,
) -> list[dict]:
    if not artifacts:
        return []

    normalized_query = (query or "").strip().lower()
    normalized_section = (section or "").strip()
    normalized_formats = {
        str(entry).lower() for entry in (formats or []) if str(entry).strip()
    }

    def matches_filters(artifact: dict) -> bool:
        if not filters:
            return True
        if not isinstance(filters, list):
            return True
        meta = _get_meta_dict(artifact.get("meta"))
        for condition in filters:
            if not isinstance(condition, dict):
                continue
            property_name = condition.get("property")
            if not isinstance(property_name, str) or not property_name.startswith("meta."):
                continue
            meta_key = property_name[len("meta."):]
            if not meta_key or meta_key in META_FILTER_EXCLUDED_KEYS:
                continue
            item_values = _normalize_meta_values(meta.get(meta_key))
            if not item_values:
                return False
            value = condition.get("value")
            condition_values = value if isinstance(value, list) else [value]
            condition_values = [
                str(entry)
                for entry in condition_values
                if entry is not None and str(entry).strip()
            ]
            if not condition_values:
                continue
            operator = condition.get("operator")
            if operator in ("exact", "in"):
                if not any(entry in item_values for entry in condition_values):
                    return False
        return True

    def matches_section(artifact: dict) -> bool:
        if not normalized_section:
            return True
        meta = _get_meta_dict(artifact.get("meta"))
        return _get_primary_tag(meta) == normalized_section

    def matches_query(artifact: dict) -> bool:
        if not normalized_query:
            return True
        return normalized_query in _build_query_haystack(artifact)

    def matches_format(artifact: dict) -> bool:
        if not normalized_formats:
            return True
        return str(artifact.get("format") or "").lower() in normalized_formats

    return [
        artifact
        for artifact in artifacts
        if matches_format(artifact)
        and matches_section(artifact)
        and matches_query(artifact)
        and matches_filters(artifact)
    ]

_DOCUMENT_ICON_MAP = {
  "pdf": "pdf-icon.png",
  "doc": "doc-icon.png",
  "docx": "doc-icon.png",
  "ppt": "doc-icon.png",
  "pptx": "doc-icon.png",
  "xls": "excel-icon.png",
  "xlsx": "excel-icon.png",
    "csv": "csv-icon.png",
    "txt": "txt-icon.png",
    "json": "txt-icon.png",
    "md": "txt-icon.png",
    "log": "txt-icon.png",
    "xml": "txt-icon.png",
    "yml": "txt-icon.png",
    "yaml": "txt-icon.png",
    "html": "html-icon.png",
    "css": "css-icon.png",
}
_DOCUMENT_ICON_DEFAULT = "default-icon.png"


def _now_iso() -> str:
    return timezone.now().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def validate_segment(value: str, field: str) -> str:
    if not value or not _SEGMENT_RE.match(value):
        raise ValidationError({field: "Invalid value."})
    return value


def media_library_root() -> Path:
    return Path(settings.MEDIA_LIBRARY_ROOT).resolve(strict=False)


def get_document_icon_source(format_value: str, thumbnail_hint: str | None = None) -> Path | None:
    base_public_dirs: list[Path] = []
    base_from_settings = Path(settings.BASE_DIR).parent.parent / "web" / "public"
    base_public_dirs.append(base_from_settings)
    base_from_repo = None
    resolved_path = Path(__file__).resolve()
    for parent in resolved_path.parents:
        candidate = parent / "apps" / "web" / "public"
        if candidate.exists():
            base_from_repo = candidate
            break
    if base_from_repo and base_from_repo != base_from_settings:
        base_public_dirs.append(base_from_repo)
    base_from_static = Path(settings.BASE_DIR) / "static"
    if base_from_static not in base_public_dirs:
        base_public_dirs.append(base_from_static)

    for base_public_dir in base_public_dirs:
        if not base_public_dir.exists():
            continue
        if thumbnail_hint and isinstance(thumbnail_hint, str):
            normalized_hint = thumbnail_hint.lstrip("/").replace("\\", "/")
            candidate = (base_public_dir / normalized_hint).resolve(strict=False)
            try:
                if (
                    os.path.commonpath([str(base_public_dir), str(candidate)]) == str(base_public_dir)
                    and candidate.exists()
                ):
                    return candidate
            except ValueError:
                continue

    if not format_value:
        return None

    for base_public_dir in base_public_dirs:
        attachment_dir = base_public_dir / "attachment"
        if not attachment_dir.exists():
            continue
        key = format_value.lower()
        icon_name = _DOCUMENT_ICON_MAP.get(key, _DOCUMENT_ICON_DEFAULT)
        icon_path = attachment_dir / icon_name
        if icon_path.exists():
            return icon_path
        fallback_path = attachment_dir / _DOCUMENT_ICON_DEFAULT
        if fallback_path.exists():
            return fallback_path

    return None


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
    with open(path, "r", encoding="utf-8-sig") as handle:
        try:
            data = json.load(handle)
        except json.JSONDecodeError as exc:
            raise ValidationError({"manifest": "Invalid manifest JSON."}) from exc
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


@contextmanager
def manifest_write_lock(path: Path, timeout: float = 10.0, poll_interval: float = 0.1):
    lock_path = Path(f"{path}.lock")
    start = time.monotonic()
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            try:
                age = time.time() - lock_path.stat().st_mtime
                if age > timeout:
                    lock_path.unlink(missing_ok=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() - start >= timeout:
                raise TimeoutError("Timed out waiting for manifest lock.")
            time.sleep(poll_interval)
    try:
        yield
    finally:
        try:
            lock_path.unlink(missing_ok=True)
        except OSError:
            pass


def delete_project_library(project_id: str) -> bool:
    root = project_root(project_id)
    if not root.exists():
        return False
    shutil.rmtree(root)
    return True


class MediaLibraryTranscodeError(RuntimeError):
    pass


def transcode_mp4_to_hls(
    file_obj,
    output_dir: Path,
    segment_seconds: int = 6,
    thumbnail_path: Path | None = None,
) -> tuple[Path, Path | None]:
    if shutil.which("ffmpeg") is None:
        raise MediaLibraryTranscodeError("ffmpeg is not installed.")

    output_dir.mkdir(parents=True, exist_ok=False)
    tmp_input_path = None
    success = False

    def _render_ffmpeg_error(exc: subprocess.CalledProcessError) -> str:
        detail = (exc.stderr or exc.stdout or "").strip()
        if detail:
            detail = detail.replace("\n", " ")
            if len(detail) > 500:
                detail = f"{detail[:500]}..."
        return detail

    def _run_ffmpeg(cmd: list[str]) -> None:
        subprocess.run(cmd, check=True, cwd=str(output_dir), capture_output=True, text=True)

    def _reset_output_dir() -> None:
        if not output_dir.exists():
            return
        for entry in output_dir.iterdir():
            if entry.is_dir():
                shutil.rmtree(entry, ignore_errors=True)
            else:
                try:
                    entry.unlink()
                except OSError:
                    pass

    try:
        with tempfile.NamedTemporaryFile(dir=output_dir.parent, suffix=".mp4", delete=False) as handle:
            tmp_input_path = Path(handle.name)
            for chunk in file_obj.chunks():
                handle.write(chunk)

        playlist_name = "index.m3u8"
        base_cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(tmp_input_path),
            "-hls_time",
            str(segment_seconds),
            "-hls_list_size",
            "0",
            "-hls_flags",
            "independent_segments",
            "-hls_segment_filename",
            "segment_%05d.ts",
            playlist_name,
        ]

        try:
            _run_ffmpeg([*base_cmd[:7], "-c", "copy", *base_cmd[7:]])
        except subprocess.CalledProcessError as exc:
            detail = _render_ffmpeg_error(exc)
            if detail:
                logger.info("ffmpeg stream copy failed, falling back to encode: %s", detail)
            else:
                logger.info("ffmpeg stream copy failed, falling back to encode.")
            _reset_output_dir()
            encode_cmd = [
                *base_cmd[:7],
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                *base_cmd[7:],
            ]
            _run_ffmpeg(encode_cmd)

        created_thumbnail = None
        if thumbnail_path:
            try:
                thumb_cmd = [
                    "ffmpeg",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-ss",
                    "00:00:00.000",
                    "-i",
                    str(tmp_input_path),
                    "-frames:v",
                    "1",
                    "-q:v",
                    "2",
                    str(thumbnail_path),
                ]
                _run_ffmpeg(thumb_cmd)
                created_thumbnail = thumbnail_path
            except subprocess.CalledProcessError as exc:
                detail = _render_ffmpeg_error(exc)
                if detail:
                    logger.error("ffmpeg thumbnail failed: %s", detail)
                else:
                    logger.error("ffmpeg thumbnail failed with exit code %s", exc.returncode)
        success = True
        return output_dir / playlist_name, created_thumbnail
    except FileNotFoundError as exc:
        logger.error("ffmpeg is not installed.", exc_info=exc)
        raise MediaLibraryTranscodeError("ffmpeg is not installed.") from exc
    except subprocess.CalledProcessError as exc:
        detail = _render_ffmpeg_error(exc)
        if detail:
            logger.error("ffmpeg failed: %s", detail)
            raise MediaLibraryTranscodeError(f"Video conversion failed: {detail}") from exc
        logger.error("ffmpeg failed with exit code %s", exc.returncode)
        raise MediaLibraryTranscodeError("Video conversion failed.") from exc
    finally:
        if tmp_input_path and tmp_input_path.exists():
            try:
                tmp_input_path.unlink()
            except OSError:
                pass
        if not success and output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
