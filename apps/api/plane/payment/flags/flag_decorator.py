# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from enum import Enum
from functools import wraps

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response


class ErrorCodes(Enum):
    PAYMENT_REQUIRED = 1999


def check_feature_flag(feature_key, default_value=False):
    """EE feature gate. In this fork the billing subsystem is replaced by a
    single settings switch; every ported EE view routes through here."""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            if getattr(settings, "EE_FEATURES_ENABLED", False):
                return view_func(instance, request, *args, **kwargs)
            return Response(
                {"error": "Payment required", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return _wrapped_view

    return decorator
