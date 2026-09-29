# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§14 + §17.3 — per-issue property value endpoints.

Two write shapes:

1. ``POST /issues/:issue_id/property-values/bulk/`` — the canonical
   bulk-write entry point. Accepts ``{"values": [{property_id,
   value_json}, ...]}`` and applies them in a single transaction so
   the §30 P1.4 required-property check sees the post-write state.
2. ``POST /issues/:issue_id/property-values/`` — single-row write
   (still uses the same underlying service).

The composite payload endpoint
(``GET /issues/:issue_id/property-payload/``) feeds the §29.7 form
renderer / Work Item detail renderer that Pixel will build as a
follow-up child — see the issue body.

§18.1 permissions: reads are member-level; writes follow the existing
issue-write permission (``ROLE.ADMIN``/``ROLE.MEMBER``).
"""

# Python imports
import logging

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    IssuePropertyPayloadSerializer,
    IssuePropertyValueReadSerializer,
    IssuePropertyValueWriteSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import (
    Issue,
    IssuePropertyValue,
    Project,
    Workspace,
)

from plane.services.workflow_properties import (
    build_property_payload,
    persist_property_values,
)
from plane.services.workflow_properties.errors import WorkflowPropertyError

logger = logging.getLogger("plane.workflow")


def _get_issue(slug, project_id, issue_id):
    return (
        Issue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        )
        .select_related("project")
        .first()
    )


class IssuePropertyValueListEndpoint(BaseAPIView):
    """``GET``/``POST`` per-issue property values."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = _get_issue(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        values = (
            IssuePropertyValue.objects.filter(issue=issue, deleted_at__isnull=True)
            .select_related("property")
            .order_by("property__name")
        )
        return Response(
            IssuePropertyValueReadSerializer(values, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        issue = _get_issue(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssuePropertyValueWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            persist_property_values(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                actor_id=str(request.user.id) if request.user and request.user.id else None,
                values_by_property_id={
                    str(serializer.validated_data["property"].id): serializer.validated_data.get(
                        "value_json"
                    )
                },
            )
        except WorkflowPropertyError as exc:
            return Response(exc.to_payload(), status=exc.status_code)
        # Re-fetch and return the persisted row.
        row = (
            IssuePropertyValue.objects.filter(
                issue=issue,
                property=serializer.validated_data["property"],
                deleted_at__isnull=True,
            )
            .select_related("property")
            .first()
        )
        return Response(
            IssuePropertyValueReadSerializer(row).data,
            status=status.HTTP_201_CREATED,
        )


class IssuePropertyValueBulkEndpoint(BaseAPIView):
    """§17.3 — bulk write entry point.

    Accepts ``{"values": [{"property_id": "...", "value_json": ...},
    ...]}`` and applies them atomically.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        issue = _get_issue(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        values = request.data.get("values")
        if not isinstance(values, list):
            return Response(
                {"values": "Expected a list of {property_id, value_json}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        values_by_property_id = {}
        for entry in values:
            if not isinstance(entry, dict):
                return Response(
                    {"values": "Each entry must be a JSON object."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer = IssuePropertyValueWriteSerializer(data=entry)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            values_by_property_id[str(serializer.validated_data["property"].id)] = (
                serializer.validated_data.get("value_json")
            )

        try:
            persisted = persist_property_values(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                actor_id=str(request.user.id) if request.user and request.user.id else None,
                values_by_property_id=values_by_property_id,
            )
        except WorkflowPropertyError as exc:
            return Response(exc.to_payload(), status=exc.status_code)

        return Response(
            IssuePropertyValueReadSerializer(persisted, many=True).data,
            status=status.HTTP_200_OK,
        )


class IssuePropertyPayloadEndpoint(BaseAPIView):
    """§14 / §29.7 — composite payload for the form renderer.

    Returns one row per active property attached to the issue's
    type, in the order the Work Item detail renderer should show
    them. The renderer child (Pixel) consumes this shape.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = _get_issue(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        payload = build_property_payload(issue)
        return Response(
            IssuePropertyPayloadSerializer(payload, many=True).data,
            status=status.HTTP_200_OK,
        )
