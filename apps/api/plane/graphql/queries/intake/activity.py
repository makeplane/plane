# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import IssueActivity
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_workspace,
    get_project,
    is_project_intakes_enabled_async,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.intake.activity import IntakeWorkItemPropertyActivityType


@strawberry.type
class IntakeWorkItemActivityQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def intake_work_item_activities(
        self, info: Info, slug: str, project: str, intake_work_item: str
    ) -> list[IntakeWorkItemPropertyActivityType]:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        intake_work_item_id = str(intake_work_item.issue_id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        intake_work_item_activities = await sync_to_async(list)(
            IssueActivity.objects.filter(workspace__slug=slug)
            .filter(project_teamspace_filter.query)
            .distinct()
            .filter(project__id=project)
            .filter(issue_id=intake_work_item_id)
            .filter(deleted_at__isnull=True)
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            )
            .select_related("actor", "workspace", "issue", "project")
            .order_by("created_at")
        )

        return intake_work_item_activities
