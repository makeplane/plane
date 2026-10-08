# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from uuid import UUID

# Django imports
from django.utils import timezone
from django.utils.dateparse import parse_date

# Third party imports
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView

from ..access import TimeTrackingAccess
from ..serializers import TimeEntrySerializer
from ..services import TimeTrackingError, forbidden

ENTRY_RELATIONS = ("project", "issue", "issue__state")


class TimeTrackingBaseView(BaseAPIView):
    """Session auth, the requester's timezone, and the time tracking error format."""

    def handle_exception(self, exc):
        if isinstance(exc, TimeTrackingError):
            return Response(exc.as_data(), status=exc.status)
        return super().handle_exception(exc)

    def get_access(self, request, slug) -> TimeTrackingAccess:
        access = TimeTrackingAccess(request.user, slug)
        if not access.can_view():
            raise forbidden("You don't have access to time tracking in this workspace.")
        return access

    def serialize(self, entries, access, many=False):
        return TimeEntrySerializer(entries, many=many, context={"access": access}).data


def server_now():
    return timezone.now().isoformat().replace("+00:00", "Z")


def not_found(message="Not found."):
    return TimeTrackingError("NOT_FOUND", message, status=404)


def parse_date_param(params, name, required=False):
    value = params.get(name)
    if not value:
        if required:
            raise TimeTrackingError("VALIDATION_ERROR", f"{name} is required.", field=name)
        return None
    try:
        parsed = parse_date(value)
    except ValueError:
        parsed = None
    if parsed is None:
        raise TimeTrackingError("VALIDATION_ERROR", f"{name} must be a date (YYYY-MM-DD).", field=name)
    return parsed


def parse_uuid_param(params, name):
    value = params.get(name)
    if not value:
        return None
    try:
        return UUID(str(value))
    except ValueError:
        raise TimeTrackingError("VALIDATION_ERROR", f"{name} must be a UUID.", field=name)


def parse_bool_param(params, name, default):
    value = params.get(name)
    if value is None or value == "":
        return default
    return str(value).lower() in ("true", "1", "yes")
