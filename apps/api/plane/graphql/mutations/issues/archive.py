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

# python imports
import json

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers.project import get_project
from plane.graphql.helpers.state import get_state
from plane.graphql.helpers.work_item import get_work_item
from plane.graphql.helpers.workspace import get_workspace_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.utils.archive import ArchivedFilterTypes


@strawberry.type
class WorkItemArchiveMutation:
    @strawberry.mutation(extensions=[PermissionExtension(permissions=[ProjectBasePermission()])])
    async def archive_work_item(
        self,
        info: Info,
        slug: str,
        project: str,
        work_item: str,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace_async(slug=slug)
        workspace_slug = workspace.slug

        project_details = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project_details.id)

        work_item_details = await get_work_item(
            workspace_slug=workspace_slug, project_id=project_id, work_item_id=work_item
        )
        work_item_id = str(work_item_details.id)
        work_item_state_id = str(work_item_details.state_id)

        state = await get_state(workspace_slug=workspace_slug, project_id=project_id, state_id=work_item_state_id)
        state_group = state.group

        if state_group not in ["completed", "cancelled"]:
            message = "Work item is not in a deletable state"
            error_extensions = {"code": "WORK_ITEM_NOT_DELETABLE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        archived_time = timezone.now().date()
        current_activity_payload = {
            "archived_at": None,
        }
        activity_data = {
            "archived_at": str(archived_time),
            "automation": False,
        }

        work_item_details.archived_at = archived_time
        await sync_to_async(work_item_details.save)()

        # Track the work item activity
        issue_activity.delay(
            type="issue.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=project_id,
            issue_id=work_item_id,
            actor_id=user_id,
            current_instance=json.dumps(current_activity_payload),
            requested_data=json.dumps(activity_data),
        )

        return True

    # adding issue comment version 2
    @strawberry.mutation(extensions=[PermissionExtension(permissions=[ProjectBasePermission()])])
    async def unarchive_work_item(
        self,
        info: Info,
        slug: str,
        project: str,
        work_item: str,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace_async(slug=slug)
        workspace_slug = workspace.slug

        project_details = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project_details.id)

        work_item_details = await get_work_item(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=work_item,
            filters={"archived_at__isnull": False},
            archived_filter=ArchivedFilterTypes.ONLY,
        )
        work_item_id = str(work_item_details.id)

        current_activity_payload = {
            "archived_at": str(work_item_details.archived_at),
        }
        activity_data = {
            "archived_at": None,
            "automation": False,
        }

        # Track the work item activity
        issue_activity.delay(
            type="issue.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=project_id,
            issue_id=work_item_id,
            actor_id=user_id,
            current_instance=json.dumps(current_activity_payload),
            requested_data=json.dumps(activity_data),
        )

        work_item_details.archived_at = None
        await sync_to_async(work_item_details.save)()

        return True
