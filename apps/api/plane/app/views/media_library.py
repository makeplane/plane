# Python imports
import json
import math
import logging
import shutil
import mimetypes
import os
from urllib.parse import urlparse
from pathlib import Path
from uuid import UUID, uuid4

# Third party imports
from django.http import FileResponse, HttpResponse, StreamingHttpResponse
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from django.conf import settings

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers.media_library import MediaArtifactSerializer, MediaLibraryPackageCreateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import FileAsset
from plane.settings.storage import S3Storage
from plane.utils.exception_logger import log_exception
from plane.utils.media_library import (
    _now_iso,
    create_manifest,
    ensure_project_library,
    filter_media_library_artifacts,
    generate_thumbnail,
    get_document_icon_source,
    hydrate_artifacts_with_meta,
    manifest_path,
    media_library_root,
    manifest_write_lock,
    normalize_manifest_metadata,
    normalize_metadata_ref,
    update_manifest_artifact_fields,
    update_manifest_event_meta,
    MediaLibraryTranscodeError,
    package_root,
    read_manifest,
    transcode_video_to_mp4,
    transcode_mp4_to_hls,
    validate_segment,
    write_manifest_atomic,
)
from plane.utils.paginator import BadPaginationError, Cursor, CursorResult

_IMAGE_FORMATS = {
    "jpg",
    "jpeg",
    "png",
    "svg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
    "avif",
    "heic",
    "heif",
    "thumbnail",
}
_VIDEO_FORMATS = {"mp4", "m3u8", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "m4v"}
_MP4_FASTSTART_FORMATS = {".mp4", ".m4v"}
logger = logging.getLogger(__name__)


def _default_artifact_description(title: str) -> str:
    title_value = (title or "Uploaded file").strip() or "Uploaded file"
    return (
        "<p>This asset was uploaded to the media library and is ready for use.<br />"
        "It can be previewed, downloaded, or used in projects as needed.<br />"
        f"File name: {title_value}</p>"
    )


class ListPaginator:
    def __init__(self, items):
        self.items = items

    def get_result(self, limit=1000, cursor=None):
        if cursor is None:
            cursor = Cursor(limit, 0, 0)

        if limit <= 0:
            raise BadPaginationError("Pagination limit must be positive")

        total_count = len(self.items)
        page = cursor.offset
        if page < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

        offset = page * limit
        stop = offset + limit + 1
        page_items = self.items[offset:stop]
        has_next = len(page_items) > limit

        results = page_items[:limit]
        next_cursor = Cursor(limit, page + 1, False, has_next)
        prev_cursor = Cursor(limit, page - 1, True, page > 0)
        max_hits = math.ceil(total_count / limit) if limit else 0

        return CursorResult(
            results=results,
            next=next_cursor,
            prev=prev_cursor,
            hits=total_count,
            max_hits=max_hits,
        )


def _create_video_thumbnail(source_path: Path, thumbnail_path: Path) -> bool:
    return generate_thumbnail(source_path, thumbnail_path, seek="00:00:00.000")


def _create_video_thumbnail_from_source(source: str, thumbnail_path: Path) -> bool:
    if not source:
        return False
    return generate_thumbnail(source, thumbnail_path, seek="00:00:00.000")


def _extract_asset_id_from_url(value: str) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = urlparse(value)
        path = parsed.path or ""
    except ValueError:
        path = value
    if not path or ("/api/assets/" not in path and "/assets/v2/" not in path):
        return None
    segments = [segment for segment in path.split("/") if segment]
    if not segments:
        return None
    candidate = segments[-1]
    try:
        return str(UUID(candidate))
    except ValueError:
        return None


def _resolve_external_video_sources(path: str, request, project_id: str) -> list[str]:
    if not isinstance(path, str) or not path:
        return []
    source = path
    if source.startswith("/"):
        try:
            source = request.build_absolute_uri(source)
        except Exception:
            source = path
    candidates: list[str] = []
    asset_id = _extract_asset_id_from_url(source)
    if asset_id:
        asset = FileAsset.objects.filter(id=asset_id, project_id=project_id, is_deleted=False).first()
        if asset and asset.is_uploaded:
            if request is not None:
                storage = S3Storage(request=request)
                candidates.append(
                    storage.generate_presigned_url(
                        object_name=asset.asset.name,
                        disposition="inline",
                        filename=asset.attributes.get("name"),
                    )
                )
            storage_internal = S3Storage()
            candidates.append(
                storage_internal.generate_presigned_url(
                    object_name=asset.asset.name,
                    disposition="inline",
                    filename=asset.attributes.get("name"),
                )
            )
    if source.startswith(("http://", "https://")):
        candidates.append(source)
    deduped: list[str] = []
    for candidate in candidates:
        if candidate and candidate not in deduped:
            deduped.append(candidate)
    return deduped


def _pick_transcode_source(sources: list[str]) -> str | None:
    if not sources:
        return None
    internal_endpoint = os.environ.get("AWS_S3_INTERNAL_ENDPOINT_URL") or os.environ.get("MINIO_INTERNAL_ENDPOINT_URL")
    if internal_endpoint:
        try:
            internal_host = urlparse(internal_endpoint).netloc
        except ValueError:
            internal_host = ""
        if internal_host:
            for source in sources:
                try:
                    if urlparse(source).netloc == internal_host:
                        return source
                except ValueError:
                    continue
    return sources[0]


def _resolve_artifact_disk_path(artifact: dict, base_root: Path) -> Path | None:
    raw_path = artifact.get("path") or ""
    if not raw_path:
        return None
    if isinstance(raw_path, str) and raw_path.lower().startswith(("http://", "https://")):
        return None
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = (base_root / candidate).resolve(strict=False)
    else:
        candidate = candidate.resolve(strict=False)
    if os.path.commonpath([str(base_root), str(candidate)]) != str(base_root):
        return None
    return candidate


