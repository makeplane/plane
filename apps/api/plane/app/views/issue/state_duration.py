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

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.db.models import IssueActivity, Issue, Project, ProjectMember
from plane.ee.utils.check_user_teamspace_member import (
    check_if_current_user_is_teamspace_member,
)


class WorkItemStateDurationEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, work_item_id):
        # Get the work item to know its creation time and current state
        issue = (
            Issue.objects.filter(
                pk=work_item_id,
                project_id=project_id,
                workspace__slug=slug,
            )
            .select_related("state", "type")
            .first()
        )

        if not issue:
            return Response(
                {"error": "Work item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Guest access restrictions
        if ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            role=ROLE.GUEST.value,
            is_active=True,
        ).exists():
            # Guests cannot view epics
            if issue.type and issue.type.is_epic:
                return Response(
                    {"error": "You are not allowed to view this work item"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Guests can only view items they created unless guest_view_all_features is enabled
            project = Project.objects.get(pk=project_id)
            if (
                not project.guest_view_all_features
                and not issue.created_by_id == request.user.id
                and not check_if_current_user_is_teamspace_member(request.user.id, slug, project_id)
            ):
                return Response(
                    {"error": "You are not allowed to view this work item"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Get all state transition activities, ordered chronologically
        state_activities = list(
            IssueActivity.objects.filter(
                issue_id=work_item_id,
                workspace__slug=slug,
                field="state",
                verb="updated",
            )
            .select_related("actor", "workspace", "issue", "project")
            .order_by("created_at")
        )

        result = []

        if not state_activities:
            # No transitions — item has been in its current state since creation
            return Response(result, status=status.HTTP_200_OK)

        # Each activity represents a transition from old_value -> new_value.
        # Compute the duration spent in old_value (time between previous
        # boundary and this transition) and attach it to the activity.
        for i, activity in enumerate(state_activities):
            # Start boundary: issue creation for the first transition,
            # previous transition time for subsequent ones.
            start = issue.created_at if i == 0 else state_activities[i - 1].created_at
            duration = (activity.created_at - start).total_seconds()

            result.append(
                {
                    "id": str(activity.id),
                    "field": activity.field,
                    "verb": activity.verb,
                    "old_value": activity.old_value,
                    "new_value": activity.new_value,
                    "old_identifier": str(activity.old_identifier) if activity.old_identifier else None,
                    "new_identifier": str(activity.new_identifier) if activity.new_identifier else None,
                    "actor": str(activity.actor_id) if activity.actor_id else None,
                    "created_at": activity.created_at,
                    "duration_seconds": round(duration, 2),
                }
            )

        return Response(result, status=status.HTTP_200_OK)
