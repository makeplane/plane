# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from ..base import BaseAPIView
from plane.db.models import FileAsset, Workspace, Project, User, WorkspaceMember, ProjectMember
from plane.settings.storage import S3Storage
from plane.app.permissions import allow_permission, ROLE
from plane.utils.cache import invalidate_cache_directly
from plane.utils.path_validator import sanitize_filename
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.throttles.asset import AssetRateThrottle


class UserAssetsV2Endpoint(BaseAPIView):
    """This endpoint is used to upload user profile images."""

    def asset_delete(self, asset_id):
        asset = FileAsset.objects.filter(id=asset_id).first()
        if asset is None:
            return
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return

    def entity_asset_save(self, asset_id, entity_type, asset, request):
        # User Avatar
        if entity_type == FileAsset.EntityTypeContext.USER_AVATAR:
            user = User.objects.get(id=asset.user_id)
            user.avatar = ""
            # Delete the previous avatar
            if user.avatar_asset_id:
                self.asset_delete(user.avatar_asset_id)
            # Save the new avatar
            user.avatar_asset_id = asset_id
            user.save()
            invalidate_cache_directly(path="/api/users/me/", url_params=False, user=True, request=request)
            invalidate_cache_directly(
                path="/api/users/me/settings/",
                url_params=False,
                user=True,
                request=request,
            )
            return
        # User Cover
        if entity_type == FileAsset.EntityTypeContext.USER_COVER:
            user = User.objects.get(id=asset.user_id)
            user.cover_image = None
            # Delete the previous cover image
            if user.cover_image_asset_id:
                self.asset_delete(user.cover_image_asset_id)
            # Save the new cover image
            user.cover_image_asset_id = asset_id
            user.save()
            invalidate_cache_directly(path="/api/users/me/", url_params=False, user=True, request=request)
            invalidate_cache_directly(
                path="/api/users/me/settings/",
                url_params=False,
                user=True,
                request=request,
            )
            return
        return

    def entity_asset_delete(self, entity_type, asset, request):
        # User Avatar
        if entity_type == FileAsset.EntityTypeContext.USER_AVATAR:
            user = User.objects.get(id=asset.user_id)
            user.avatar_asset_id = None
            user.save()
            invalidate_cache_directly(path="/api/users/me/", url_params=False, user=True, request=request)
            invalidate_cache_directly(
                path="/api/users/me/settings/",
                url_params=False,
                user=True,
                request=request,
            )
            return
        # User Cover
        if entity_type == FileAsset.EntityTypeContext.USER_COVER:
            user = User.objects.get(id=asset.user_id)
            user.cover_image_asset_id = None
            user.save()
            invalidate_cache_directly(path="/api/users/me/", url_params=False, user=True, request=request)
            invalidate_cache_directly(
                path="/api/users/me/settings/",
                url_params=False,
                user=True,
                request=request,
            )
            return
        return

    def post(self, request):
        # get the asset key
        name = sanitize_filename(request.data.get("name")) or "unnamed"
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", False)

        # Check if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        #  Check if the entity type is allowed
        if not entity_type or entity_type not in ["USER_AVATAR", "USER_COVER"]:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/gif",
        ]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG, PNG, WebP, JPG and GIF files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            user=request.user,
            created_by=request.user,
            entity_type=entity_type,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)
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
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id=asset_id,
            entity_type=asset.entity_type,
            asset=asset,
            request=request,
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id, user_id=request.user.id)
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # get the entity and save the asset id for the request field
        self.entity_asset_delete(entity_type=asset.entity_type, asset=asset, request=request)
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload cover images/logos etc for workspace, projects and users."""

    def get_entity_id_field(self, entity_type, entity_id):
        # Workspace Logo
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            return {"workspace_id": entity_id}

        # Project Cover
        if entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            return {"project_id": entity_id}

        # User Avatar and Cover
        if entity_type in [
            FileAsset.EntityTypeContext.USER_AVATAR,
            FileAsset.EntityTypeContext.USER_COVER,
        ]:
            return {"user_id": entity_id}

        # Issue Attachment and Description
        if entity_type in [
            FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        ]:
            return {"issue_id": entity_id}

        # Page Description
        if entity_type == FileAsset.EntityTypeContext.PAGE_DESCRIPTION:
            return {"page_id": entity_id}

        # Comment Description
        if entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION:
            return {"comment_id": entity_id}
        return {}

    def asset_delete(self, asset_id):
        asset = FileAsset.objects.filter(id=asset_id).first()
        # Check if the asset exists
        if asset is None:
            return
        # Mark the asset as deleted
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return

    def entity_asset_save(self, asset_id, entity_type, asset, request):
        # Workspace Logo
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            workspace = Workspace.objects.filter(id=asset.workspace_id).first()
            if workspace is None:
                return
            # Delete the previous logo
            if workspace.logo_asset_id:
                self.asset_delete(workspace.logo_asset_id)
            # Save the new logo
            workspace.logo = ""
            workspace.logo_asset_id = asset_id
            workspace.save()
            invalidate_cache_directly(path="/api/workspaces/", url_params=False, user=False, request=request)
            invalidate_cache_directly(
                path="/api/users/me/workspaces/",
                url_params=False,
                user=True,
                request=request,
            )
            invalidate_cache_directly(path="/api/instances/", url_params=False, user=False, request=request)
            return

        # Project Cover
        elif entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            project = Project.objects.filter(id=asset.project_id).first()
            if project is None:
                return
            # Delete the previous cover image
            if project.cover_image_asset_id:
                self.asset_delete(project.cover_image_asset_id)
            # Save the new cover image
            project.cover_image = ""
            project.cover_image_asset_id = asset_id
            project.save()
            return
        else:
            return

    def entity_asset_delete(self, entity_type, asset, request):
        # Workspace Logo
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            workspace = Workspace.objects.get(id=asset.workspace_id)
            if workspace is None:
                return
            workspace.logo_asset_id = None
            workspace.save()
            invalidate_cache_directly(path="/api/workspaces/", url_params=False, user=False, request=request)
            invalidate_cache_directly(
                path="/api/users/me/workspaces/",
                url_params=False,
                user=True,
                request=request,
            )
            invalidate_cache_directly(path="/api/instances/", url_params=False, user=False, request=request)
            return
        # Project Cover
        elif entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            project = Project.objects.filter(id=asset.project_id).first()
            if project is None:
                return
            project.cover_image_asset_id = None
            project.save()
            return
        else:
            return

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        name = sanitize_filename(request.data.get("name")) or "unnamed"
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type")
        entity_identifier = request.data.get("entity_identifier", False)

        # Check if the entity type is allowed
        if entity_type not in FileAsset.EntityTypeContext.values:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # WORKSPACE_LOGO may only be uploaded by workspace admins
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            workspace_member = WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True
            ).first()
            if not workspace_member or workspace_member.role != ROLE.ADMIN.value:
                return Response(
                    {"error": "Only workspace admins can upload a workspace logo."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Check if the file type is allowed
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/gif",
        ]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG, PNG, WebP, JPG and GIF files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the size limit
        size_limit = min(settings.FILE_SIZE_LIMIT, size)

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace=workspace,
            created_by=request.user,
            entity_type=entity_type,
            **self.get_entity_id_field(entity_type=entity_type, entity_id=entity_identifier),
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        # enforce project-level access for project-bound assets
        if not asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))
        # get the entity and save the asset id for the request field
        self.entity_asset_save(
            asset_id=asset_id,
            entity_type=asset.entity_type,
            asset=asset,
            request=request,
        )
        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug, asset_id):
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        # enforce project-level access for project-bound assets
        if not asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # get the entity and save the asset id for the request field
        self.entity_asset_delete(entity_type=asset.entity_type, asset=asset, request=request)
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        # enforce project-level access for project-bound assets
        if not asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition="attachment",
            filename=asset.attributes.get("name"),
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)


class StaticFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to get the signed URL for a static asset."""

    permission_classes = [AllowAny]

    def get(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id)

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the entity type is allowed
        if asset.entity_type not in [
            FileAsset.EntityTypeContext.USER_AVATAR,
            FileAsset.EntityTypeContext.USER_COVER,
            FileAsset.EntityTypeContext.WORKSPACE_LOGO,
            FileAsset.EntityTypeContext.PROJECT_COVER,
        ]:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the presigned URL.
        # Force attachment disposition for script-capable MIME types to prevent
        # same-origin XSS when assets are served on the application's origin.
        storage = S3Storage(request=request)
        asset_mime_type = (asset.attributes.get("type") or "").split(";")[0].strip().lower()
        disposition = (
            "attachment" if asset_mime_type in settings.SCRIPT_CAPABLE_MIME_TYPES else "inline"
        )
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition=disposition,
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)


