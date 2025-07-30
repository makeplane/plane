# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from openfeature.provider import AbstractProvider
from openfeature.provider.metadata import Metadata
from openfeature.flag_evaluation import FlagResolutionDetails

# Module imports
from plane.utils.exception_logger import log_exception


class FlagProvider(AbstractProvider):
    def get_metadata(self) -> Metadata:
        return Metadata(name="PlaneProvider")

    def make_request(self, slug, user_id, feature_key, default_value):
        # Make a request to the feature flag server to get the value of the feature flag
        if settings.FEATURE_FLAG_SERVER_BASE_URL:
            try:
                # Make a request to the feature flag server
                response = requests.post(
                    f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/",
                    headers={
                        "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
                        "Content-Type": "application/json",
                    },
                    json={
                        "workspace_slug": slug,
                        "user_id": str(user_id) if user_id else None,
                        "flag_key": feature_key,
                    },
                )
                # If the request is successful, return the value of the feature flag
                response.raise_for_status()
                # Get the value of the feature flag from the response
                resp = response.json()
                if resp.get("values"):
                    return resp.get("values").get(feature_key, default_value)
                return resp.get("value", default_value)
            # If the request fails, log the exception and return the default value
            except requests.exceptions.RequestException as e:
                log_exception(e)
                return default_value
        return default_value

    def resolve_boolean_details(self, flag_key, default_value, evaluation_context):
        # Get the targeting key and attributes from the evaluation context
        targeting_key = evaluation_context.targeting_key
        attributes = evaluation_context.attributes
        slug = attributes.get("slug")
        # Get the value of the feature flag
        value = self.make_request(
            user_id=targeting_key,
            slug=slug,
            feature_key=flag_key,
            default_value=default_value,
        )
        # Return the value of the feature flag
        return FlagResolutionDetails(value=value)

    def resolve_string_details(self, flag_key, default_value, evaluation_context):
        pass

    def resolve_integer_details(self, flag_key, default_value, evaluation_context):
        pass

    def resolve_float_details(self, flag_key, default_value, evaluation_context):
        pass

    def resolve_object_details(self, flag_key, default_value, evaluation_context):
        pass
