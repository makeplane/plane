# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from drf_spectacular.utils import OpenApiRequest, OpenApiResponse

from plane.api.serializers import UserIssuePlanSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, UserIssuePlan
from plane.utils.openapi import (
    ISSUE_ID_PARAMETER,
    USER_ISSUE_PLAN_EXAMPLE,
    USER_ISSUE_PLAN_UPDATE_EXAMPLE,
    user_issue_plan_docs,
)

from .base import BaseAPIView


class UserIssuePlanAPIEndpoint(BaseAPIView):
    """Get, set, or clear the calling user's personal calendar schedule
    (date, time, and duration) for a work item."""

    permission_classes = [ProjectEntityPermission]
    serializer_class = UserIssuePlanSerializer
    use_read_replica = True

    def _get_issue(self, slug, project_id, issue_id):
        return Issue.issue_objects.get(
            id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )

    def _get_plan(self, issue):
        return UserIssuePlan.objects.filter(
            issue=issue,
            user=self.request.user,
            deleted_at__isnull=True,
        ).first()

    @user_issue_plan_docs(
        operation_id="retrieve_work_item_user_plan",
        description="Retrieve the calling user's personal calendar schedule for a work item.",
        parameters=[ISSUE_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Work item schedule",
                response=UserIssuePlanSerializer,
                examples=[USER_ISSUE_PLAN_EXAMPLE],
            ),
            404: OpenApiResponse(description="Work item not scheduled, or work item not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """Retrieve work item schedule

        Retrieve the calling user's personal calendar schedule for a work item.
        """
        issue = self._get_issue(slug, project_id, issue_id)
        plan = self._get_plan(issue)
        if plan is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(UserIssuePlanSerializer(plan).data, status=status.HTTP_200_OK)

    @user_issue_plan_docs(
        operation_id="update_work_item_user_plan",
        description="Schedule a work item onto the calling user's calendar, or update the existing schedule's date, time, or duration.",  # noqa: E501
        parameters=[ISSUE_ID_PARAMETER],
        request=OpenApiRequest(
            request=UserIssuePlanSerializer,
            examples=[USER_ISSUE_PLAN_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Work item scheduled successfully",
                response=UserIssuePlanSerializer,
                examples=[USER_ISSUE_PLAN_EXAMPLE],
            ),
        },
    )
    def patch(self, request, slug, project_id, issue_id):
        """Update work item schedule

        Schedule a work item onto the calling user's calendar, or update the
        existing schedule's date, time, or duration.
        """
        issue = self._get_issue(slug, project_id, issue_id)
        plan = self._get_plan(issue)

        serializer = UserIssuePlanSerializer(
            plan,
            data=request.data,
            partial=True,
            context={"request": request, "issue": issue},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan = serializer.save()
        return Response(UserIssuePlanSerializer(plan).data, status=status.HTTP_200_OK)

    @user_issue_plan_docs(
        operation_id="delete_work_item_user_plan",
        description="Remove the calling user's personal calendar schedule for a work item.",
        parameters=[ISSUE_ID_PARAMETER],
        responses={
            204: OpenApiResponse(description="Work item schedule removed successfully"),
        },
    )
    def delete(self, request, slug, project_id, issue_id):
        """Delete work item schedule

        Remove the calling user's personal calendar schedule for a work item.
        """
        issue = self._get_issue(slug, project_id, issue_id)
        plan = self._get_plan(issue)
        if plan:
            plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
