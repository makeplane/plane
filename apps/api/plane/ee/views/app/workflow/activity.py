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

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkflowTransitionActivity
from plane.ee.serializers import WorkflowTransitionActivitySerializer
from plane.permissions import can, WorkflowPermissions
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

from rest_framework import status
from rest_framework.response import Response


class WorkflowActivityEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id, workflow_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        issue_activities = (
            WorkflowTransitionActivity.objects.filter(
                workspace__slug=slug, project_id=project_id, workflow_id=workflow_id
            )
            .filter(**filters)
            .select_related("actor", "workspace", "project")
        ).order_by("created_at")

        issue_activities = WorkflowTransitionActivitySerializer(issue_activities, many=True).data

        return Response(issue_activities, status=status.HTTP_200_OK)
