# Python imports
import json
from pathlib import Path
from uuid import uuid4

# Third party imports
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

# Module imports
from plane.api.serializers.media_library import MediaArtifactSerializer, MediaPackageCreateSerializer
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectLitePermission
from plane.utils.media_library import (
    _now_iso,
    create_manifest,
    manifest_path,
    package_root,
    read_manifest,
    validate_segment,
    write_manifest_atomic,
)

_IMAGE_FORMATS = {"jpg", "jpeg", "png", "svg", "thumbnail"}
_VIDEO_FORMATS = {"mp4", "m3u8"}


class MediaPackageCreateAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectLitePermission]

    def post(self, request, slug, project_id):
        serializer = MediaPackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id_str = str(project_id)
        package_id = serializer.validated_data.get("id") or uuid4().hex

        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        root = package_root(project_id_str, package_id)
        manifest_file = manifest_path(project_id_str, package_id)

        if root.exists() or manifest_file.exists():
            return Response({"error": "Package already exists."}, status=status.HTTP_409_CONFLICT)

        (root / "artifact").mkdir(parents=True, exist_ok=False)

        manifest = create_manifest(
            project_id=project_id_str,
            package_id=package_id,
            name=serializer.validated_data["name"],
            title=serializer.validated_data["title"],
            artifacts=serializer.validated_data.get("artifacts"),
        )
        write_manifest_atomic(manifest_file, manifest)

        return Response(manifest, status=status.HTTP_201_CREATED)


class MediaManifestDetailAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectLitePermission]

    def get(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        return Response(manifest, status=status.HTTP_200_OK)


class MediaArtifactsListAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectLitePermission]

    def get(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        return Response(manifest.get("artifacts", []), status=status.HTTP_200_OK)

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
            link = request.data.get("link")
            if isinstance(link, str) and link.strip().lower() in {"", "null"}:
                link = None

            action = request.data.get("action")
            if not action:
                if format_value in _VIDEO_FORMATS:
                    action = "play"
                elif format_value in _IMAGE_FORMATS:
                    action = "view"
                else:
                    action = "download"

            meta = request.data.get("meta") or {}
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
            artifact_file_name = f"{artifact_name}.{extension}"
            artifacts_root = package_root(project_id_str, package_id) / "artifacts"
            file_path = artifacts_root / artifact_file_name
            relative_path = (
                f"projects/{project_id_str}/packages/{package_id}/artifacts/{artifact_file_name}"
            )
            artifacts_payload = [
                {
                    "name": artifact_name,
                    "title": title,
                    "format": format_value,
                    "path": relative_path,
                    "link": link,
                    "action": action,
                    "meta": meta,
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
            ]
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
            if not entry.get("created_at"):
                entry["created_at"] = timestamp
            if not entry.get("updated_at"):
                entry["updated_at"] = entry["created_at"]
            prepared_payload.append(entry)

        serializer = MediaArtifactSerializer(data=prepared_payload, many=True)
        serializer.is_valid(raise_exception=True)
        validated_artifacts = serializer.validated_data

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

        if file_obj and file_path:
            if file_path.exists():
                return Response({"error": "Artifact file already exists."}, status=status.HTTP_409_CONFLICT)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as handle:
                for chunk in file_obj.chunks():
                    handle.write(chunk)

        existing_artifacts.extend(validated_artifacts)
        manifest["artifacts"] = existing_artifacts
        manifest["updatedAt"] = _now_iso()
        write_manifest_atomic(manifest_file, manifest)

        response_payload = validated_artifacts if is_bulk else validated_artifacts[0]
        return Response(response_payload, status=status.HTTP_201_CREATED)
