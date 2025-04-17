# Python imports
import uuid

# Django imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import FileAsset
from plane.settings.storage import S3Storage


class AssetCopyEndpoint(BaseAPIView):
    # Define the entity type mapping as a class constant
    ENTITY_TYPE_MAPPER = {
        FileAsset.EntityTypeContext.ISSUE_DESCRIPTION: FileAsset.EntityTypeContext.WORKITEM_TEMPLATE_DESCRIPTION,
        FileAsset.EntityTypeContext.PAGE_DESCRIPTION: FileAsset.EntityTypeContext.PAGE_TEMPLATE_DESCRIPTION,
    }

    def get_template_type(self, entity_type):
        """Get the corresponding template type for an entity type."""
        return self.ENTITY_TYPE_MAPPER.get(entity_type)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, project_id=None):
        """
        Copy assets from templates to create new assets.
        Returns a mapping of original template asset IDs to new asset IDs.
        """
        # Extract request data
        asset_ids = request.data.get("asset_ids", [])
        entity_type = request.data.get("entity_type")

        if not asset_ids:
            return Response(
                {"error": "No asset IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        template_type = self.get_template_type(entity_type)
        # Validate input
        if not template_type:
            return Response(
                {"error": "Invalid entity type"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get all the assets from templates
        template_assets = FileAsset.objects.filter(
            workspace__slug=slug,
            entity_type=template_type,
            id__in=asset_ids,  # Only copy the requested assets
            is_uploaded=True,
        ).values("id", "asset", "workspace_id", "attributes", "size")

        if not template_assets:
            return Response(
                {"error": "No matching template assets found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Set up S3 storage
        s3_storage = S3Storage()

        # Create mappings and prepare new assets
        template_to_new_asset_key = {}  # Maps template asset ID to new asset key
        new_file_assets = []

        for template_asset in template_assets:
            template_id = template_asset["id"]
            new_asset_key = f"{template_asset['workspace_id']}/{uuid.uuid4()}"

            # Map the template ID to the new asset key
            template_to_new_asset_key[template_id] = new_asset_key

            # Copy the asset in S3
            s3_storage.copy_object(template_asset["asset"], new_asset_key)

            # Create a new FileAsset object
            new_file_assets.append(
                FileAsset(
                    attributes=template_asset["attributes"],
                    asset=new_asset_key,
                    size=template_asset["size"],
                    user=request.user,
                    created_by=request.user,
                    entity_type=entity_type,
                    workspace_id=template_asset["workspace_id"],
                )
            )

        # Bulk create the new assets
        assets = FileAsset.objects.bulk_create(new_file_assets, ignore_conflicts=True)

        # Create the final mapping from template asset ID to new asset ID
        template_to_new_asset_id = {}

        # First, create a mapping from asset key to new asset ID
        asset_key_to_id = {asset.asset: asset.id for asset in assets}

        # Then, map template IDs to new asset IDs using the two mappings
        for template_id, asset_key in template_to_new_asset_key.items():
            if asset_key in asset_key_to_id:
                template_to_new_asset_id[template_id] = asset_key_to_id[asset_key]

        return Response(template_to_new_asset_id, status=status.HTTP_200_OK)
