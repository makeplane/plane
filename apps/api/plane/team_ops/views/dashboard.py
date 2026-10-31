# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.dashboard import MAX_DASHBOARD_DAYS, build_dashboard
from plane.team_ops.services.date_params import parse_day_range
from plane.team_ops.services.team_view import visible_people


class DashboardEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """The management dashboard for the people the caller may see (`team`, `project` and `user` narrow it)."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.can_view_team:
            return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)
        params = request.query_params
        start, end = parse_day_range(params, require=True, max_days=MAX_DASHBOARD_DAYS)
        people = visible_people(access, workspace, params)
        data = build_dashboard(workspace, access.settings, people, start, end, request.user.user_timezone)
        return Response({"from": start, "to": end, **data}, status=status.HTTP_200_OK)
