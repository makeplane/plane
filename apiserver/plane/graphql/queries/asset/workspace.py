# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import FileAsset
from plane.settings.storage import S3Storage


@sync_to_async
def get_asset(slug: str, asset_id: strawberry.ID):
    return FileAsset.objects.get(workspace__slug=slug, id=asset_id)


@strawberry.type
class WorkspaceAssetQuery:
    # asset entity create
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspace_asset(
        self, info: Info, slug: str, asset_id: strawberry.ID
    ) -> str:
        # get the asset id
        asset = await get_asset(slug=slug, asset_id=asset_id)

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            message = "The requested asset is not uploaded yet."
            error_extensions = {"code": "ASSET_NOT_FOUND", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # Get the presigned URL
        storage = S3Storage(request=info.context["request"])

        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(
            object_name=asset.asset.name,
            disposition="attachment",
            filename=asset.attributes.get("name"),
        )

        # Redirect to the signed URL
        return signed_url