def _delete_artifact_disk_path(path: Path, artifact_name: str | None = None) -> None:
    if not path.exists():
        return
    if path.is_dir():
        shutil.rmtree(path, ignore_errors=True)
        return
    if artifact_name:
        try:
            parent = path.parent
            if parent.name == artifact_name and parent.parent.name == "artifacts":
                shutil.rmtree(parent, ignore_errors=True)
                return
        except OSError:
            return
    try:
        path.unlink()
    except FileNotFoundError:
        return
    except OSError:
        return


def _should_download_as_attachment(request) -> bool:
    value = request.query_params.get("download")
    if value is None:
        return False
    if isinstance(value, str) and value.strip().lower() in {"0", "false", "no"}:
        return False
    return True


def _should_stream_in_chunks(request) -> bool:
    value = request.query_params.get("stream")
    if value is None:
        return False
    if isinstance(value, str) and value.strip().lower() in {"0", "false", "no"}:
        return False
    return True


def _parse_http_range(value: str, file_size: int) -> tuple[int, int] | None:
    if not value:
        return None
    raw = value.strip().lower()
    if not raw.startswith("bytes="):
        return None
    raw = raw[len("bytes=") :]
    if "," in raw:
        raw = raw.split(",", 1)[0]
    raw = raw.strip()
    if "-" not in raw:
        return None
    start_str, end_str = raw.split("-", 1)
    if not start_str and not end_str:
        return None
    if not start_str:
        try:
            length = int(end_str)
        except (TypeError, ValueError):
            return None
        if length <= 0:
            return None
        if length > file_size:
            length = file_size
        start = max(file_size - length, 0)
        end = file_size - 1
        return (start, end)
    try:
        start = int(start_str)
    except (TypeError, ValueError):
        return None
    if start < 0:
        return None
    if end_str:
        try:
            end = int(end_str)
        except (TypeError, ValueError):
            return None
    else:
        end = file_size - 1
    if start >= file_size:
        return None
    if end < start:
        return None
    if end >= file_size:
        end = file_size - 1
    return (start, end)


def _iter_file_range(path: Path, start: int, end: int, chunk_size: int = 8192):
    with open(path, "rb") as handle:
        handle.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = handle.read(min(chunk_size, remaining))
            if not chunk:
                break
            yield chunk
            remaining -= len(chunk)


def _is_mp4_faststart(path: Path) -> bool:
    """
    Check top-level atom order. Faststart MP4 has `moov` before the first `mdat`.
    """
    if path.suffix.lower() not in _MP4_FASTSTART_FORMATS or not path.exists() or not path.is_file():
        return False

    file_size = path.stat().st_size
    offset = 0
    moov_offset = None
    mdat_offset = None

    with open(path, "rb") as handle:
        while offset + 8 <= file_size:
            handle.seek(offset)
            header = handle.read(8)
            if len(header) < 8:
                break

            atom_size = int.from_bytes(header[:4], byteorder="big", signed=False)
            atom_type = header[4:8]
            header_size = 8

            if atom_size == 1:
                ext_size = handle.read(8)
                if len(ext_size) < 8:
                    break
                atom_size = int.from_bytes(ext_size, byteorder="big", signed=False)
                header_size = 16
            elif atom_size == 0:
                atom_size = file_size - offset

            if atom_size < header_size:
                break

            if atom_type == b"moov" and moov_offset is None:
                moov_offset = offset
            elif atom_type == b"mdat" and mdat_offset is None:
                mdat_offset = offset

            if moov_offset is not None and mdat_offset is not None:
                return moov_offset < mdat_offset
            if mdat_offset is not None and moov_offset is None:
                return False

            offset += atom_size

    if moov_offset is None:
        return False
    if mdat_offset is None:
        return True
    return moov_offset < mdat_offset


def _ensure_mp4_faststart(path: Path, artifact_name: str | None = None, force: bool = False) -> None:
    if path.suffix.lower() not in _MP4_FASTSTART_FORMATS or not path.exists() or not path.is_file():
        return

    label = artifact_name or path.name
    if not force:
        try:
            if _is_mp4_faststart(path):
                return
        except OSError as exc:
            logger.warning("Failed to inspect MP4 atom order for %s: %s", label, exc)
            return

    if shutil.which("ffmpeg") is None:
        logger.warning("ffmpeg is not installed. Skipping MP4 faststart for %s.", label)
        return

    try:
        transcode_video_to_mp4(path, path)
    except MediaLibraryTranscodeError as exc:
        logger.warning("Failed to optimize MP4 for streaming (%s): %s", label, exc)


mimetypes.add_type("application/vnd.apple.mpegurl", ".m3u8")
mimetypes.add_type("application/x-mpegURL", ".m3u8")
mimetypes.add_type("video/mp2t", ".ts")


class MediaPackageCreateAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        serializer = MediaLibraryPackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id_str = str(project_id)
        package_id = serializer.validated_data.get("id") or uuid4().hex

        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        root = package_root(project_id_str, package_id)
        manifest_file = manifest_path(project_id_str, package_id)

        if root.exists() or manifest_file.exists():
            return Response({"error": "Package already exists."}, status=status.HTTP_409_CONFLICT)

        (root / "artifacts").mkdir(parents=True, exist_ok=False)
        (root / "attachment").mkdir(parents=True, exist_ok=False)

        manifest = create_manifest(
            project_id=project_id_str,
            package_id=package_id,
            name=serializer.validated_data["name"],
            title=serializer.validated_data["title"],
            artifacts=serializer.validated_data.get("artifacts"),
        )
        write_manifest_atomic(manifest_file, manifest)

        return Response(manifest, status=status.HTTP_201_CREATED)


class MediaLibraryInitAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def post(self, request, slug, project_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        packages_root = ensure_project_library(project_id_str)

        package_dirs = [path for path in packages_root.iterdir() if path.is_dir()]
        if package_dirs:
            for package_dir in sorted(package_dirs, key=lambda path: path.name):
                manifest_file = package_dir / "manifest.json"
                if manifest_file.exists():
                    try:
                        manifest = read_manifest(manifest_file)
                    except Exception as exc:
                        log_exception(exc)
                        manifest = create_manifest(
                            project_id=project_id_str,
                            package_id=package_dir.name,
                            name=package_dir.name,
                            title="Media Library Package",
                        )
                        write_manifest_atomic(manifest_file, manifest)
                    return Response(manifest, status=status.HTTP_200_OK)
                manifest = create_manifest(
                    project_id=project_id_str,
                    package_id=package_dir.name,
                    name=package_dir.name,
                    title="Media Library Package",
                )
                write_manifest_atomic(manifest_file, manifest)
                return Response(manifest, status=status.HTTP_201_CREATED)
            return Response(status=status.HTTP_204_NO_CONTENT)

        package_id = f"package-{uuid4().hex[:8]}"
        root = package_root(project_id_str, package_id)
        (root / "artifacts").mkdir(parents=True, exist_ok=False)
        (root / "attachment").mkdir(parents=True, exist_ok=False)
        manifest = create_manifest(
            project_id=project_id_str,
            package_id=package_id,
            name=package_id,
            title="Media Library Package",
        )
        write_manifest_atomic(manifest_path(project_id_str, package_id), manifest)
        return Response(manifest, status=status.HTTP_201_CREATED)


class MediaManifestDetailAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        return Response(manifest, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def patch(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        payload = request.data or {}
        work_item_id = payload.get("work_item_id") or payload.get("workItemId") or ""
        artifact_id = payload.get("artifact_id") or payload.get("artifactId") or ""
        meta = payload.get("meta") if "meta" in payload else None
        artifact_fields = payload.get("artifact") if "artifact" in payload else payload.get("artifact_fields")
        if meta is None and artifact_fields is None:
            return Response({"error": "meta or artifact fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        if meta is not None and not work_item_id:
            return Response({"error": "work_item_id is required for meta updates."}, status=status.HTTP_400_BAD_REQUEST)
        if meta is not None and not isinstance(meta, dict):
            return Response({"error": "meta must be an object."}, status=status.HTTP_400_BAD_REQUEST)
        if artifact_fields is not None and not artifact_id:
            return Response({"error": "artifact_id is required for artifact updates."}, status=status.HTTP_400_BAD_REQUEST)
        if artifact_fields is not None and not isinstance(artifact_fields, dict):
            return Response({"error": "artifact fields must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        with manifest_write_lock(manifest_file):
            manifest = read_manifest(manifest_file)
            updated_count = 0
            if meta is not None:
                updated_count += update_manifest_event_meta(manifest, work_item_id, meta)
            if artifact_fields is not None:
                updated_count += update_manifest_artifact_fields(manifest, artifact_fields, artifact_id=artifact_id)
            if updated_count <= 0:
                return Response({"updated": 0}, status=status.HTTP_200_OK)
            manifest["updatedAt"] = _now_iso()
            normalize_manifest_metadata(manifest)
            write_manifest_atomic(manifest_file, manifest)

        return Response({"updated": updated_count}, status=status.HTTP_200_OK)


class MediaArtifactFileAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, package_id, artifact_id, artifact_path=None):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")
        validate_segment(artifact_id, "artifactId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        artifacts = manifest.get("artifacts") or []
        artifact = next(
            (entry for entry in artifacts if entry.get("name") == artifact_id),
            None,
        )
        if not artifact:
            raise NotFound("Artifact not found.")

        base_root = media_library_root().resolve(strict=False)
        file_path = None
        raw_path = artifact.get("path") or ""
        external_url = None
        if isinstance(raw_path, str) and raw_path.startswith(("http://", "https://")):
            external_url = raw_path
        elif raw_path:
            candidate = Path(raw_path)
            if not candidate.is_absolute():
                candidate = (base_root / candidate).resolve(strict=False)
            else:
                candidate = candidate.resolve(strict=False)
            if os.path.commonpath([str(base_root), str(candidate)]) == str(base_root) and candidate.exists():
                file_path = candidate

        if artifact_path:
            if not file_path:
                artifacts_root = package_root(project_id_str, package_id) / "artifacts"
                candidate_dir = artifacts_root / artifact_id
                if candidate_dir.exists():
                    file_path = candidate_dir.resolve(strict=False)
                else:
                    raise NotFound("Artifact file not found.")
            base_dir = file_path if file_path.is_dir() else file_path.parent
            relative_path = Path(artifact_path)
            if relative_path.is_absolute() or ".." in relative_path.parts:
                raise NotFound("Artifact file not found.")
            resolved_path = (base_dir / relative_path).resolve(strict=False)
            base_dir_resolved = base_dir.resolve(strict=False)
            if os.path.commonpath([str(base_dir_resolved), str(resolved_path)]) != str(base_dir_resolved):
                raise NotFound("Artifact file not found.")
            file_path = resolved_path
        elif not file_path:
            artifacts_root = package_root(project_id_str, package_id) / "artifacts"
            if artifacts_root.exists():
                matches = list(artifacts_root.glob(f"{artifact_id}.*"))
                if matches:
                    file_path = matches[0].resolve(strict=False)

        download_requested = _should_download_as_attachment(request)
        stream_requested = _should_stream_in_chunks(request) and not download_requested
        format_value = str(artifact.get("format") or "").lower()
        action_value = str(artifact.get("action") or "").lower()
        is_video = (
            format_value in _VIDEO_FORMATS
            or format_value == "stream"
            or action_value in {"play_streaming", "play_hls", "play", "open_mp4"}
        )
        if not file_path or not file_path.exists():
            if external_url and download_requested and artifact_path is None and is_video:
                mp4_path = package_root(project_id_str, package_id) / "artifacts" / f"{artifact_id}.mp4"
                if not mp4_path.exists():
                    try:
                        source_url = external_url
                        resolved_sources = _resolve_external_video_sources(external_url, request, project_id_str)
                        picked_source = _pick_transcode_source(resolved_sources)
                        if picked_source:
                            source_url = picked_source
                        transcode_video_to_mp4(source_url, mp4_path)
                    except MediaLibraryTranscodeError as exc:
                        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                file_path = mp4_path
            else:
                raise NotFound("Artifact file not found.")

        if download_requested and artifact_path is None and is_video:
            mp4_path = file_path
            if file_path.suffix.lower() != ".mp4":
                mp4_path = file_path.with_suffix(".mp4")
            if not mp4_path.exists():
                try:
                    transcode_video_to_mp4(file_path, mp4_path)
                except MediaLibraryTranscodeError as exc:
                    return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            file_path = mp4_path

        if is_video and artifact_path is None:
            _ensure_mp4_faststart(file_path, artifact.get("name"))

        content_type, _ = mimetypes.guess_type(str(file_path))
        content_type = content_type or "application/octet-stream"
        range_header = request.headers.get("range") or request.META.get("HTTP_RANGE")
        if range_header and file_path.is_file():
            file_size = file_path.stat().st_size
            parsed = _parse_http_range(range_header, file_size)
            if not parsed:
                response = HttpResponse(status=416)
                response["Content-Range"] = f"bytes */{file_size}"
                response["Accept-Ranges"] = "bytes"
                return response
            start, end = parsed
            if stream_requested and is_video:
                max_bytes = getattr(settings, "MEDIA_LIBRARY_STREAM_CHUNK_BYTES", 0) or 0
                if max_bytes > 0 and end - start + 1 > max_bytes:
                    end = min(file_size - 1, start + max_bytes - 1)
            response = StreamingHttpResponse(
                _iter_file_range(file_path, start, end),
                status=206,
                content_type=content_type,
            )
            response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            response["Content-Length"] = str(end - start + 1)
            response["Accept-Ranges"] = "bytes"
        else:
            response = FileResponse(open(file_path, "rb"), content_type=content_type)
            response["Accept-Ranges"] = "bytes"
        if download_requested and artifact_path is None:
            download_name = artifact.get("name") or "media"
            suffix = ".mp4" if is_video else (Path(file_path).suffix or "")
            response["Content-Disposition"] = f'attachment; filename="{download_name}{suffix}"'
        return response


class MediaArtifactDetailAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, package_id, artifact_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")
        validate_segment(artifact_id, "artifactId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        artifacts = manifest.get("artifacts") or []
        if not artifacts:
            raise NotFound("Artifact not found.")

        target = None
        related = []
        for artifact in artifacts:
            name = artifact.get("name")
            if name == artifact_id:
                target = artifact
            link = artifact.get("link")
            if link == artifact_id:
                format_value = (artifact.get("format") or "").lower()
                action_value = (artifact.get("action") or "").lower()
                if format_value == "thumbnail" or action_value == "preview":
                    related.append(artifact)

        if not target:
            raise NotFound("Artifact not found.")

        metadata = manifest.get("metadata") if isinstance(manifest, dict) else {}
        payload = hydrate_artifacts_with_meta([target, *related], metadata)
        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def delete(self, request, slug, project_id, package_id, artifact_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")
        validate_segment(artifact_id, "artifactId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        removed_artifacts: list[dict] = []
        with manifest_write_lock(manifest_file):
            manifest = read_manifest(manifest_file)
            artifacts = manifest.get("artifacts") or []
            if not artifacts:
                raise NotFound("Artifact not found.")

            related_names = {artifact_id}
            for artifact in artifacts:
                if artifact.get("link") == artifact_id and artifact.get("format") == "thumbnail":
                    name = artifact.get("name")
                    if name:
                        related_names.add(name)

            remaining_artifacts = []
            for artifact in artifacts:
                if artifact.get("name") in related_names:
                    removed_artifacts.append(artifact)
                else:
                    remaining_artifacts.append(artifact)

            if not removed_artifacts:
                raise NotFound("Artifact not found.")

            manifest["artifacts"] = remaining_artifacts
            manifest["updatedAt"] = _now_iso()

            metadata = manifest.get("metadata")
            if not isinstance(metadata, dict):
                metadata = {}
            used_refs: set[str] = set()
            for artifact in remaining_artifacts:
                metadata_ref = normalize_metadata_ref(artifact.get("metadata_ref")) or normalize_metadata_ref(
                    artifact.get("name")
                )
                if metadata_ref:
                    used_refs.add(metadata_ref)
            manifest["metadata"] = {key: value for key, value in metadata.items() if key in used_refs}
            normalize_manifest_metadata(manifest)
            write_manifest_atomic(manifest_file, manifest)

        base_root = media_library_root().resolve(strict=False)
        for artifact in removed_artifacts:
            resolved_path = _resolve_artifact_disk_path(artifact, base_root)
            if resolved_path:
                _delete_artifact_disk_path(resolved_path, artifact.get("name"))

        return Response(status=status.HTTP_204_NO_CONTENT)


class MediaArtifactsListAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, package_id):
        try:
            project_id_str = str(project_id)
            validate_segment(project_id_str, "projectId")
            validate_segment(package_id, "packageId")

            manifest_file = manifest_path(project_id_str, package_id)
            if not manifest_file.exists():
                raise NotFound("Manifest not found.")

            manifest = read_manifest(manifest_file)
            artifacts = manifest.get("artifacts", [])
            metadata = manifest.get("metadata") if isinstance(manifest, dict) else {}
            query = request.query_params.get("q") or ""
            section = request.query_params.get("section") or ""
            format_values = request.query_params.getlist("formats")
            if not format_values:
                format_param = request.query_params.get("formats") or ""
                format_values = [entry.strip() for entry in format_param.split(",") if entry.strip()]
            filters_raw = request.query_params.get("filters")
            filters = None
            if filters_raw:
                try:
                    filters = json.loads(filters_raw)
                except json.JSONDecodeError:
                    return Response(
                        {"error": "Filters must be valid JSON."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            try:
                artifacts = filter_media_library_artifacts(
                    artifacts,
                    query=query,
                    filters=filters,
                    section=section,
                    formats=format_values,
                    metadata=metadata,
                )
            except Exception as exc:
                log_exception(exc)
            if "cursor" in request.query_params or "per_page" in request.query_params:
                hydrated = hydrate_artifacts_with_meta(artifacts, metadata)
                return self.paginate(request=request, paginator=ListPaginator(hydrated))
            return Response(hydrate_artifacts_with_meta(artifacts, metadata), status=status.HTTP_200_OK)
        except Exception as exc:
            log_exception(exc)
            message = str(exc) if settings.DEBUG else "Something went wrong please try again later"
            return Response({"error": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        payload = request.data
        file_obj = request.FILES.get("file")
        is_bulk = isinstance(payload, list) or (isinstance(payload, dict) and "artifacts" in payload)
        artifacts_payload = []
        file_path = None
        artifact_dir = None
        should_transcode = False
        thumbnail_name = None
        thumbnail_path = None
        thumbnail_relative_path = None
        doc_thumbnail_name = None
        doc_thumbnail_file_name = None
        doc_thumbnail_path = None
        doc_thumbnail_relative_path = None
        doc_thumbnail_source = None
        doc_thumbnail_action = None
        image_thumbnail_name = None
        image_thumbnail_file_name = None
        image_thumbnail_path = None
        image_thumbnail_relative_path = None
        image_thumbnail_action = None
        video_thumbnail_name = None
        video_thumbnail_path = None
        video_thumbnail_relative_path = None
        video_thumbnail_action = None
        timestamp = _now_iso()

        if file_obj:
            raw_name = file_obj.name or "artifact"
            base_name = Path(raw_name).stem or "artifact"
            extension = Path(raw_name).suffix.lstrip(".").lower()
            if not extension:
                return Response(
                    {"error": "File extension is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            format_value = (request.data.get("format") or extension).lower()
            artifact_name = request.data.get("name") or base_name
            title = request.data.get("title") or base_name
            primary_artifact_name = artifact_name
            primary_title = title
            link = request.data.get("link")
            if isinstance(link, str) and link.strip().lower() in {"", "null"}:
                link = None
            work_item_id = request.data.get("work_item_id")
            if isinstance(work_item_id, str) and not work_item_id.strip():
                work_item_id = None

            meta = request.data.get("meta") or {}
            raw_metadata_ref = request.data.get("metadata_ref") or request.data.get("metadataRef")
            metadata_ref = normalize_metadata_ref(raw_metadata_ref)
            if raw_metadata_ref and not metadata_ref:
                return Response(
                    {"error": "metadata_ref must be a valid identifier."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except json.JSONDecodeError:
                    return Response(
                        {"error": "Meta must be valid JSON."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            if meta is None:
                meta = {}

            created_at = request.data.get("created_at") or timestamp
            updated_at = request.data.get("updated_at") or created_at
            primary_created_at = created_at
            primary_updated_at = updated_at
            artifacts_root = package_root(project_id_str, package_id) / "artifacts"
            attachment_root = package_root(project_id_str, package_id) / "attachment"
            is_video_upload = format_value in _VIDEO_FORMATS or extension in _VIDEO_FORMATS
            # Keep uploaded videos in their original format; do not auto-transcode to HLS on upload.
            should_transcode = False
            if should_transcode:
                if shutil.which("ffmpeg") is None:
                    return Response(
                        {"error": "ffmpeg is not installed. Install ffmpeg or upload a non-video file."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                artifact_dir = artifacts_root / primary_artifact_name
                artifact_file_name = "index.m3u8"
                file_path = artifact_dir / artifact_file_name
                relative_path = (
                    f"projects/{project_id_str}/packages/{package_id}/artifacts/{primary_artifact_name}/{artifact_file_name}"
                )
                thumbnail_name = f"{primary_artifact_name}-thumbnail"
                thumbnail_path = artifact_dir / "thumbnail.webp"
                thumbnail_relative_path = (
                    f"projects/{project_id_str}/packages/{package_id}/artifacts/{primary_artifact_name}/thumbnail.webp"
                )
                meta.setdefault("source_format", extension)
                meta.setdefault("hls", True)
            else:
                artifact_file_name = f"{artifact_name}.{extension}"
                file_path = artifacts_root / artifact_file_name
                relative_path = (
                    f"projects/{project_id_str}/packages/{package_id}/artifacts/{artifact_file_name}"
                )
                if format_value in _VIDEO_FORMATS and format_value != "m3u8":
                    video_thumbnail_name = f"{primary_artifact_name}-thumbnail"
                    video_thumbnail_file_name = f"{primary_artifact_name}-thumbnail.webp"
                    video_thumbnail_path = artifacts_root / video_thumbnail_file_name
                    video_thumbnail_relative_path = (
                        f"projects/{project_id_str}/packages/{package_id}/artifacts/{video_thumbnail_file_name}"
                    )
                    video_thumbnail_action = "preview"
                if format_value in _IMAGE_FORMATS and format_value != "thumbnail":
                    image_thumbnail_name = f"{primary_artifact_name}-thumbnail"
                    image_thumbnail_file_name = f"{primary_artifact_name}-thumbnail.webp"
                    image_thumbnail_path = artifacts_root / image_thumbnail_file_name
                    image_thumbnail_relative_path = (
                        f"projects/{project_id_str}/packages/{package_id}/artifacts/{image_thumbnail_file_name}"
                    )
                    image_thumbnail_action = "view"
                if format_value not in _VIDEO_FORMATS and format_value not in _IMAGE_FORMATS:
                    thumbnail_hint = meta.get("thumbnail") if isinstance(meta, dict) else None
                    doc_thumbnail_source = get_document_icon_source(format_value, thumbnail_hint)
                    if doc_thumbnail_source:
                        doc_thumbnail_name = f"{primary_artifact_name}-thumb"
                        doc_thumbnail_file_name = None
                        if isinstance(thumbnail_hint, str):
                            hint_name = Path(thumbnail_hint).name
                            if hint_name:
                                doc_thumbnail_file_name = f"{Path(hint_name).stem}.webp"
                        if not doc_thumbnail_file_name:
                            doc_thumbnail_file_name = f"{primary_artifact_name}-thumbnail.webp"
                        doc_thumbnail_path = attachment_root / doc_thumbnail_file_name
                        doc_thumbnail_relative_path = (
                            f"projects/{project_id_str}/packages/{package_id}/attachment/{doc_thumbnail_file_name}"
                        )

            action = request.data.get("action")
            if not action:
                if format_value in _VIDEO_FORMATS:
                    action = "play"
                elif format_value in _IMAGE_FORMATS:
                    action = "view"
                else:
                    action = "download"
            if doc_thumbnail_name:
                doc_thumbnail_action = "open_pdf" if format_value == "pdf" else action
            primary_metadata_ref = metadata_ref or artifact_name
            primary_entry = {
                "name": artifact_name,
                "title": title,
                "description": _default_artifact_description(title),
                "format": format_value,
                "path": relative_path,
                "link": link,
                "action": action,
                "metadata_ref": primary_metadata_ref,
                "meta": meta,
                "created_at": created_at,
                "updated_at": updated_at,
            }
            if work_item_id is not None:
                primary_entry["work_item_id"] = work_item_id
            artifacts_payload = [primary_entry]
            is_bulk = False
        elif isinstance(payload, list):
            artifacts_payload = payload
        elif isinstance(payload, dict) and "artifacts" in payload:
            artifacts_payload = payload.get("artifacts") or []
        elif isinstance(payload, dict):
            artifacts_payload = [payload]

        if not artifacts_payload:
            return Response({"error": "Artifacts payload required."}, status=status.HTTP_400_BAD_REQUEST)

        prepared_payload = []
        for artifact in artifacts_payload:
            if not isinstance(artifact, dict):
                return Response({"error": "Each artifact must be an object."}, status=status.HTTP_400_BAD_REQUEST)
            entry = artifact.copy()
            if "metadata_ref" not in entry and "metadataRef" in entry:
                entry["metadata_ref"] = entry.pop("metadataRef")
            if entry.get("format") == "thumbnail":
                entry.pop("description", None)
            elif not entry.get("description"):
                title_value = entry.get("title") or "Uploaded file"
                entry["description"] = _default_artifact_description(title_value)
            if not entry.get("created_at"):
                entry["created_at"] = timestamp
            if not entry.get("updated_at"):
                entry["updated_at"] = entry["created_at"]
            if not entry.get("metadata_ref") and entry.get("format") == "thumbnail":
                link_ref = normalize_metadata_ref(entry.get("link"))
                if link_ref:
                    entry["metadata_ref"] = link_ref
            prepared_payload.append(entry)

        serializer = MediaArtifactSerializer(data=prepared_payload, many=True)
        serializer.is_valid(raise_exception=True)
        validated_artifacts = serializer.validated_data
        for artifact in validated_artifacts:
            if not artifact.get("metadata_ref"):
                artifact["metadata_ref"] = artifact.get("name")

        manifest = read_manifest(manifest_file)
        existing_artifacts = manifest.get("artifacts") or []
        existing_names = {artifact.get("name") for artifact in existing_artifacts if artifact.get("name")}
        incoming_names = set()
        for artifact in validated_artifacts:
            artifact_name = artifact.get("name")
            validate_segment(artifact_name, "artifactId")
            if artifact_name in existing_names:
                return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
            if artifact_name in incoming_names:
                return Response(
                    {"error": "Duplicate artifact name in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            incoming_names.add(artifact_name)

        if thumbnail_name:
            validate_segment(thumbnail_name, "artifactId")
            if thumbnail_name in existing_names:
                return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
            if thumbnail_name in incoming_names:
                return Response(
                    {"error": "Duplicate artifact name in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            incoming_names.add(thumbnail_name)
        if doc_thumbnail_name:
            validate_segment(doc_thumbnail_name, "artifactId")
            if doc_thumbnail_name in existing_names:
                return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
            if doc_thumbnail_name in incoming_names:
                return Response(
                    {"error": "Duplicate artifact name in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            incoming_names.add(doc_thumbnail_name)
        if image_thumbnail_name:
            validate_segment(image_thumbnail_name, "artifactId")
            if image_thumbnail_name in existing_names:
                return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
            if image_thumbnail_name in incoming_names:
                return Response(
                    {"error": "Duplicate artifact name in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            incoming_names.add(image_thumbnail_name)
        if video_thumbnail_name:
            validate_segment(video_thumbnail_name, "artifactId")
            if video_thumbnail_name in existing_names:
                return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
            if video_thumbnail_name in incoming_names:
                return Response(
                    {"error": "Duplicate artifact name in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            incoming_names.add(video_thumbnail_name)

        if file_obj and file_path:
            if should_transcode:
                if not artifact_dir:
                    return Response({"error": "Artifact directory missing."}, status=status.HTTP_400_BAD_REQUEST)
                if artifact_dir.exists():
                    return Response({"error": "Artifact file already exists."}, status=status.HTTP_409_CONFLICT)
                try:
                    _, created_thumbnail = transcode_mp4_to_hls(
                        file_obj,
                        artifact_dir,
                        thumbnail_path=thumbnail_path,
                    )
                except FileExistsError:
                    return Response({"error": "Artifact file already exists."}, status=status.HTTP_409_CONFLICT)
                except MediaLibraryTranscodeError as exc:
                    return Response(
                        {"error": str(exc)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                if created_thumbnail and thumbnail_relative_path and thumbnail_name:
                    thumbnail_entry = {
                        "name": thumbnail_name,
                        "title": f"{primary_title}",
                        "format": "thumbnail",
                        "path": thumbnail_relative_path,
                        "link": primary_artifact_name,
                        "action": "preview",
                        "metadata_ref": primary_metadata_ref,
                        "created_at": primary_created_at,
                        "updated_at": primary_updated_at,
                    }
                    if work_item_id is not None:
                        thumbnail_entry["work_item_id"] = work_item_id
                    thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                    thumbnail_serializer.is_valid(raise_exception=True)
                    validated_artifacts.append(thumbnail_serializer.validated_data)
            else:
                if file_path.exists():
                    return Response({"error": "Artifact file already exists."}, status=status.HTTP_409_CONFLICT)
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, "wb") as handle:
                    for chunk in file_obj.chunks():
                        handle.write(chunk)
                # Always rewrite uploaded MP4/M4V with +faststart so playback starts quickly.
                _ensure_mp4_faststart(file_path, primary_artifact_name, force=True)
                if video_thumbnail_name and video_thumbnail_path and video_thumbnail_relative_path:
                    if shutil.which("ffmpeg") is None:
                        logger.error("ffmpeg is not installed. Skipping video thumbnail for %s.", primary_artifact_name)
                    else:
                        created_thumbnail = _create_video_thumbnail(file_path, video_thumbnail_path)
                        if created_thumbnail:
                            thumbnail_entry = {
                                "name": video_thumbnail_name,
                                "title": f"{primary_title}",
                                "format": "thumbnail",
                                "path": video_thumbnail_relative_path,
                                "link": primary_artifact_name,
                                "action": video_thumbnail_action or "preview",
                                "metadata_ref": primary_metadata_ref,
                                "created_at": primary_created_at,
                                "updated_at": primary_updated_at,
                            }
                            if work_item_id is not None:
                                thumbnail_entry["work_item_id"] = work_item_id
                            thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                            thumbnail_serializer.is_valid(raise_exception=True)
                            validated_artifacts.append(thumbnail_serializer.validated_data)
                if image_thumbnail_name and image_thumbnail_relative_path:
                    max_bytes = getattr(settings, "MEDIA_LIBRARY_THUMBNAIL_MAX_BYTES", 51200)
                    thumbnail_relative_path = image_thumbnail_relative_path
                    use_existing = False
                    try:
                        if file_path.suffix.lower() == ".webp" and file_path.stat().st_size <= max_bytes:
                            thumbnail_relative_path = relative_path
                            use_existing = True
                    except OSError:
                        pass
                    if not use_existing:
                        if not (image_thumbnail_path and generate_thumbnail(file_path, image_thumbnail_path, seek=None)):
                            thumbnail_relative_path = None
                    if thumbnail_relative_path:
                        thumbnail_entry = {
                            "name": image_thumbnail_name,
                            "title": f"{primary_title}",
                            "format": "thumbnail",
                            "path": thumbnail_relative_path,
                            "link": primary_artifact_name,
                            "action": image_thumbnail_action or "view",
                            "metadata_ref": primary_metadata_ref,
                            "created_at": primary_created_at,
                            "updated_at": primary_updated_at,
                        }
                        if work_item_id is not None:
                            thumbnail_entry["work_item_id"] = work_item_id
                        thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                        thumbnail_serializer.is_valid(raise_exception=True)
                        validated_artifacts.append(thumbnail_serializer.validated_data)
                if doc_thumbnail_name and doc_thumbnail_relative_path and doc_thumbnail_source and doc_thumbnail_path:
                    if generate_thumbnail(doc_thumbnail_source, doc_thumbnail_path, seek=None):
                        thumbnail_entry = {
                            "name": doc_thumbnail_name,
                            "title": f"{primary_title}",
                            "format": "thumbnail",
                            "path": doc_thumbnail_relative_path,
                            "link": primary_artifact_name,
                            "action": doc_thumbnail_action or "download",
                            "metadata_ref": primary_metadata_ref,
                            "created_at": primary_created_at,
                            "updated_at": primary_updated_at,
                        }
                        if work_item_id is not None:
                            thumbnail_entry["work_item_id"] = work_item_id
                        thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                        thumbnail_serializer.is_valid(raise_exception=True)
                        validated_artifacts.append(thumbnail_serializer.validated_data)

        if not file_obj:
            artifacts_root = package_root(project_id_str, package_id) / "artifacts"
            attachment_root = package_root(project_id_str, package_id) / "attachment"
            for artifact in list(validated_artifacts):
                format_value = str(artifact.get("format") or "").lower()
                if format_value == "thumbnail":
                    continue
                action_value = str(artifact.get("action") or "").lower()
                is_video = (
                    format_value in _VIDEO_FORMATS
                    or format_value == "stream"
                    or action_value in {"play_streaming", "play_hls", "play", "open_mp4"}
                )
                raw_path = artifact.get("path") or ""

                if is_video:
                    if not isinstance(raw_path, str) or not raw_path.startswith(("http://", "https://", "/")):
                        continue
                    thumbnail_name = f"{artifact.get('name')}-thumbnail"
                    validate_segment(thumbnail_name, "artifactId")
                    if thumbnail_name in existing_names or thumbnail_name in incoming_names:
                        continue
                    if shutil.which("ffmpeg") is None:
                        logger.error("ffmpeg is not installed. Skipping video thumbnail for %s.", artifact.get("name"))
                        continue
                    source_urls = _resolve_external_video_sources(raw_path, request, project_id_str)
                    if not source_urls:
                        continue
                    artifacts_root.mkdir(parents=True, exist_ok=True)
                    thumbnail_file_name = f"{artifact.get('name')}-thumbnail.webp"
                    thumbnail_path = artifacts_root / thumbnail_file_name
                    created_thumbnail = False
                    for source_url in source_urls:
                        try:
                            if thumbnail_path.exists():
                                thumbnail_path.unlink()
                        except OSError:
                            pass
                        if _create_video_thumbnail_from_source(source_url, thumbnail_path):
                            created_thumbnail = True
                            break
                    if not created_thumbnail:
                        continue
                    thumbnail_relative_path = (
                        f"projects/{project_id_str}/packages/{package_id}/artifacts/{thumbnail_file_name}"
                    )
                    thumbnail_entry = {
                        "name": thumbnail_name,
                        "title": artifact.get("title") or "Video thumbnail",
                        "format": "thumbnail",
                        "path": thumbnail_relative_path,
                        "link": artifact.get("name"),
                        "action": "preview",
                        "metadata_ref": artifact.get("metadata_ref") or artifact.get("name"),
                        "created_at": artifact.get("created_at") or timestamp,
                        "updated_at": artifact.get("updated_at") or artifact.get("created_at") or timestamp,
                    }
                    work_item_id = artifact.get("work_item_id")
                    if work_item_id is not None:
                        thumbnail_entry["work_item_id"] = work_item_id
                    thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                    thumbnail_serializer.is_valid(raise_exception=True)
                    validated_artifacts.append(thumbnail_serializer.validated_data)
                    incoming_names.add(thumbnail_name)
                    continue

                if format_value in _IMAGE_FORMATS:
                    raw_path = artifact.get("path") or ""
                    if not isinstance(raw_path, str) or not raw_path:
                        continue
                    thumbnail_name = f"{artifact.get('name')}-thumbnail"
                    validate_segment(thumbnail_name, "artifactId")
                    if thumbnail_name in existing_names or thumbnail_name in incoming_names:
                        continue
                    artifacts_root.mkdir(parents=True, exist_ok=True)
                    thumbnail_file_name = f"{artifact.get('name')}-thumbnail.webp"
                    thumbnail_path = artifacts_root / thumbnail_file_name
                    max_bytes = getattr(settings, "MEDIA_LIBRARY_THUMBNAIL_MAX_BYTES", 51200)

                    resolved_path = _resolve_artifact_disk_path(artifact, media_library_root())
                    created_thumbnail = False
                    thumbnail_relative_path = None

                    if resolved_path and resolved_path.exists():
                        try:
                            if (
                                resolved_path.suffix.lower() == ".webp"
                                and resolved_path.stat().st_size <= max_bytes
                            ):
                                thumbnail_relative_path = raw_path
                                created_thumbnail = True
                        except OSError:
                            pass
                        if not created_thumbnail:
                            if generate_thumbnail(resolved_path, thumbnail_path, seek=None):
                                created_thumbnail = True
                    else:
                        source_urls = _resolve_external_video_sources(raw_path, request, project_id_str)
                        for source_url in source_urls:
                            try:
                                if thumbnail_path.exists():
                                    thumbnail_path.unlink()
                            except OSError:
                                pass
                            if generate_thumbnail(source_url, thumbnail_path, seek=None):
                                created_thumbnail = True
                                break

                    if not created_thumbnail:
                        continue
                    if not thumbnail_relative_path:
                        thumbnail_relative_path = (
                            f"projects/{project_id_str}/packages/{package_id}/artifacts/{thumbnail_file_name}"
                        )
                    thumbnail_entry = {
                        "name": thumbnail_name,
                        "title": artifact.get("title") or "Image thumbnail",
                        "format": "thumbnail",
                        "path": thumbnail_relative_path,
                        "link": artifact.get("name"),
                        "action": "view",
                        "metadata_ref": artifact.get("metadata_ref") or artifact.get("name"),
                        "created_at": artifact.get("created_at") or timestamp,
                        "updated_at": artifact.get("updated_at") or artifact.get("created_at") or timestamp,
                    }
                    work_item_id = artifact.get("work_item_id")
                    if work_item_id is not None:
                        thumbnail_entry["work_item_id"] = work_item_id
                    thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                    thumbnail_serializer.is_valid(raise_exception=True)
                    validated_artifacts.append(thumbnail_serializer.validated_data)
                    incoming_names.add(thumbnail_name)
                    continue

                thumbnail_name = f"{artifact.get('name')}-thumb"
                validate_segment(thumbnail_name, "artifactId")
                if thumbnail_name in existing_names or thumbnail_name in incoming_names:
                    continue
                thumbnail_hint = None
                meta_value = artifact.get("meta")
                if isinstance(meta_value, dict):
                    thumbnail_hint = meta_value.get("thumbnail")
                doc_thumbnail_source = get_document_icon_source(format_value, thumbnail_hint)
                if not doc_thumbnail_source:
                    continue
                doc_thumbnail_file_name = None
                if isinstance(thumbnail_hint, str):
                    hint_name = Path(thumbnail_hint).name
                    if hint_name:
                        doc_thumbnail_file_name = f"{Path(hint_name).stem}.webp"
                if not doc_thumbnail_file_name:
                    doc_thumbnail_file_name = f"{artifact.get('name')}-thumbnail.webp"
                doc_thumbnail_path = attachment_root / doc_thumbnail_file_name
                if not generate_thumbnail(doc_thumbnail_source, doc_thumbnail_path, seek=None):
                    continue
                doc_thumbnail_relative_path = (
                    f"projects/{project_id_str}/packages/{package_id}/attachment/{doc_thumbnail_file_name}"
                )
                thumbnail_entry = {
                    "name": thumbnail_name,
                    "title": artifact.get("title") or "Document thumbnail",
                    "format": "thumbnail",
                    "path": doc_thumbnail_relative_path,
                    "link": artifact.get("name"),
                    "action": "open_pdf" if format_value == "pdf" else action_value or "download",
                    "metadata_ref": artifact.get("metadata_ref") or artifact.get("name"),
                    "created_at": artifact.get("created_at") or timestamp,
                    "updated_at": artifact.get("updated_at") or artifact.get("created_at") or timestamp,
                }
                work_item_id = artifact.get("work_item_id")
                if work_item_id is not None:
                    thumbnail_entry["work_item_id"] = work_item_id
                thumbnail_serializer = MediaArtifactSerializer(data=thumbnail_entry)
                thumbnail_serializer.is_valid(raise_exception=True)
                validated_artifacts.append(thumbnail_serializer.validated_data)
                incoming_names.add(thumbnail_name)

        with manifest_write_lock(manifest_file):
            manifest = read_manifest(manifest_file)
            existing_artifacts = manifest.get("artifacts") or []
            existing_names = {artifact.get("name") for artifact in existing_artifacts if artifact.get("name")}
            for artifact in validated_artifacts:
                artifact_name = artifact.get("name")
                if artifact_name in existing_names:
                    return Response({"error": "Artifact already exists."}, status=status.HTTP_409_CONFLICT)
                existing_names.add(artifact_name)
            artifacts_for_manifest = [artifact.copy() for artifact in validated_artifacts]
            existing_artifacts.extend(artifacts_for_manifest)
            manifest["artifacts"] = existing_artifacts
            manifest["updatedAt"] = _now_iso()
            normalize_manifest_metadata(manifest)
            write_manifest_atomic(manifest_file, manifest)

        response_payload = validated_artifacts if is_bulk else validated_artifacts[0]
        return Response(response_payload, status=status.HTTP_201_CREATED)
