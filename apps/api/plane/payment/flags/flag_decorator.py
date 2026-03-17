# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from functools import wraps
from enum import Enum
import requests

# Django imports
from django.conf import settings

# Third party imports
import openfeature.api
from openfeature.evaluation_context import EvaluationContext

from rest_framework import status
from rest_framework.response import Response

# Module imports
from .provider import FlagProvider
from plane.utils.cache import cache_function_result
from plane.db.models.user import User
from plane.utils.exception_logger import log_exception


class ErrorCodes(Enum):
    PAYMENT_REQUIRED = 1999


def check_feature_flag(feature_key, default_value=False):
    """decorator to feature flag"""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Function to generate cache key
            openfeature.api.set_provider(FlagProvider())
            client = openfeature.api.get_client()
            user_id = str(request.user.id)
            if request.user.is_bot:
                user_id = None
            if client.get_boolean_value(
                flag_key=feature_key.value,
                default_value=default_value,
                evaluation_context=EvaluationContext(user_id, {"slug": kwargs.get("slug")}),
            ):
                response = view_func(instance, request, *args, **kwargs)
            else:
                response = Response(
                    {
                        "error": "Payment required",
                        "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
            return response

        return _wrapped_view

    return decorator


@cache_function_result(timeout=300, key_prefix="workspace_feature_flag")
def check_workspace_feature_flag(feature_key, slug, user_id=None, default_value=False) -> bool:
    """Function to check workspace feature flag"""
    # Function to generate cache key
    openfeature.api.set_provider(FlagProvider())
    client = openfeature.api.get_client()

    if user_id and User.objects.filter(id=user_id, is_bot=True).exists():
        user_id = None

    # Function to check if the feature flag is enabled
    flag = client.get_boolean_value(
        flag_key=feature_key.value,
        default_value=default_value,
        evaluation_context=EvaluationContext(user_id, {"slug": slug}),
    )
    # Return the flag
    return flag


@cache_function_result(timeout=300, key_prefix="workspace_feature_flags")
def get_all_workspace_feature_flags(slug) -> dict:
    """Function to get all feature flags for a workspace"""
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
                },
            )
            # If the request is successful, return all the feature flags
            response.raise_for_status()
            # Get all the feature flags from the response
            resp = response.json()
            return resp.get("values", {})
        # If the request fails, log the exception and return the default value
        except requests.exceptions.RequestException as e:
            log_exception(e)
            return {}
    return {}


# Admin feature flag checks
def check_admin_feature_flag(feature_key, default_value=False):
    """decorator to check admin feature flag"""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            try:
                if not settings.FEATURE_FLAG_SERVER_BASE_URL:
                    raise ValueError("FEATURE_FLAG_SERVER_BASE_URL is not configured")

                # Fetch from the feature flag server
                url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/workspaces/licenses/"
                headers = {
                    "content-type": "application/json",
                    "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
                }

                response = requests.post(url, headers=headers, timeout=10)
                response.raise_for_status()

                values = response.json().get("values", {})

                is_enabled = values.get(feature_key.value, default_value)
            except (requests.exceptions.RequestException, ValueError, TypeError, KeyError) as e:
                log_exception(e)
                is_enabled = default_value

            if is_enabled:
                return view_func(instance, request, *args, **kwargs)
            else:
                return Response(
                    {"error": "Feature not available", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

        return _wrapped_view

    return decorator
