# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging

from django.db.models import Prefetch
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import Project, ProjectMember
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)


class InstanceWorkspaceProjectBulkExportEndpoint(BaseAPIView):
    """Export projects as JSON matching the bulk-import template format.

    GET /api/instances/bulk-export-projects/
    Query params:
      workspace_slugs (optional): comma-separated slugs to filter.
                                   Omit to export all workspaces.
    Returns: { "projects": [{ workspace_slug, name, description, network,
                               project_leader, members, member_roles }] }
    """

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        slugs_param = request.query_params.get("workspace_slugs", "").strip()

        qs = Project.objects.select_related("workspace", "project_lead").prefetch_related(
            Prefetch(
                "project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True).select_related("member"),
                to_attr="active_members",
            )
        )

        if slugs_param:
            slugs = [s.strip() for s in slugs_param.split(",") if s.strip()]
            qs = qs.filter(workspace__slug__in=slugs)

        projects = []
        for project in qs.order_by("workspace__slug", "name"):
            members_with_roles = [
                (pm.member.email, pm.role)
                for pm in project.active_members
                if project.project_lead_id is None or pm.member_id != project.project_lead_id
            ]

            projects.append({
                "workspace_slug": project.workspace.slug,
                "name": project.name,
                "identifier": project.identifier,
                "description": project.description or "",
                "network": project.network,
                "project_leader": project.project_lead.email if project.project_lead else "",
                "members": ",".join(email for email, _ in members_with_roles),
                "member_roles": ",".join(str(role) for _, role in members_with_roles),
            })

        return Response({"projects": projects}, status=status.HTTP_200_OK)
