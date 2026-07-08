# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.http import QueryDict

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Issue, IssueType

from ..issue.base import (
    IssueDetailEndpoint,
    IssueListEndpoint,
    IssuePaginatedViewSet,
    IssueViewSet,
)
from ..issue.sub_issue import SubIssuesEndpoint


def get_project_epic_type(project_id):
    """Return the active epic work item type seeded for the project, if any."""
    return IssueType.objects.filter(project_issue_types__project_id=project_id, is_epic=True, is_active=True).first()


class EpicViewSet(IssueViewSet):
    """CRUD over epics — work items whose type is the project's epic type.

    Everything is inherited from ``IssueViewSet``: the ``is_epic`` flag scopes the
    listing to epics, while create/update force the epic type and refuse hierarchy
    fields so an epic can never be nested.
    """

    is_epic = True

    def _epic_exists(self, slug, project_id, pk):
        return Issue.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk, type__is_epic=True).exists()

    def _clean_payload(self, request, epic_type=None):
        """Strip hierarchy and type fields from the payload.

        Returns an error response when a parent is explicitly requested,
        otherwise mutates the request payload in place and returns None.
        """
        data = request.data
        if isinstance(data, QueryDict):
            data = data.dict()
            request._full_data = data
        if data.get("parent") or data.get("parent_id"):
            return Response(
                {"error": "An epic cannot have a parent"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data.pop("parent", None)
        data.pop("parent_id", None)
        data.pop("type", None)
        # epics carry no estimate/cycle/module — never let the client set them
        data.pop("estimate_point", None)
        if epic_type is not None:
            data["type_id"] = str(epic_type.id)
        else:
            data.pop("type_id", None)
        return None

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        epic_type = get_project_epic_type(project_id)
        if epic_type is None:
            return Response(
                {"error": "Epics are not enabled for this project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        error = self._clean_payload(request, epic_type=epic_type)
        if error is not None:
            return error
        # Keyword arguments are required — the allow_permission decorator of the
        # parent method reads the url parameters from kwargs
        return super().create(request, slug=slug, project_id=project_id)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue)
    def retrieve(self, request, slug, project_id, pk=None):
        if not self._epic_exists(slug, project_id, pk):
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return super().retrieve(request, slug=slug, project_id=project_id, pk=pk)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
    def partial_update(self, request, slug, project_id, pk=None):
        if not self._epic_exists(slug, project_id, pk):
            return Response({"error": "Epic not found"}, status=status.HTTP_404_NOT_FOUND)
        error = self._clean_payload(request)
        if error is not None:
            return error
        return super().partial_update(request, slug=slug, project_id=project_id, pk=pk)

    @allow_permission([ROLE.ADMIN], creator=True, model=Issue)
    def destroy(self, request, slug, project_id, pk=None):
        if not self._epic_exists(slug, project_id, pk):
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return super().destroy(request, slug=slug, project_id=project_id, pk=pk)


class EpicListEndpoint(IssueListEndpoint):
    """Bulk retrieve epics by ids — mirrors ``IssueListEndpoint`` scoped to epics."""

    is_epic = True


class EpicDetailEndpoint(IssueDetailEndpoint):
    """Rich paginated epic listing — mirrors ``IssueDetailEndpoint`` scoped to epics."""

    is_epic = True


class EpicPaginatedViewSet(IssuePaginatedViewSet):
    """V2 paginated epic listing — mirrors ``IssuePaginatedViewSet`` scoped to epics."""

    is_epic = True


class EpicIssuesEndpoint(SubIssuesEndpoint):
    """Work items attached to an epic — mirrors ``SubIssuesEndpoint`` on parent_id=epic_id.

    GET returns the epic children with the standard annotations and the
    ``state_distribution`` per state group; POST attaches work items in bulk with
    the epic-specific guards (same project, no epic children, valid epic target).
    """

    def _get_epic(self, slug, project_id, issue_id):
        return Issue.issue_objects.filter(
            pk=issue_id, workspace__slug=slug, project_id=project_id, type__is_epic=True
        ).first()

    def get(self, request, slug, project_id, issue_id):
        if self._get_epic(slug, project_id, issue_id) is None:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return super().get(request, slug=slug, project_id=project_id, issue_id=issue_id)

    def post(self, request, slug, project_id, issue_id):
        if self._get_epic(slug, project_id, issue_id) is None:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        sub_issue_ids = request.data.get("sub_issue_ids", [])
        if not len(sub_issue_ids):
            return Response(
                {"error": "Sub Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.issue_objects.filter(id__in=sub_issue_ids, workspace__slug=slug)

        # Epics can never be nested under another epic
        if issues.filter(type__is_epic=True).exists():
            return Response(
                {"error": "An epic cannot be added as a work item of another epic"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # All the work items must belong to the same project as the epic
        if issues.filter(project_id=project_id).count() != len({str(sub_issue_id) for sub_issue_id in sub_issue_ids}):
            return Response(
                {"error": "The work items must belong to the same project as the epic"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().post(request, slug=slug, project_id=project_id, issue_id=issue_id)
