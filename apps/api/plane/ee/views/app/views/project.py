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

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.permissions import can, WorkitemViewPermissions
from plane.app.serializers import IssueViewSerializer

from plane.db.models import IssueView
from plane.ee.views.base import BaseViewSet
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssueViewEEViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    @can(WorkitemViewPermissions.EDIT, resource_param="pk")
    def lock(self, request, slug, project_id, pk):
        issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug, project_id=project_id).first()

        issue_view.is_locked = True
        issue_view.save(update_fields=["is_locked"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(WorkitemViewPermissions.EDIT, resource_param="pk")
    def unlock(self, request, slug, project_id, pk):
        issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug, project_id=project_id).first()

        issue_view.is_locked = False
        issue_view.save(update_fields=["is_locked"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.VIEW_ACCESS_PRIVATE)
    @can(WorkitemViewPermissions.EDIT, resource_param="pk")
    def access(self, request, slug, project_id, pk):
        access = request.data.get("access", 1)

        issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug, project_id=project_id).first()

        if issue_view.owned_by != request.user:
            return Response(
                {"error": "Only the owner can change the access of the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        issue_view.access = access
        issue_view.save(update_fields=["access"])

        return Response(status=status.HTTP_204_NO_CONTENT)
