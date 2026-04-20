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

# Python imports

# Django imports
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.permissions import ProjectActivityPermissions, ProjectMemberActivityPermissions, can
from plane.ee.models import ProjectActivity, ProjectMemberActivity
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import ProjectActivitySerializer, ProjectMemberActivitySerializer


class ProjectActivityEndpoint(BaseAPIView):
    use_read_replica = True

    filterset_fields = {"created_at": ["gt", "gte", "lt", "lte"]}

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @method_decorator(gzip_page)
    @can(ProjectActivityPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        project_activities = ProjectActivity.objects.filter(project_id=project_id).filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        project_activities_queryset = (
            self.filter_queryset(project_activities)
            .select_related("actor", "workspace", "project")
            .accessible_to(request.user.id, slug)
        )

        project_activities = ProjectActivitySerializer(project_activities_queryset, many=True).data

        return Response(project_activities, status=status.HTTP_200_OK)


class ProjectMemberActivityEndpoint(BaseAPIView):
    use_read_replica = True

    filterset_fields = {"created_at": ["gt", "gte", "lt", "lte"]}

    @check_feature_flag(FeatureFlag.PROJECT_MEMBER_ACTIVITY)
    @can(ProjectMemberActivityPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        project_member_activities = ProjectMemberActivity.objects.filter(project_id=project_id, workspace__slug=slug)

        project_member_activities_queryset = (
            self.filter_queryset(project_member_activities)
            .select_related("project_member")
            .accessible_to(request.user.id, slug)
        )

        project_member_activities = ProjectMemberActivitySerializer(project_member_activities_queryset, many=True).data

        return Response(project_member_activities, status=status.HTTP_200_OK)
