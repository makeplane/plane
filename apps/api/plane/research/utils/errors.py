# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Uniform error envelope for the research namespace.

Every research response that fails a rule check carries ``error_code`` and
``message`` so the frontend can map failures to localised copy.
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response


class ResearchAPIException(APIException):
    """Raised before DRF finalises the response (e.g. inside ``initial()``).

    Views returned from ``dispatch`` are not finalised by DRF, so early exits
    must go through the exception path; ``ResearchAPIView.handle_exception``
    turns this back into the standard envelope.
    """

    def __init__(self, error_code, message, http_status=status.HTTP_400_BAD_REQUEST):
        self.error_code = error_code
        self.message_text = message
        self.status_code = http_status
        super().__init__(detail=message)


class ResearchErrorCode:
    MODULE_DISABLED = "research_module_disabled"
    MODULE_NOT_ENABLED = "research_module_not_enabled"
    SUBMODULE_DISABLED = "research_submodule_disabled"
    WORKSPACE_NOT_FOUND = "research_workspace_not_found"
    PERMISSION_DENIED = "research_permission_denied"

    ORG_UNIT_NOT_FOUND = "org_unit_not_found"
    ORG_UNIT_CYCLE_DETECTED = "org_unit_cycle_detected"
    ORG_UNIT_DUPLICATE_NAME = "org_unit_duplicate_name"
    ORG_UNIT_ROOT_EXISTS = "org_unit_root_exists"
    ORG_UNIT_ROOT_REQUIRED = "org_unit_root_required"
    ORG_UNIT_PARENT_INVALID = "org_unit_parent_invalid"
    ORG_UNIT_ROOT_UNDELETABLE = "org_unit_root_undeletable"
    ORG_UNIT_HAS_CHILDREN = "org_unit_has_children"
    ORG_UNIT_TYPE_INVALID = "org_unit_type_invalid"

    ORG_MEMBER_NOT_FOUND = "org_member_not_found"
    ORG_MEMBER_EXISTS = "org_member_exists"
    ORG_MEMBER_INVALID = "org_member_invalid"
    ORG_MEMBER_PRIMARY_CONFLICT = "org_member_primary_conflict"

    MENTOR_BINDING_NOT_FOUND = "mentor_binding_not_found"
    MENTOR_BINDING_EXISTS = "mentor_binding_exists"
    MENTOR_BINDING_INVALID = "mentor_binding_invalid"

    USER_NOT_FOUND = "research_user_not_found"


def research_error(error_code, message, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error_code": error_code, "message": message}, status=http_status)


def research_permission_denied(message="You don't have the required permissions."):
    return research_error(
        ResearchErrorCode.PERMISSION_DENIED,
        message,
        status.HTTP_403_FORBIDDEN,
    )


def research_not_found(error_code, message):
    return research_error(error_code, message, status.HTTP_404_NOT_FOUND)


def research_conflict(error_code, message):
    return research_error(error_code, message, status.HTTP_409_CONFLICT)
