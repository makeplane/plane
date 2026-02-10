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
THUMBNAIL_MAX_BYTES = int(getattr(settings, "MEDIA_LIBRARY_THUMBNAIL_MAX_BYTES", 51200))
THUMBNAIL_PRESETS: tuple[tuple[int, int], ...] = (
    (480, 82),
    (400, 78),
    (320, 74),
    (256, 70),
    (200, 66),
    (160, 60),
    (128, 54),
    (96, 48),
    (64, 42),
)

HLS_RENDITIONS: tuple[dict[str, str | int], ...] = (
    {
        "name": "480p",
        "width": 854,
        "height": 480,
        "video_bitrate": "1400k",
        "maxrate": "1498k",
        "bufsize": "2100k",
        "audio_bitrate": "96k",
        "bandwidth": 1498000,
    },
    {
        "name": "720p",
        "width": 1280,
        "height": 720,
        "video_bitrate": "2800k",
        "maxrate": "2996k",
        "bufsize": "4200k",
        "audio_bitrate": "128k",
        "bandwidth": 2996000,
    },
    {
        "name": "1080p",
        "width": 1920,
        "height": 1080,
        "video_bitrate": "5000k",
        "maxrate": "5350k",
        "bufsize": "7500k",
        "audio_bitrate": "128k",
        "bandwidth": 5350000,
    },
    {
        "name": "1440p",
        "width": 2560,
        "height": 1440,
        "video_bitrate": "8000k",
        "maxrate": "8560k",
        "bufsize": "12000k",
        "audio_bitrate": "160k",
        "bandwidth": 8560000,
    },
    {
        "name": "2160p",
        "width": 3840,
        "height": 2160,
        "video_bitrate": "14000k",
        "maxrate": "14980k",
        "bufsize": "21000k",
        "audio_bitrate": "192k",
        "bandwidth": 14980000,
    },
    {
        "name": "4320p",
        "width": 7680,
        "height": 4320,
        "video_bitrate": "28000k",
        "maxrate": "29960k",
        "bufsize": "42000k",
        "audio_bitrate": "192k",
        "bandwidth": 29960000,
    },
)

EVENT_META_KEYS = {
    "category",
    "start_date",
    "start_time",
    "level",
    "program",
    "sport",
    "opposition",
    "season",
}

ARTIFACT_FIELD_KEYS = {
    "title",
    "description",
    "meta",
}


def _apply_event_meta(existing: dict, updates: dict) -> dict:
    if not isinstance(existing, dict):
        existing = {}
    if not isinstance(updates, dict):
        updates = {}
    merged = dict(existing)
    for key in EVENT_META_KEYS:
        if key not in updates:
            continue
        value = updates.get(key)
        if value is None or value == "":
            merged.pop(key, None)
        else:
            merged[key] = value
    return merged


def update_manifest_event_meta(manifest: dict, work_item_id: str, updates: dict) -> int:
    if not work_item_id or not isinstance(manifest, dict):
        return 0
    artifacts = manifest.get("artifacts") or []
    if not isinstance(artifacts, list) or not artifacts:
        return 0
    metadata = ensure_manifest_metadata(manifest)
    updated_refs: set[str] = set()
    inline_updates = 0
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            continue
        if str(artifact.get("work_item_id") or "") != work_item_id:
            continue
        metadata_ref = normalize_metadata_ref(artifact.get("metadata_ref")) or normalize_metadata_ref(artifact.get("name"))
        if metadata_ref:
            updated_refs.add(metadata_ref)
            continue
        existing_meta = artifact.get("meta")
        if not isinstance(existing_meta, dict):
            existing_meta = {}
        next_meta = _apply_event_meta(existing_meta, updates)
        if next_meta != existing_meta:
            artifact["meta"] = next_meta
            inline_updates += 1
    for metadata_ref in updated_refs:
        existing_entry = metadata.get(metadata_ref)
        if not isinstance(existing_entry, dict):
            existing_entry = {}
        metadata[metadata_ref] = _apply_event_meta(existing_entry, updates)
    manifest["metadata"] = metadata
    return len(updated_refs) + inline_updates


