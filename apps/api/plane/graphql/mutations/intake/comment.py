# python imports
import json

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IssueComment
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_project,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.intake.comment import (
    IntakeWorkItemCommentActivityType,
    IntakeWorkItemCommentInputType,
)


@strawberry.type
class IntakeWorkItemCommentMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_intake_work_item_comment(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        comment_input: IntakeWorkItemCommentInputType,
    ) -> IntakeWorkItemCommentActivityType:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

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

        comment_html = comment_input.comment_html

        intake_work_item_comment = await sync_to_async(
            lambda: IssueComment.objects.create(
                workspace_id=workspace_id,
                project_id=project,
                issue_id=intake_work_item_id,
                comment_html=comment_html,
                actor_id=user_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
        )()

        comment_activity_payload = {
            "id": str(intake_work_item_comment.id),
            "comment_html": comment_html,
        }

        # update the intake work item comment activity
        issue_activity.delay(
            type="comment.activity.created",
            requested_data=json.dumps(comment_activity_payload),
            actor_id=str(user_id),
            project_id=str(project),
            issue_id=str(intake_work_item_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return intake_work_item_comment
