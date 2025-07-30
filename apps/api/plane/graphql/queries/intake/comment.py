# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Prefetch

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import CommentReaction, IssueComment
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_project,
    get_workspace,
    is_project_intakes_enabled_async,
    project_member_filter_via_teamspaces_async,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.intake.comment import IntakeWorkItemCommentActivityType


@strawberry.type
class IntakeWorkItemCommentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def intake_work_item_comments(
        self, info: Info, slug: str, project: str, intake_work_item: str
    ) -> list[IntakeWorkItemCommentActivityType]:
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
        intake_work_item_comments = await sync_to_async(list)(
            IssueComment.objects.filter(workspace__slug=slug)
            .filter(project__id=project)
            .filter(issue_id=intake_work_item_id)
            .filter(deleted_at__isnull=True)
            .filter(project_teamspace_filter.query)
            .distinct()
            .order_by("created_at")
            .select_related("actor", "issue", "project", "workspace")
            .prefetch_related(
                Prefetch(
                    "comment_reactions",
                    queryset=CommentReaction.objects.select_related("actor"),
                )
            )
        )

        return intake_work_item_comments
