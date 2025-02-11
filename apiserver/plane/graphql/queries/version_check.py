# Third-Party Imports
import strawberry
import requests
from typing import Optional

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.conf import settings

# Strawberry Imports
from strawberry.types import Info

# Module Imports
from plane.graphql.permissions.public import public_query
from plane.graphql.types.version_check import VersionCheckType


# fetching the version check query
@sync_to_async
def get_version_check(platform: str, is_internal: Optional[bool] = False):
    url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/mobile-version/"
    headers = {
        "content-type": "application/json",
        "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
    }
    json = {"platform": platform, "is_internal": is_internal}
    response = requests.post(url, json=json, headers=headers)
    response.raise_for_status()
    return response.json()


@strawberry.type
class VersionCheckQuery:
    @strawberry.field
    @public_query()
    async def version_check(
        self, info: Info, platform: str, is_internal: Optional[bool] = False
    ) -> VersionCheckType:
        version_details = await get_version_check(platform, is_internal)
        return VersionCheckType(
            version=version_details["version"],
            min_supported_version=version_details["min_supported_version"],
            url=version_details["url"],
            force_update=version_details["force_update"],
            min_supported_backend_version=version_details[
                "min_backend_supported_version"
            ],
        )
