# Python imports
import json
import logging
import os
import re
import shutil
import tempfile
import subprocess
from pathlib import Path

# Django imports
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework.serializers import ValidationError

MANIFEST_VERSION = 1

_SEGMENT_RE = re.compile(r"^[A-Za-z0-9_-]+$")
logger = logging.getLogger(__name__)


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
