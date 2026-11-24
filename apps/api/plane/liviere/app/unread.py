# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# "New" work items for the web app (session authentication only, so reading a work item with an API key
# never marks it as opened). See plane/liviere/unread/queries.py.

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.liviere.unread.queries import (
    InvalidParams,
    count_new_work_items,
    mark_all_read,
    new_work_items,
    parse_before,
    parse_older_than,
    parse_per_page,
    parse_project_ids,
    record_open,
    serialize_work_items,
    visible_work_item,
)

WORKSPACE_ROLES = [ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST]


def bad_request(error):
    return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)


def workspace_id(slug):
    return Workspace.objects.filter(slug=slug).values_list("id", flat=True).first()


class NewWorkItemsEndpoint(BaseAPIView):
    """Newest first. Pages by `older_than` + `older_than_id` (created_at and id of the last item) instead of an
    offset, so work items opened while the list is shown do not shift the next page."""

    @allow_permission(WORKSPACE_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        as_of = timezone.now()
        try:
            project_ids = parse_project_ids(request.GET.get("projects"))
            older_than = parse_older_than(request.GET.get("older_than"), request.GET.get("older_than_id"))
            per_page = parse_per_page(request.GET.get("per_page"))
        except InvalidParams as e:
            return bad_request(e)
        items = new_work_items(request.user, workspace_id(slug), project_ids, before=as_of)
        if older_than is not None:
            items = items.filter(older_than)
        page = list(
            items.select_related("project", "state", "created_by").order_by("-created_at", "-id")[: per_page + 1]
        )
        return Response(
            {
                "results": serialize_work_items(page[:per_page]),
                "has_more": len(page) > per_page,
                "as_of": as_of.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class NewWorkItemsCountEndpoint(BaseAPIView):
    @allow_permission(WORKSPACE_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        as_of = timezone.now()
        try:
            project_ids = parse_project_ids(request.GET.get("projects"))
        except InvalidParams as e:
            return bad_request(e)
        counts = count_new_work_items(request.user, workspace_id(slug), project_ids)
        return Response({**counts, "as_of": as_of.isoformat()}, status=status.HTTP_200_OK)


class NewWorkItemsMarkReadEndpoint(BaseAPIView):
    @allow_permission(WORKSPACE_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        try:
            project_ids = parse_project_ids(request.data.get("project_ids"))
            before = parse_before(request.data.get("before"))
        except InvalidParams as e:
            return bad_request(e)
        cleared = mark_all_read(request.user, workspace_id(slug), before, project_ids)
        return Response({"cleared": cleared}, status=status.HTTP_200_OK)


class WorkItemOpenedEndpoint(BaseAPIView):
    @allow_permission(WORKSPACE_ROLES)
    def post(self, request, slug, project_id, issue_id):
        issue = visible_work_item(request.user, project_id, issue_id)
        if issue is None:
            return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)
        record_open(request.user, issue)
        return Response(status=status.HTTP_204_NO_CONTENT)
