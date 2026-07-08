# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import mimetypes
import uuid

# Django imports
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import FileCategorySerializer, FileLibraryAssetSerializer
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.models import (
    FileAsset,
    FileCategory,
    FileCategoryLink,
    Workspace,
    WorkspaceFeature,
)
from plane.settings.storage import S3Storage
from plane.utils.path_validator import sanitize_filename
from plane.utils.workspace_feature import is_workspace_feature_enabled

from ..base import BaseAPIView


class FileLibraryBaseView(BaseAPIView):
    """Base view enforcing the per-workspace file-library feature flag."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        slug = kwargs.get("slug")
        if slug and not is_workspace_feature_enabled(WorkspaceFeature.FeatureKey.FILE_LIBRARY, slug=slug):
            self.permission_denied(request, message="The file library is not enabled for this workspace")


class FileCategoryEndpoint(FileLibraryBaseView):
    serializer_class = FileCategorySerializer
    model = FileCategory

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        categories = (
            FileCategory.objects.filter(workspace__slug=slug)
            .annotate(file_count=Count("file_links", filter=Q(file_links__deleted_at__isnull=True)))
            .order_by("-is_default", "name")
        )
        serializer = FileCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = FileCategorySerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FileCategoryDetailEndpoint(FileLibraryBaseView):
    serializer_class = FileCategorySerializer
    model = FileCategory

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, category_id):
        category = FileCategory.objects.get(id=category_id, workspace__slug=slug)
        if category.is_default:
            # The default category name is load-bearing (contract detection);
            # only description/color may change
            request.data.pop("name", None)
        serializer = FileCategorySerializer(
            category,
            data=request.data,
            partial=True,
            context={"workspace_id": category.workspace_id},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, category_id):
        category = FileCategory.objects.get(id=category_id, workspace__slug=slug)
        if category.is_default:
            return Response(
                {"error": "The default category cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Deleting a category only unlinks files; the assets themselves remain
        FileCategoryLink.objects.filter(category=category).delete()
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FileLibraryAssetEndpoint(FileLibraryBaseView):
    serializer_class = FileLibraryAssetSerializer
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        assets = (
            FileAsset.objects.filter(
                workspace__slug=slug,
                entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
                is_uploaded=True,
                is_deleted=False,
            )
            .prefetch_related(Prefetch("category_links", queryset=FileCategoryLink.objects.all()))
            .order_by("-created_at")
        )

        # Filter by category (or files without any category)
        category_id = request.query_params.get("category")
        if category_id == "none":
            assets = assets.filter(category_links__isnull=True)
        elif category_id:
            assets = assets.filter(category_links__category_id=category_id)

        # Filter by file name
        search = request.query_params.get("search")
        if search:
            assets = assets.filter(attributes__name__icontains=search)

        # Filter by MIME type prefix (e.g. "application/pdf" or "image/")
        file_type = request.query_params.get("type")
        if file_type:
            assets = assets.filter(attributes__type__istartswith=file_type)

        serializer = FileLibraryAssetSerializer(assets.distinct(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        name = sanitize_filename(request.data.get("name")) or "unnamed"
        size = int(request.data.get("size", 0))

        # The file library is a general document store, so any file type is
        # allowed. The client sniffs the MIME type from the file signature,
        # which is empty for types without magic bytes (e.g. CSV/TSV) — fall
        # back to the extension, then to a generic binary type.
        file_type = request.data.get("type") or mimetypes.guess_type(name)[0] or "application/octet-stream"

        # Any size is allowed up to a generous ceiling to guard against abuse.
        if size <= 0 or size > settings.FILE_LIBRARY_SIZE_LIMIT:
            return Response(
                {"error": "Invalid file size.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        asset = FileAsset.objects.create(
            attributes={"name": name, "type": file_type, "size": size},
            asset=asset_key,
            size=size,
            workspace=workspace,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
        )

        storage = S3Storage(request=request)
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=file_type, file_size=size)

        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset": FileLibraryAssetSerializer(asset).data,
            },
            status=status.HTTP_200_OK,
        )


class FileLibraryAssetDetailEndpoint(FileLibraryBaseView):
    serializer_class = FileLibraryAssetSerializer
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, asset_id):
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
        )
        asset.is_uploaded = True
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))
        asset.attributes = request.data.get("attributes", asset.attributes)
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, asset_id):
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
        )
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class FileLibraryAssetDownloadEndpoint(FileLibraryBaseView):
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, asset_id):
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
        )
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # disposition=inline lets the in-app viewers render the file; the
        # frontend appends ?download=1 to force an attachment download
        disposition = "attachment" if request.query_params.get("download") else "inline"
        storage = S3Storage(request=request)
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition=disposition,
            filename=asset.attributes.get("name"),
        )
        # The in-app viewers fetch files directly from storage, so they need
        # the resolved presigned URL rather than a cookie-authenticated redirect
        if request.query_params.get("response") == "json":
            return Response({"url": signed_url}, status=status.HTTP_200_OK)
        return HttpResponseRedirect(signed_url)


class FileCategoryLinkEndpoint(FileLibraryBaseView):
    model = FileCategoryLink

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, asset_id):
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
        )
        category_ids = request.data.get("category_ids", [])
        if not isinstance(category_ids, list) or not category_ids:
            return Response(
                {"error": "category_ids must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        categories = FileCategory.objects.filter(workspace__slug=slug, id__in=category_ids)
        if categories.count() != len(set(category_ids)):
            return Response(
                {"error": "One or more categories were not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # pdf_only categories (e.g. "Contratos") accept PDF files exclusively
        asset_type = (asset.attributes or {}).get("type", "")
        pdf_only_categories = [category for category in categories if category.pdf_only]
        if pdf_only_categories and asset_type != "application/pdf":
            return Response(
                {
                    "error": "Only PDF files can be added to this category",
                    "categories": [category.name for category in pdf_only_categories],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        for category in categories:
            FileCategoryLink.objects.get_or_create(
                file_asset=asset,
                category=category,
                defaults={"workspace_id": asset.workspace_id},
            )

        serializer = FileLibraryAssetSerializer(asset)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, asset_id, category_id):
        FileCategoryLink.objects.filter(
            file_asset_id=asset_id,
            file_asset__workspace__slug=slug,
            category_id=category_id,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
