# Python imports
import mimetypes
import os
from pathlib import Path
from uuid import uuid4

# Third party imports
from django.http import FileResponse
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import MediaLibraryPackageCreateSerializer
from plane.app.views.base import BaseAPIView
from plane.utils.media_library import (
    create_manifest,
    ensure_project_library,
    manifest_path,
    media_library_root,
    package_root,
    read_manifest,
    validate_segment,
    write_manifest_atomic,
)


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
                    manifest = read_manifest(manifest_file)
                    return Response(manifest, status=status.HTTP_200_OK)
            return Response(status=status.HTTP_204_NO_CONTENT)

        package_id = f"package-{uuid4().hex[:8]}"
        root = package_root(project_id_str, package_id)
        (root / "artifacts").mkdir(parents=True, exist_ok=False)
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
        artifact = next(
            (entry for entry in artifacts if entry.get("name") == artifact_id),
            None,
        )
        if not artifact:
            raise NotFound("Artifact not found.")

        base_root = media_library_root().resolve(strict=False)
        file_path = None
        raw_path = artifact.get("path") or ""
        if raw_path:
            candidate = Path(raw_path)
            if not candidate.is_absolute():
                candidate = (base_root / candidate).resolve(strict=False)
            else:
                candidate = candidate.resolve(strict=False)
            if os.path.commonpath([str(base_root), str(candidate)]) == str(base_root) and candidate.exists():
                file_path = candidate

        if not file_path:
            artifacts_root = package_root(project_id_str, package_id) / "artifacts"
            if artifacts_root.exists():
                matches = list(artifacts_root.glob(f"{artifact_id}.*"))
                if matches:
                    file_path = matches[0].resolve(strict=False)

        if not file_path or not file_path.exists():
            raise NotFound("Artifact file not found.")

        content_type, _ = mimetypes.guess_type(str(file_path))
        return FileResponse(open(file_path, "rb"), content_type=content_type or "application/octet-stream")


class MediaArtifactsListAPIView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, package_id):
        project_id_str = str(project_id)
        validate_segment(project_id_str, "projectId")
        validate_segment(package_id, "packageId")

        manifest_file = manifest_path(project_id_str, package_id)
        if not manifest_file.exists():
            raise NotFound("Manifest not found.")

        manifest = read_manifest(manifest_file)
        return Response(manifest.get("artifacts", []), status=status.HTTP_200_OK)
