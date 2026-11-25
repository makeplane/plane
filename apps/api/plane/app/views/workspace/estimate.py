# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, WorkspaceEntityPermission
from plane.app.serializers import WorkspaceEstimateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Estimate, Project, ProjectMember, WorkspaceMember
from plane.utils.cache import cache_response


class WorkspaceEstimatesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        projects = Project.objects.filter(workspace__slug=slug, estimate__isnull=False)
        # Same visibility as the project list: admins see every project, members see
        # projects they belong to plus public ones, guests only projects they belong to
        role = (
            WorkspaceMember.objects.filter(workspace__slug=slug, member=request.user, is_active=True)
            .values_list("role", flat=True)
            .first()
        )
        if role != ROLE.ADMIN.value:
            member_projects = ProjectMember.objects.filter(workspace__slug=slug, member=request.user, is_active=True)
            visible = Q(id__in=member_projects.values("project_id"))
            if role == ROLE.MEMBER.value:
                visible |= Q(network=2)
            projects = projects.filter(visible)
        estimate_ids = projects.values_list("estimate_id", flat=True)
        estimates = (
            Estimate.objects.filter(pk__in=estimate_ids, workspace__slug=slug)
            .prefetch_related("points")
            .select_related("workspace", "project")
        )

        serializer = WorkspaceEstimateSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
