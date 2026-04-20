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
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import Issue, IssueType
from plane.permissions import permission_engine, WorkitemPermissions, EpicPermissions, PermissionContext
from plane.bgtasks.issue_activities_task import issue_activity


class IssueConvertEndpoint(BaseAPIView):
    def post(self, request, slug, project_id: str, entity_id: str):
        conversion_type = request.data.get("conversion_type")

        issue = Issue.objects.get(id=entity_id, project_id=project_id)

        # Check workitem:edit permission
        has_edit = permission_engine.check(
            user=request.user,
            permission=WorkitemPermissions.EDIT,
            context=PermissionContext.resource(
                scope_id=str(entity_id),
                workspace_id=request.workspace_id,
                project_id=str(project_id),
            ),
        )
        if not has_edit:
            raise PermissionDenied(
                "You do not have permission to convert this work item."
            )

        # If the issue is currently an epic, also check epic:edit
        if issue.type and issue.type.is_epic:
            has_epic_edit = permission_engine.check(
                user=request.user,
                permission=EpicPermissions.EDIT,
                context=PermissionContext.resource(
                    scope_id=str(entity_id),
                    workspace_id=request.workspace_id,
                    project_id=str(project_id),
                ),
            )
            if not has_epic_edit:
                raise PermissionDenied(
                    "You do not have permission to convert this epic."
                )

        if issue.archived_at is not None:
            return Response(
                {"error": "Archived work items cannot be converted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if conversion_type == "epic":
            issue_type = IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=True,
                level=1,
                is_active=True,
            ).first()

            if issue_type is None:
                return Response(
                    {"error": "Epic is not enabled for this project"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Set the issue type id to the issue type id of the epic
            issue.type_id = issue_type.id

            # Delete the issue cycle and issue module of the issue
            issue.issue_cycle.all().delete()
            issue.issue_module.all().delete()

            # Set the parent id to None if it exists
            if issue.parent_id is not None:
                issue.parent_id = None

            issue.save()

            # Create the issue activity
            issue_activity.delay(
                type="epic.activity.converted",
                issue_id=issue.id,
                project_id=issue.project_id,
                actor_id=request.user.id,
                requested_data=None,
                epoch=int(timezone.now().timestamp()),
                current_instance=None,
            )

        elif conversion_type == "work_item":
            issue.type_id = None
            issue.save()

            # Create the issue activity
            issue_activity.delay(
                type="work_item.activity.converted",
                issue_id=issue.id,
                project_id=issue.project_id,
                actor_id=request.user.id,
                requested_data=None,
                epoch=int(timezone.now().timestamp()),
                current_instance=None,
            )

        return Response({"message": "Converted Successfully"}, status=status.HTTP_200_OK)
