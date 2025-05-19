# Python imports
import uuid

# Module imports
from plane.db.models import FileAsset, Workspace, Project
from plane.settings.storage import S3Storage
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission

# Third party imports
from rest_framework import status
from rest_framework.response import Response

class DuplicateAssetEndpoint(BaseAPIView):

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

        if entity_type in (
            FileAsset.EntityTypeContext.TEAM_SPACE_DESCRIPTION,
            FileAsset.EntityTypeContext.OAUTH_APP_DESCRIPTION,
            FileAsset.EntityTypeContext.OAUTH_APP_LOGO,
            FileAsset.EntityTypeContext.OAUTH_APP_ATTACHMENT,
            FileAsset.EntityTypeContext.TEMPLATE_ATTACHMENT,
        ):
            return {"entity_identifier": entity_id}

        return {}


    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        project_id = request.data.get("project_id", None)
        asset_ids = request.data.get("asset_ids", None)
        entity_id = request.data.get("entity_id", None)
        entity_type = request.data.get("entity_type", None)

        if not asset_ids:
            return Response(
                {"error": "asset_ids is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.get(slug=slug)
        if project_id:
            # check if project exists in the workspace
            if not Project.objects.filter(id=project_id, workspace=workspace).exists():
                return Response(
                    {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
                )
        duplicated_assets = {}

        storage = S3Storage()
        original_assets = FileAsset.objects.filter(
            workspace=workspace, id__in=asset_ids
        )
        for original_asset in original_assets:
            destination_key = f"{workspace.id}/{uuid.uuid4().hex}-{original_asset.attributes.get('name')}"
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
                **self.get_entity_id_field(
                    entity_type=entity_type, entity_id=entity_id
                ),
            )
            storage.copy_object(original_asset.asset, destination_key)
            duplicated_assets[str(original_asset.id)] = str(duplicated_asset.id)

        if duplicated_assets:
            # Update the is_uploaded field for all newly created assets
            FileAsset.objects.filter(id__in=duplicated_assets.values()).update(
                is_uploaded=True
            )

        return Response(duplicated_assets, status=status.HTTP_200_OK)
