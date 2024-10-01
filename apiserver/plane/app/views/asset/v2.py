# Python imports
import uuid

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..base import BaseAPIView
from plane.db.models import FileAsset, Workspace, Project, User, Issue
from plane.settings.storage import S3Storage
from plane.app.permissions import allow_permission, ROLE


class UserAssetsV2Endpoint(BaseAPIView):
    """This endpoint is used to upload user profile images."""

    def entity_asset_save(self, asset_id, entity_type, entity_id):
        # User Avatar
        if entity_type == FileAsset.EntityTypeContext.USER_AVATAR:
            user = User.objects.get(id=entity_id)
            user.avatar = ""
            user.avatar_asset_id = asset_id
            user.save()
            return
        # User Cover
        if entity_type == FileAsset.EntityTypeContext.USER_COVER:
            user = User.objects.get(id=entity_id)
            user.cover_image = None
            user.cover_image_asset_id = asset_id
            user.save()
            return
        return

    def post(self, request):
        # get the asset key
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", False)

        #  Check if the entity type is allowed
        if not entity_type or entity_type not in ["USER_AVATAR", "USER_COVER"]:
            return Response(
                {
                    "error": "Invalid entity type.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            created_by=request.user,
            entity_type=entity_type,
            entity_identifier=request.user.id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            id=asset_id, entity_identifier=request.user.id
        )
        storage = S3Storage(request=request)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if asset.storage_metadata is None:
            asset.storage_metadata = storage.get_object_metadata(asset.asset)
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id, asset.entity_type, asset.entity_identifier
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, asset_id):
        asset = FileAsset.objects.get(
            id=asset_id, entity_identifier=request.user.id
        )
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload cover images/logos etc for workspace, projects and users."""

    def post(self, request, slug):
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", False)
        entity_identifier = request.data.get("entity_identifier", False)

        # Check if the entity type is allowed
        if entity_type not in FileAsset.EntityTypeContext.values:
            return Response(
                {
                    "error": "Invalid entity type.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the entity identifier is provided
        if not entity_identifier:
            return Response(
                {
                    "error": "Entity identifier is required.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            workspace=workspace,
            created_by=request.user,
            entity_type=entity_type,
            entity_identifier=entity_identifier,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    def entity_asset_save(self, asset_id, entity_type, entity_id):
        # Workspace Logo
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            workspace = Workspace.objects.get(id=entity_id)
            workspace.logo_asset_id = asset_id
            workspace.save()
            return
        # Project Cover
        elif entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            project = Project.objects.get(id=entity_id)
            project.cover_image_asset_id = asset_id
            project.save()
            return
        else:
            return

    def patch(self, request, slug, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        storage = S3Storage(request=request)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if asset.storage_metadata is None:
            asset.storage_metadata = storage.get_object_metadata(asset.asset)
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id, asset.entity_type, asset.entity_identifier
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug, asset_id):
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaticFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to get the signed URL for a static asset."""

    def get(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id)

        # Check if the entity type is allowed
        if asset.entity_type not in [
            FileAsset.EntityTypeContext.USER_AVATAR,
            FileAsset.EntityTypeContext.USER_COVER,
            FileAsset.EntityTypeContext.WORKSPACE_LOGO,
            FileAsset.EntityTypeContext.PROJECT_COVER,
        ]:
            return Response(
                {
                    "error": "Invalid entity type.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset,
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)


class AssetRestoreEndpoint(BaseAPIView):
    """Endpoint to restore a deleted assets."""

    def post(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id)
        asset.is_deleted = False
        asset.deleted_at = None
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageAssetEndpoint(BaseAPIView):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, page_id, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            entity_identifier=page_id,
            pk=asset_id,
            entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset,
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, page_id):
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            project_id=project_id,
            workspace=workspace,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
            entity_identifier=page_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id, page_id, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            id=asset_id,
            entity_identifier=page_id,
            entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
        )
        storage = S3Storage(request=request)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if asset.storage_metadata is None:
            asset.storage_metadata = storage.get_object_metadata(asset.asset)
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id, asset.entity_type, asset.entity_identifier
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def delete(self, request, slug, project_id, page_id, asset_id):
        # Get the asset
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            project_id=project_id,
            entity_identifier=page_id,
            entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
        )
        # Check deleted assets
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # Save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueAssetEndpoint(BaseAPIView):

    @allow_permission(
        allowed_roles=[
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        creator=True,
        model=Issue,
    )
    def get(self, request, slug, project_id, issue_id, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            entity_identifier=issue_id,
            pk=asset_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset,
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            project_id=project_id,
            workspace=workspace,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
            entity_identifier=issue_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue
    )
    def patch(self, request, slug, project_id, issue_id, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            id=asset_id,
            entity_identifier=issue_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        )
        storage = S3Storage(request=request)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if asset.storage_metadata is None:
            asset.storage_metadata = storage.get_object_metadata(asset.asset)
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id, asset.entity_type, asset.entity_identifier
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], creator=True, model=Issue)
    def delete(self, request, slug, project_id, issue_id, asset_id):
        # Get the asset
        asset = FileAsset.objects.get(
            id=asset_id,
            workspace__slug=slug,
            project_id=project_id,
            entity_identifier=issue_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        )
        # Check deleted assets
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # Save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
