# Python imports
from uuid import uuid4

# Third party imports
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

# Module imports
from plane.api.serializers import MediaPackageCreateSerializer
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectLitePermission
from plane.utils.media_library import (
    create_manifest,
    manifest_path,
    package_root,
    read_manifest,
    validate_segment,
    write_manifest_atomic,
)


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
