# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, time

# Django imports
from django.utils import timezone as django_timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import ResearchAuditEvent
from plane.research.serializers import ResearchAuditEventSerializer
from plane.research.utils.errors import ResearchErrorCode, research_error, research_permission_denied
from plane.research.utils.org import is_workspace_admin
from plane.research.views.base import ResearchAPIView


def parse_boundary(value, end_of_day=False):
    """Parse an ISO date into a timezone aware boundary, or return None."""
    if not value:
        return None
    try:
        parsed = datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return "invalid"
    moment = datetime.combine(parsed, time.max if end_of_day else time.min)
    return django_timezone.make_aware(moment, django_timezone.get_current_timezone())


class ResearchAuditEventListEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/audit-events/`` (admin, read only).

    The audit trail deliberately exposes no update or delete endpoint
    (P0-AUD-02, P0-AUD-05).
    """

    def get(self, request, slug):
        workspace, error = self.get_workspace(require_enabled=False)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()

        queryset = ResearchAuditEvent.objects.filter(workspace=workspace).select_related("actor", "org_unit")
        if request.GET.get("action"):
            queryset = queryset.filter(action=request.GET["action"])
        if request.GET.get("actor"):
            queryset = queryset.filter(actor_id=request.GET["actor"])
        if request.GET.get("resource_type"):
            queryset = queryset.filter(resource_type=request.GET["resource_type"])
        if request.GET.get("resource_id"):
            queryset = queryset.filter(resource_id=request.GET["resource_id"])
        if request.GET.get("org_unit"):
            queryset = queryset.filter(org_unit_id=request.GET["org_unit"])

        start = parse_boundary(request.GET.get("from"))
        if start == "invalid":
            return research_error(ResearchErrorCode.ORG_MEMBER_INVALID, "from must be an ISO date.")
        if start:
            queryset = queryset.filter(created_at__gte=start)
        end = parse_boundary(request.GET.get("to"), end_of_day=True)
        if end == "invalid":
            return research_error(ResearchErrorCode.ORG_MEMBER_INVALID, "to must be an ISO date.")
        if end:
            queryset = queryset.filter(created_at__lte=end)

        queryset = queryset.order_by("-created_at")
        try:
            per_page = min(int(request.GET.get("per_page", 100) or 100), 500)
        except ValueError:
            per_page = 100
        try:
            offset = max(int(request.GET.get("offset", 0) or 0), 0)
        except ValueError:
            offset = 0

        total = queryset.count()
        data = list(queryset[offset : offset + per_page])
        return Response(
            {
                "results": ResearchAuditEventSerializer(data, many=True).data,
                "count": len(data),
                "total": total,
                "offset": offset,
                "per_page": per_page,
            },
            status=status.HTTP_200_OK,
        )
