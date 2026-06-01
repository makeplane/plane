# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from collections import defaultdict

from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssueWorkLog

from ._week import parse_week_start

# Belt-and-suspenders breadth cap. Breadth is already bounded by the user's own
# logged issues under one parent, so this only guards a pathological week.
MAX_CHILDREN = 200


class TimesheetSubIssuesEndpoint(BaseAPIView):
    """Lazy children for one timesheet row: the current user's logged sub-items.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/sub-issues/
        ?parent_id=<uuid>&week_start=YYYY-MM-DD   (week_start optional → current Monday)

    Returns only the sub-items of ``parent_id`` that the requesting user logged time
    on during the week — same predicate as the flat grid. No 0-minute placeholders.
    Serves both project and cross-workspace modes: the frontend calls it with each
    row's own ``workspace_slug`` + ``project_id``.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        parent_id = request.query_params.get("parent_id")
        if not parent_id:
            return Response({"error": "parent_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        # Reject malformed input before the ORM call — a non-UUID parent_id would
        # otherwise raise inside the query.
        try:
            uuid.UUID(str(parent_id))
        except (ValueError, TypeError):
            return Response({"error": "Invalid parent_id."}, status=status.HTTP_400_BAD_REQUEST)

        # parent_id is attacker-controlled; @allow_permission only scopes project_id
        # (the URL). Validate the parent lives in this project/workspace → 404 on
        # mismatch, so it can't be used to probe issues in other projects.
        get_object_or_404(
            Issue.issue_objects, pk=parent_id, project_id=project_id, workspace__slug=slug
        )

        week_start, week_end, err = parse_week_start(request.query_params.get("week_start"))
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        # The current user's worklogs for the week on direct children of this parent.
        child_worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
                issue__parent_id=parent_id,
            )
            .values("issue_id", "logged_at")
            .annotate(total=Sum("duration_minutes"))
        )

        child_ids = {w["issue_id"] for w in child_worklogs}
        if not child_ids:
            return Response({"rows": []}, status=status.HTTP_200_OK)

        # Grandchildren chevrons reuse the same "current user's logged children"
        # semantics so recursion stays consistent.
        grandchild_counts = dict(
            Issue.issue_objects.filter(parent_id__in=child_ids, issue_worklogs__logged_by=request.user)
            .filter(issue_worklogs__logged_at__range=[week_start, week_end])
            .values("parent_id")
            .annotate(c=Count("id", distinct=True))
            .values_list("parent_id", "c")
        )

        children = (
            Issue.issue_objects.filter(id__in=child_ids)
            .select_related("project", "workspace")
            .order_by("sequence_id")[:MAX_CHILDREN]
        )

        # Per-child daily map, keyed with the same construction as the flat grid
        # (DateField.isoformat() → "YYYY-MM-DD"), matching the frontend's week keys.
        issue_days = defaultdict(lambda: defaultdict(int))
        for w in child_worklogs:
            issue_days[str(w["issue_id"])][w["logged_at"].isoformat()] += w["total"]

        rows = []
        for child in children:
            iid = str(child.id)
            days = dict(issue_days.get(iid, {}))
            rows.append({
                "issue_id": iid,
                "issue_name": child.name,
                "issue_identifier": f"{child.project.identifier}-{child.sequence_id}",
                "project_id": str(child.project_id),
                "workspace_slug": child.workspace.slug,
                "workspace_name": child.workspace.name,
                "days": days,
                "total_minutes": sum(days.values()),
                "sub_issues_count": grandchild_counts.get(child.id, 0),
            })

        return Response({"rows": rows}, status=status.HTTP_200_OK)
