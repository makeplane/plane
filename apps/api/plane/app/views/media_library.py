# Python imports
import json
import math
import logging
import shutil
import subprocess
import mimetypes
import os
from pathlib import Path
from uuid import uuid4

# Third party imports
from django.http import FileResponse
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from django.conf import settings

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers.media_library import MediaArtifactSerializer, MediaLibraryPackageCreateSerializer
from plane.app.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception
from plane.utils.media_library import (
    _now_iso,
    create_manifest,
    ensure_project_library,
    filter_media_library_artifacts,
    get_document_icon_source,
    hydrate_artifacts_with_meta,
    manifest_path,
    media_library_root,
    manifest_write_lock,
    normalize_manifest_metadata,
    normalize_metadata_ref,
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
logger = logging.getLogger(__name__)


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


def _render_ffmpeg_error(exc: subprocess.CalledProcessError) -> str:
    detail = (exc.stderr or exc.stdout or "").strip()
    if detail:
        detail = detail.replace("\n", " ")
        if len(detail) > 500:
            detail = f"{detail[:500]}..."
    return detail


def _create_video_thumbnail(source_path: Path, thumbnail_path: Path) -> bool:
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-ss",
                "00:00:00.000",
                "-i",
                str(source_path),
                "-frames:v",
                "1",
                "-q:v",
                "2",
                str(thumbnail_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        detail = _render_ffmpeg_error(exc)
        if detail:
            logger.error("ffmpeg thumbnail failed: %s", detail)
        else:
            logger.error("ffmpeg thumbnail failed with exit code %s", exc.returncode)
        return False
    return thumbnail_path.exists()


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
                        transcode_video_to_mp4(external_url, mp4_path)
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

        content_type, _ = mimetypes.guess_type(str(file_path))
        response = FileResponse(open(file_path, "rb"), content_type=content_type or "application/octet-stream")
        if download_requested and artifact_path is None:
            download_name = artifact.get("name") or "media"
            suffix = ".mp4" if is_video else (Path(file_path).suffix or "")
            response["Content-Disposition"] = f'attachment; filename="{download_name}{suffix}"'
        return response


class MediaArtifactDetailAPIView(BaseAPIView):
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
            should_transcode = is_video_upload and format_value != "m3u8" and extension != "m3u8"
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
                thumbnail_path = artifact_dir / "thumbnail.jpg"
                thumbnail_relative_path = (
                    f"projects/{project_id_str}/packages/{package_id}/artifacts/{primary_artifact_name}/thumbnail.jpg"
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
                    video_thumbnail_file_name = f"{primary_artifact_name}-thumbnail.jpg"
                    video_thumbnail_path = artifacts_root / video_thumbnail_file_name
                    video_thumbnail_relative_path = (
                        f"projects/{project_id_str}/packages/{package_id}/artifacts/{video_thumbnail_file_name}"
                    )
                    video_thumbnail_action = "preview"
                if format_value in _IMAGE_FORMATS and format_value != "thumbnail":
                    image_thumbnail_name = f"{primary_artifact_name}-thumbnail"
                    image_thumbnail_relative_path = relative_path
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
                                doc_thumbnail_file_name = hint_name
                        if not doc_thumbnail_file_name:
                            doc_thumbnail_file_name = (
                                f"{primary_artifact_name}-thumbnail{doc_thumbnail_source.suffix}"
                            )
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
                "description": f"This asset was uploaded to the media library and is ready for use.\n"
                     f"It can be previewed, downloaded, or used in projects as needed.\n"
                     f"File name: {title}",
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
                entry["description"] = (f"This asset was uploaded to the media library and is ready for use.\n"
                     f"It can be previewed, downloaded, or used in projects as needed.\n"
                     f"File name: {title_value}")
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
                    thumbnail_entry = {
                        "name": image_thumbnail_name,
                        "title": f"{primary_title}",
                        "format": "thumbnail",
                        "path": image_thumbnail_relative_path,
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
                    try:
                        if not doc_thumbnail_path.exists():
                            doc_thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
                            shutil.copyfile(doc_thumbnail_source, doc_thumbnail_path)
                        if doc_thumbnail_path.exists():
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
                    except OSError as exc:
                        logger.exception(
                            "Failed to write document thumbnail for %s.",
                            primary_artifact_name,
                            exc_info=exc,
                        )

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
