# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import IssueType, ProjectIssueType
from plane.permissions import can, WorkspacePermissions, EpicPermissions
from plane.ee.serializers import EpicTypeSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkspaceEpicTypeEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.EPICS)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # Get all epics for the workspace
        epics = (
            IssueType.objects.filter(
                workspace__slug=slug,
                is_epic=True,
            )
            .accessible_to(request.user.id, slug)
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(
                            project_issue_types__deleted_at__isnull=True,
                            project_issue_types__project_id__isnull=False,
                        ),
                    ),
                    [],
                )
            )
        ).order_by("created_at")
        serializer = EpicTypeSerializer(epics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectEpicTypeEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.EPICS)
    @can(EpicPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        # Get all epics for the project
        epics = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=True,
            ).annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).order_by("created_at")

        serializer = EpicTypeSerializer(epics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
