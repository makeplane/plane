# Python Imports
import requests

# Django Imports
from django.conf import settings

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.workspace import WorkspaceLicenseType
from plane.graphql.utils.workspace_license import resync_workspace_license
from plane.utils.exception_logger import log_exception


@strawberry.type
class WorkspaceLicenseQuery:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspaceLicense(self, info: Info, slug: str) -> WorkspaceLicenseType:
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                # Resync the workspace license
                response = await sync_to_async(resync_workspace_license)(
                    workspace_slug=slug
                )
                return WorkspaceLicenseType(**response)

            else:
                return {"status": "error", "error": "error fetching product details"}
        except requests.exceptions.RequestException as e:
            log_exception(e)
            return {"status": "error", "error": str(e)}