class AssetRestoreEndpoint(BaseAPIView):
    """Endpoint to restore a deleted assets."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, asset_id):
        asset = FileAsset.all_objects.get(id=asset_id, workspace__slug=slug)
        # Authorized at the WORKSPACE level, so without this a workspace member
        # who is not in the asset's project could reverse a deletion performed
        # by that project's own members.
        if not asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )
        asset.is_deleted = False
        asset.deleted_at = None
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload cover images/logos etc for workspace, projects and users."""

    def get_entity_id_field(self, entity_type, entity_id):
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            return {"workspace_id": entity_id}

        if entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            return {"project_id": entity_id}

        if entity_type in [
            FileAsset.EntityTypeContext.USER_AVATAR,
            FileAsset.EntityTypeContext.USER_COVER,
        ]:
            return {"user_id": entity_id}

        if entity_type in [
            FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        ]:
            return {"issue_id": entity_id}

        if entity_type == FileAsset.EntityTypeContext.PAGE_DESCRIPTION:
            return {"page_id": entity_id}

        if entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION:
            return {"comment_id": entity_id}

        if entity_type == FileAsset.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION:
            return {"draft_issue_id": entity_id}
        return {}

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id):
        name = sanitize_filename(request.data.get("name")) or "unnamed"
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", "")
        entity_identifier = request.data.get("entity_identifier")

        # Check if the entity type is allowed
        if entity_type not in FileAsset.EntityTypeContext.values:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/gif",
        ]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG, PNG, WebP, JPG and GIF files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the size limit
        size_limit = min(settings.FILE_SIZE_LIMIT, size)

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace=workspace,
            created_by=request.user,
            entity_type=entity_type,
            project_id=project_id,
            **self.get_entity_id_field(entity_type, entity_identifier),
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)
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
    def patch(self, request, slug, project_id, pk):
        # get the asset id
        asset = FileAsset.objects.get(id=pk, workspace__slug=slug, project_id=project_id)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(pk))

        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def delete(self, request, slug, project_id, pk):
        # Get the asset
        asset = FileAsset.objects.get(id=pk, workspace__slug=slug, project_id=project_id)
        # Check deleted assets
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # Save the asset
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, pk):
        # get the asset id
        asset = FileAsset.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition="attachment",
            filename=asset.attributes.get("name"),
        )
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)


