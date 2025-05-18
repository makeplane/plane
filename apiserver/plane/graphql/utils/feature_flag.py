# Python imports
import requests

# Django imports
from django.conf import settings

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.utils.exception_logger import log_exception


@sync_to_async
def validate_feature_flag(
    slug: str, user_id: str, feature_key: str, default_value: bool = False
):
    if (
        settings.FEATURE_FLAG_SERVER_BASE_URL
        and settings.FEATURE_FLAG_SERVER_AUTH_TOKEN
    ):
        try:
            url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
            json = {"workspace_slug": slug, "user_id": user_id, "flag_key": feature_key}
            headers = {
                "content-type": "application/json",
                "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
            }

            response = requests.post(url, json=json, headers=headers)
            response.raise_for_status()
            flag_response = response.json()

            if flag_response.get("values"):
                return flag_response.get("values").get(feature_key, default_value)
            return flag_response.get("value", default_value)

        except requests.exceptions.RequestException as e:
            log_exception(e)
            return default_value
    return default_value


def _validate_feature_flag(
    workspace_slug: str, user_id: str, feature_key: str, default_value: bool = False
):
    if (
        settings.FEATURE_FLAG_SERVER_BASE_URL
        and settings.FEATURE_FLAG_SERVER_AUTH_TOKEN
    ):
        try:
            url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
            json = {
                "workspace_slug": workspace_slug,
                "user_id": user_id,
                "flag_key": feature_key,
            }
            headers = {
                "content-type": "application/json",
                "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
            }

            response = requests.post(url, json=json, headers=headers)
            response.raise_for_status()
            flag_response = response.json()

            if flag_response.get("values"):
                return flag_response.get("values").get(feature_key, default_value)
            return flag_response.get("value", default_value)

        except requests.exceptions.RequestException as e:
            log_exception(e)
            return default_value
    return default_value
