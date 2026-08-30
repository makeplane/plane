# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import WorkspaceViewerPermission
from plane.app.serializers import UserIssuePlanSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, UserIssuePlan


class WorkspaceUserIssuePlanEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def _get_issue(self, slug, issue_id):
        return Issue.issue_objects.get(
            id=issue_id,
            workspace__slug=slug,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )

    def patch(self, request, slug, issue_id):
        issue = self._get_issue(slug, issue_id)

        plan = UserIssuePlan.objects.filter(
            issue=issue,
            user=request.user,
            deleted_at__isnull=True,
        ).first()

        serializer = UserIssuePlanSerializer(
            plan,
            data=request.data,
            partial=True,
            context={"request": request, "issue": issue},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan = serializer.save()
        return Response(UserIssuePlanSerializer(plan, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, issue_id):
        issue = self._get_issue(slug, issue_id)

        plan = UserIssuePlan.objects.filter(
            issue=issue,
            user=request.user,
            deleted_at__isnull=True,
        ).first()

        if plan:
            plan.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
