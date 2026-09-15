# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Base view for the ``/api/research/`` namespace.

All research endpoints share three guarantees:

1. the deployment level switch is checked before anything else;
2. the workspace is resolved from the URL slug and the caller must be a
   non-guest member of it;
3. every failure returns the ``error_code`` / ``message`` envelope.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace, WorkspaceMember
from plane.research.utils.config import research_module_enabled
from plane.research.utils.errors import (
    ResearchErrorCode,
    ResearchAPIException,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import READABLE_WORKSPACE_ROLES
from plane.research.utils.settings import workspace_research_enabled, workspace_research_sections


def resolve_user(value):
    """Resolve a user reference from a UUID or an email address."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    queryset = User.objects.filter(is_active=True)
    if "@" in text:
        return queryset.filter(email__iexact=text).first()
    return queryset.filter(pk=text).first() if _is_uuid(text) else None


def _is_uuid(value):
    import uuid

    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def parse_date(value, field_name):
    """Parse an ISO date, returning ``(date, error_response)``."""
    if value in (None, ""):
        return None, None
    from django.core.exceptions import ValidationError
    from django.utils.dateparse import parse_date as django_parse_date

    if hasattr(value, "year") and hasattr(value, "month"):
        return value, None
    parsed = django_parse_date(str(value))
    if parsed is None:
        return None, research_error(
            ResearchErrorCode.ORG_MEMBER_INVALID,
            f"{field_name} must be an ISO date (YYYY-MM-DD).",
        )
    try:
        parsed.isoformat()
    except ValidationError:
        return None, research_error(
            ResearchErrorCode.ORG_MEMBER_INVALID,
            f"{field_name} must be an ISO date (YYYY-MM-DD).",
        )
    return parsed, None


def truthy(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


class ResearchAPIView(BaseAPIView):
    """Common behaviour for research endpoints."""

    def initial(self, request, *args, **kwargs):
        if not research_module_enabled():
            raise ResearchAPIException(
                ResearchErrorCode.MODULE_DISABLED,
                "Research module is not enabled.",
                status.HTTP_404_NOT_FOUND,
            )
        return super().initial(request, *args, **kwargs)

    def handle_exception(self, exc):
        if isinstance(exc, ResearchAPIException):
            return Response(
                {"error_code": exc.error_code, "message": exc.message_text},
                status=exc.status_code,
            )
        return super().handle_exception(exc)

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_workspace(self, roles=READABLE_WORKSPACE_ROLES, section=None, require_enabled=True):
        """Resolve the workspace and verify the caller's membership.

        Returns ``(workspace, error_response)`` with exactly one non-null side.
        """
        slug = self.workspace_slug
        if not slug:
            return None, research_not_found(
                ResearchErrorCode.WORKSPACE_NOT_FOUND,
                "Workspace not found.",
            )
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return None, research_not_found(
                ResearchErrorCode.WORKSPACE_NOT_FOUND,
                "Workspace not found.",
            )
        membership = WorkspaceMember.objects.filter(
            workspace=workspace,
            member=self.request.user,
            is_active=True,
        ).first()
        if membership is None:
            return None, research_not_found(
                ResearchErrorCode.WORKSPACE_NOT_FOUND,
                "Workspace not found.",
            )
        if roles is not None and membership.role not in roles:
            return None, research_permission_denied()
        if require_enabled:
            if not workspace_research_enabled(workspace):
                return None, research_error(
                    ResearchErrorCode.MODULE_NOT_ENABLED,
                    "The research module is not enabled for this workspace.",
                    status.HTTP_403_FORBIDDEN,
                )
            if section and not workspace_research_sections(workspace).get(section):
                return None, research_error(
                    ResearchErrorCode.SUBMODULE_DISABLED,
                    "This research section is not enabled for this workspace.",
                    status.HTTP_403_FORBIDDEN,
                )
        return workspace, None

    def today(self):
        return timezone.localdate()