def update_manifest_artifact_fields(
    manifest: dict, updates: dict, work_item_id: str | None = None, artifact_id: str | None = None
) -> int:
    if not isinstance(manifest, dict):
        return 0
    artifacts = manifest.get("artifacts") or []
    if not isinstance(artifacts, list) or not artifacts:
        return 0
    target_work_item = str(work_item_id or "")
    target_artifact = str(artifact_id or "")
    if not target_work_item and not target_artifact:
        return 0
    updated_count = 0
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            continue
        if target_artifact:
            if str(artifact.get("name") or "") != target_artifact:
                continue
        elif str(artifact.get("work_item_id") or "") != target_work_item:
            continue
        changed = False
        for key in ARTIFACT_FIELD_KEYS:
            if key not in updates:
                continue
            value = updates.get(key)
            if key == "meta" and value not in (None, "") and not isinstance(value, dict):
                continue
            if value is None or value == "":
                if key in artifact:
                    artifact.pop(key, None)
                    changed = True
            elif artifact.get(key) != value:
                artifact[key] = value
                changed = True
        if changed:
            updated_count += 1
    return updated_count


def normalize_metadata_ref(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    if not _SEGMENT_RE.match(trimmed):
        return None
    return trimmed


def ensure_manifest_metadata(manifest: dict) -> dict:
    metadata = manifest.get("metadata")
    if not isinstance(metadata, dict):
        metadata = {}
        manifest["metadata"] = metadata
    return metadata


def normalize_manifest_metadata(manifest: dict) -> dict:
    metadata = ensure_manifest_metadata(manifest)
    artifacts = manifest.get("artifacts") or []
    normalized_artifacts: list[dict] = []
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            normalized_artifacts.append(artifact)
            continue
        meta = artifact.pop("meta", None)
        metadata_ref = normalize_metadata_ref(artifact.get("metadata_ref"))
        if not metadata_ref:
            metadata_ref = normalize_metadata_ref(artifact.get("name"))
        if metadata_ref:
            artifact["metadata_ref"] = metadata_ref
            if isinstance(meta, dict) and meta:
                existing = metadata.get(metadata_ref)
                if isinstance(existing, dict):
                    merged = dict(existing)
                    merged.update(meta)
                    metadata[metadata_ref] = merged
                else:
                    metadata[metadata_ref] = dict(meta)
            elif metadata_ref not in metadata:
                metadata[metadata_ref] = {}
        else:
            if isinstance(meta, dict):
                artifact["meta"] = meta
        normalized_artifacts.append(artifact)
    manifest["artifacts"] = normalized_artifacts
    manifest["metadata"] = metadata
    return manifest


def resolve_artifact_metadata(artifact: dict, metadata: dict | None = None) -> dict:
    direct_meta = artifact.get("meta")
    if isinstance(direct_meta, dict):
        return direct_meta
    metadata_ref = normalize_metadata_ref(artifact.get("metadata_ref"))
    if not metadata_ref:
        metadata_ref = normalize_metadata_ref(artifact.get("name"))
    if metadata and metadata_ref:
        meta = metadata.get(metadata_ref)
        if isinstance(meta, dict):
            return meta
    return {}


def hydrate_artifacts_with_meta(
    artifacts: list[dict],
    metadata: dict | None = None,
) -> list[dict]:
    if not metadata:
        return artifacts
    hydrated: list[dict] = []
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            hydrated.append(artifact)
            continue
        if isinstance(artifact.get("meta"), dict):
            hydrated.append(artifact)
            continue
        meta = resolve_artifact_metadata(artifact, metadata)
        if meta:
            entry = artifact.copy()
            entry["meta"] = meta
            hydrated.append(entry)
        else:
            hydrated.append(artifact)
    return hydrated


_META_OBJECT_DISPLAY_KEYS = (
    "name",
    "title",
    "label",
    "display_name",
    "displayName",
    "team_name",
    "teamName",
)


def _get_object_display_values(value: dict) -> list[str]:
    results: list[str] = []
    for key in _META_OBJECT_DISPLAY_KEYS:
        candidate = value.get(key)
        if isinstance(candidate, str) and candidate.strip():
            results.append(candidate.strip())
            break
    raw_value = value.get("value")
    if isinstance(raw_value, str) and raw_value.strip():
        results.append(raw_value.strip())
    return results


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
    if isinstance(value, dict):
        results = _get_object_display_values(value)
        serialized = json.dumps(value)
        if serialized:
            results.append(serialized)
        # Preserve order while removing duplicates
        return list(dict.fromkeys(results))
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


def _build_query_haystack(artifact: dict, metadata: dict | None = None) -> str:
    meta = resolve_artifact_metadata(artifact, metadata)
    docs = meta.get("docs")
    docs_text = ""
    if isinstance(docs, list):
        docs_text = " ".join([entry for entry in docs if isinstance(entry, str)])

    items_count = meta.get("itemsCount")
    if items_count is None:
        items_count = meta.get("items_count")

    values = [
        _stringify_value(artifact.get("title")),
        _stringify_value(artifact.get("description")),
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
    metadata: dict | None = None,
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
        meta = resolve_artifact_metadata(artifact, metadata)
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
        meta = resolve_artifact_metadata(artifact, metadata)
        return _get_primary_tag(meta) == normalized_section

    def matches_query(artifact: dict) -> bool:
        if not normalized_query:
            return True
        return normalized_query in _build_query_haystack(artifact, metadata)

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


def _thumbnail_within_limit(path: Path, max_bytes: int) -> bool:
    try:
        return path.stat().st_size <= max_bytes
    except OSError:
        return False


def _thumbnail_scale_filter(max_dim: int) -> str:
    return (
        "scale="
        f"'min({max_dim},iw)':'min({max_dim},ih)':"
        "force_original_aspect_ratio=decrease"
    )


def generate_thumbnail(
    source: str | Path,
    thumbnail_path: Path,
    *,
    max_bytes: int | None = None,
    seek: str | None = "00:00:00.000",
) -> bool:
    if shutil.which("ffmpeg") is None:
        logger.error("ffmpeg is not installed. Skipping thumbnail generation for %s.", source)
        return False

    effective_max = max_bytes if isinstance(max_bytes, int) and max_bytes > 0 else THUMBNAIL_MAX_BYTES
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)

    for max_dim, quality in THUMBNAIL_PRESETS:
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
        if seek:
            cmd.extend(["-ss", seek])
        cmd.extend(
            [
                "-i",
                str(source),
                "-vf",
                _thumbnail_scale_filter(max_dim),
                "-frames:v",
                "1",
                "-vcodec",
                "libwebp",
                "-lossless",
                "0",
                "-compression_level",
                "4",
                "-q:v",
                str(quality),
                str(thumbnail_path),
            ]
        )
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout or "").strip()
            if detail:
                detail = detail.replace("\n", " ")
                if len(detail) > 500:
                    detail = f"{detail[:500]}..."
                logger.error("ffmpeg thumbnail failed: %s", detail)
            else:
                logger.error("ffmpeg thumbnail failed with exit code %s", exc.returncode)
            if thumbnail_path.exists():
                try:
                    thumbnail_path.unlink()
                except OSError:
                    pass
            return False

        if _thumbnail_within_limit(thumbnail_path, effective_max):
            return True

    if thumbnail_path.exists() and not _thumbnail_within_limit(thumbnail_path, effective_max):
        try:
            thumbnail_path.unlink()
        except OSError:
            pass
    return False

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
    manifest = {
        "manifestVersion": MANIFEST_VERSION,
        "id": package_id,
        "type": "package",
        "projectId": project_id,
        "name": name,
        "title": title,
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "artifacts": list(artifacts) if artifacts else [],
        "metadata": {},
    }
    if artifacts:
        normalize_manifest_metadata(manifest)
    return manifest


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
    return normalize_manifest_metadata(data)


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

    try:
        with tempfile.NamedTemporaryFile(dir=output_dir.parent, suffix=".mp4", delete=False) as handle:
            tmp_input_path = Path(handle.name)
            for chunk in file_obj.chunks():
                handle.write(chunk)

        playlist_name = "index.m3u8"
        master_lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
        for rendition in HLS_RENDITIONS:
            name = str(rendition["name"])
            width = int(rendition["width"])
            height = int(rendition["height"])
            video_bitrate = str(rendition["video_bitrate"])
            maxrate = str(rendition["maxrate"])
            bufsize = str(rendition["bufsize"])
            audio_bitrate = str(rendition["audio_bitrate"])
            bandwidth = int(rendition["bandwidth"])
            variant_playlist_name = f"{name}.m3u8"
            segment_pattern = f"{name}_segment_%05d.ts"
            scaling_filter = (
                f"scale=w={width}:h={height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
            )
            cmd = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(tmp_input_path),
                "-map",
                "0:v:0",
                "-map",
                "0:a?",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-vf",
                scaling_filter,
                "-b:v",
                video_bitrate,
                "-maxrate",
                maxrate,
                "-bufsize",
                bufsize,
                "-c:a",
                "aac",
                "-ar",
                "48000",
                "-ac",
                "2",
                "-b:a",
                audio_bitrate,
                "-hls_time",
                str(segment_seconds),
                "-hls_list_size",
                "0",
                "-hls_flags",
                "independent_segments",
                "-hls_segment_filename",
                segment_pattern,
                "-f",
                "hls",
                variant_playlist_name,
            ]
            _run_ffmpeg(cmd)
            master_lines.append(
                f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{height}"
            )
            master_lines.append(variant_playlist_name)
        (output_dir / playlist_name).write_text("\n".join(master_lines) + "\n", encoding="utf-8")

        created_thumbnail = None
        if thumbnail_path:
            if generate_thumbnail(tmp_input_path, thumbnail_path):
                created_thumbnail = thumbnail_path
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


