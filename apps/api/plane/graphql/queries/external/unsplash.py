# Third-Party Imports
import strawberry
import requests
import os

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from typing import Optional
from django.conf import settings

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.external import UnsplashImagesInfo, UnsplashImages
from plane.license.models import InstanceConfiguration
from plane.license.utils.encryption import decrypt_data


@sync_to_async
def get_instance_configuration():
    return list(InstanceConfiguration.objects.values("key", "value", "is_encrypted"))


async def get_configuration_value(keys):
    environment_list = []
    if settings.SKIP_ENV_VAR:
        # Get the configurations
        instance_configuration = await get_instance_configuration()
        for key in keys:
            for item in instance_configuration:
                if key.get("key") == item.get("key"):
                    if item.get("is_encrypted", False):
                        environment_list.append(
                            await sync_to_async(decrypt_data(item.get("value")))
                        )
                    else:
                        environment_list.append(item.get("value"))
                    break
            else:
                environment_list.append(key.get("default"))
    else:
        # Get the configuration from os
        for key in keys:
            environment_list.append(os.environ.get(key.get("key"), key.get("default")))

    return tuple(environment_list)


@sync_to_async
def unsplash_request(url, headers):
    return requests.get(url, headers=headers)


@strawberry.type
class UnsplashImagesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def unsplash_images(
        self,
        slug: str,
        info: Info,
        page: Optional[int] = 1,
        per_page: Optional[int] = 20,
        query: Optional[str] = None,
    ) -> UnsplashImages:
        (UNSPLASH_ACCESS_KEY,) = await get_configuration_value(
            [
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY"),
                }
            ]
        )

        # Check unsplash access key
        if not UNSPLASH_ACCESS_KEY:
            return UnsplashImages(total=None, total_pages=None, urls=[])

        # construct the unsplash url and headers
        unsplash_url = (
            f"https://api.unsplash.com/search/photos/?client_id={UNSPLASH_ACCESS_KEY}&query={query}&page=${page}&per_page={per_page}"
            if query
            else f"https://api.unsplash.com/photos/?client_id={UNSPLASH_ACCESS_KEY}&page={page}&per_page={per_page}"
        )
        unsplash_headers = {"Content-Type": "application/json"}

        # make a request to unsplash api
        unsplash_response = await unsplash_request(unsplash_url, unsplash_headers)
        unsplash_response_data = unsplash_response.json()

        total = None
        total_pages = None
        if query is not None:
            total = unsplash_response_data.get("total")
            total_pages = unsplash_response_data.get("total_pages")
            unsplash_response_data = unsplash_response_data.get("results")

        unsplash_data = list()
        for data in unsplash_response_data:
            unsplash_data.append(
                UnsplashImagesInfo(
                    raw=data.get("urls").get("raw"),
                    full=data.get("urls").get("full"),
                    regular=data.get("urls").get("regular"),
                    small=data.get("urls").get("small"),
                    thumb=data.get("urls").get("thumb"),
                    small_s3=data.get("urls").get("small_s3"),
                )
            )

        return UnsplashImages(total=total, total_pages=total_pages, urls=unsplash_data)