class ProjectBulkAssetEndpoint(BaseAPIView):
    def save_project_cover(self, asset, project_id):
        project = Project.objects.get(id=project_id)
        project.cover_image_asset_id = asset.id
        project.save()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, entity_id):
        asset_ids = request.data.get("asset_ids", [])

        # Check if the asset ids are provided
        if not asset_ids:
            return Response({"error": "No asset ids provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Scope to the requester's own uploads in this workspace, limited to assets that are
        # either unassociated or already in this project. This endpoint *associates*
        # freshly-uploaded assets, which are not yet project-scoped (e.g. a cover uploaded
        # during project creation has project_id=NULL until this call sets it) — so the
        # earlier project_id=project_id filter 404'd that flow. created_by + the
        # unassociated-or-same-project bound prevent cross-project/user IDOR (a caller can
        # only touch their own uploads, cannot move an asset in from another project, and
        # @allow_permission already scopes them to this project).
        assets = FileAsset.objects.filter(
            id__in=asset_ids,
            workspace__slug=slug,
            created_by=request.user,
        ).filter(Q(project_id=project_id) | Q(project_id__isnull=True))

        # Get the first asset
        asset = assets.first()

        if not asset:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the asset is uploaded
        if asset.entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            assets.update(project_id=project_id)
            [self.save_project_cover(asset, project_id) for asset in assets]

        if asset.entity_type == FileAsset.EntityTypeContext.ISSUE_DESCRIPTION:
            # For some cases, the bulk api is called after the issue is deleted creating
            # an integrity error
            try:
                assets.update(issue_id=entity_id, project_id=project_id)
            except IntegrityError:
                pass

        if asset.entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION:
            # For some cases, the bulk api is called after the comment is deleted
            # creating an integrity error
            try:
                assets.update(comment_id=entity_id)
            except IntegrityError:
                pass

        if asset.entity_type == FileAsset.EntityTypeContext.PAGE_DESCRIPTION:
            assets.update(page_id=entity_id)

        if asset.entity_type == FileAsset.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION:
            # For some cases, the bulk api is called after the draft issue is deleted
            # creating an integrity error
            try:
                assets.update(draft_issue_id=entity_id)
            except IntegrityError:
                pass

        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetCheckEndpoint(BaseAPIView):
    """Endpoint to check if an asset exists."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, asset_id):
        asset = FileAsset.all_objects.filter(id=asset_id, workspace__slug=slug, deleted_at__isnull=True).first()
        # Report existence only to callers who could otherwise reach the asset.
        # Reporting it unconditionally makes this route an existence oracle for
        # every project in the workspace, including ones the caller cannot see.
        exists = asset is not None and asset.is_project_accessible_to(request.user)
        return Response({"exists": exists}, status=status.HTTP_200_OK)


class DuplicateAssetEndpoint(BaseAPIView):
    throttle_classes = [AssetRateThrottle]

    def get_entity_id_field(self, entity_type, entity_id):
        # Workspace Logo
        if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
            return {"workspace_id": entity_id}

        # Project Cover
        if entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
            return {"project_id": entity_id}

        # User Avatar and Cover
        if entity_type in [
            FileAsset.EntityTypeContext.USER_AVATAR,
            FileAsset.EntityTypeContext.USER_COVER,
        ]:
            return {"user_id": entity_id}

        # Issue Attachment and Description
        if entity_type in [
            FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        ]:
            return {"issue_id": entity_id}

        # Page Description
        if entity_type == FileAsset.EntityTypeContext.PAGE_DESCRIPTION:
            return {"page_id": entity_id}

        # Comment Description
        if entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION:
            return {"comment_id": entity_id}

        return {}

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, asset_id):
        project_id = request.data.get("project_id", None)
        entity_id = request.data.get("entity_id", None)
        entity_type = request.data.get("entity_type", None)

        if not entity_type or entity_type not in FileAsset.EntityTypeContext.values:
            return Response(
                {"error": "Invalid entity type or entity id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        storage = S3Storage(request=request)
        # Restrict the source asset to the same destination workspace to prevent cross-workspace asset copying
        original_asset = FileAsset.objects.filter(
            id=asset_id,
            is_uploaded=True,
            workspace=workspace,
        ).first()

        if not original_asset:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        # The source lookup binds the workspace but not the project, so without
        # this a non-member could copy a project's asset into a project they do
        # control -- a permanent copy that outlives the original being deleted.
        if not original_asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # A caller may redirect the copy to a different project than the source
        # (e.g. duplicating an attachment onto an issue that lives in another
        # project) by naming project_id explicitly -- that's still validated
        # below. But leaving it out (or sending it empty/null) must not be read
        # as "make this workspace-level": the caller's access to the source
        # only ever came through its project, and defaulting to None here
        # would strip that scoping and expose the copy to the entire
        # workspace. This isn't something the client should be able to unset
        # at all -- default to the source's own project instead.
        if project_id:
            # check if project exists in the workspace
            if not Project.objects.filter(id=project_id, workspace=workspace).exists():
                return Response(
                    {"error": "Project not found", "status": False}, status=status.HTTP_404_NOT_FOUND
                )
            # project_id is the *destination* and comes from the request body.
            # Existence in the workspace is not authorization: require the caller
            # to be an active member of the project the copy will land in, or a
            # workspace member could deposit assets into any project.
            if not ProjectMember.objects.filter(
                member=request.user,
                workspace=workspace,
                project_id=project_id,
                is_active=True,
            ).exists():
                return Response(
                    {"error": "You don't have access to this project.", "status": False},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            project_id = original_asset.project_id

        sanitized_name = sanitize_filename(original_asset.attributes.get("name")) or "unnamed"
        destination_key = f"{workspace.id}/{uuid.uuid4().hex}-{sanitized_name}"
        duplicated_asset = FileAsset.objects.create(
            attributes={
                "name": original_asset.attributes.get("name"),
                "type": original_asset.attributes.get("type"),
                "size": original_asset.attributes.get("size"),
            },
            asset=destination_key,
            size=original_asset.size,
            workspace=workspace,
            created_by_id=request.user.id,
            entity_type=entity_type,
            project_id=project_id if project_id else None,
            storage_metadata=original_asset.storage_metadata,
            **self.get_entity_id_field(entity_type=entity_type, entity_id=entity_id),
        )
        storage.copy_object(original_asset.asset, destination_key)
        # Update the is_uploaded field for all newly created assets
        FileAsset.objects.filter(id=duplicated_asset.id).update(is_uploaded=True)

        return Response({"asset_id": str(duplicated_asset.id)}, status=status.HTTP_200_OK)


class WorkspaceAssetDownloadEndpoint(BaseAPIView):
    """Endpoint to generate a download link for an asset with content-disposition=attachment."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, asset_id):
        try:
            asset = FileAsset.objects.get(
                id=asset_id,
                workspace__slug=slug,
                is_uploaded=True,
            )
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # The workspace-level twin of ProjectAssetDownloadEndpoint, which binds
        # project_id through level="PROJECT". Here the project is not in the URL,
        # so it has to be enforced against the asset itself -- otherwise the
        # presigned URL hands the file to a non-member of its project.
        if not asset.is_project_accessible_to(request.user):
            return Response(
                {"error": "You don't have access to this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )

        storage = S3Storage(request=request)
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition="attachment",
            filename=asset.attributes.get("name", uuid.uuid4().hex),
        )

        return HttpResponseRedirect(signed_url)


class ProjectAssetDownloadEndpoint(BaseAPIView):
    """Endpoint to generate a download link for an asset with content-disposition=attachment."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, asset_id):
        try:
            asset = FileAsset.objects.get(
                id=asset_id,
                workspace__slug=slug,
                project_id=project_id,
                is_uploaded=True,
            )
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        storage = S3Storage(request=request)
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition="attachment",
            filename=asset.attributes.get("name", uuid.uuid4().hex),
        )

        return HttpResponseRedirect(signed_url)