def transcode_video_to_mp4(input_path: str | Path, output_path: Path) -> Path:
    if shutil.which("ffmpeg") is None:
        raise MediaLibraryTranscodeError("ffmpeg is not installed.")

    source_value = str(input_path)
    if isinstance(input_path, Path):
        if not input_path.exists():
            raise MediaLibraryTranscodeError("Source video not found.")
    elif not source_value.startswith(("http://", "https://")):
        candidate = Path(source_value)
        if not candidate.exists():
            raise MediaLibraryTranscodeError("Source video not found.")
        source_value = str(candidate)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_output = tempfile.mkstemp(dir=output_path.parent, suffix=".tmp.mp4")
    os.close(fd)
    tmp_output_path = Path(tmp_output)

    def _render_ffmpeg_error(exc: subprocess.CalledProcessError) -> str:
        detail = (exc.stderr or exc.stdout or "").strip()
        if detail:
            detail = detail.replace("\n", " ")
            if len(detail) > 500:
                detail = f"{detail[:500]}..."
        return detail

    try:
        copy_cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            source_value,
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(tmp_output_path),
        ]
        try:
            subprocess.run(copy_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as exc:
            detail = _render_ffmpeg_error(exc)
            if detail:
                logger.info("ffmpeg stream copy failed, falling back to encode: %s", detail)
            else:
                logger.info("ffmpeg stream copy failed, falling back to encode.")
            encode_cmd = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                source_value,
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                str(tmp_output_path),
            ]
            subprocess.run(encode_cmd, check=True, capture_output=True, text=True)

        os.replace(tmp_output_path, output_path)
        return output_path
    except subprocess.CalledProcessError as exc:
        detail = _render_ffmpeg_error(exc)
        if detail:
            logger.error("ffmpeg failed: %s", detail)
            raise MediaLibraryTranscodeError(f"Video conversion failed: {detail}") from exc
        logger.error("ffmpeg failed with exit code %s", exc.returncode)
        raise MediaLibraryTranscodeError("Video conversion failed.") from exc
    finally:
        if tmp_output_path.exists():
            try:
                tmp_output_path.unlink()
            except OSError:
                pass
