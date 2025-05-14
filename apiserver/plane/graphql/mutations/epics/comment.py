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
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.comment import (
    EpicCommentActivityType,
    EpicCommentInputType,
)


@strawberry.type
class EpicCommentMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_epic_comment(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        comment_input: EpicCommentInputType,
    ) -> EpicCommentActivityType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # getting workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        comment_html = comment_input.comment_html

        epic_comment = await sync_to_async(
            lambda: IssueComment.objects.create(
                workspace_id=workspace_id,
                project_id=project,
                issue_id=epic,
                comment_html=comment_html,
                actor_id=user_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
        )()

        comment_activity_payload = {
            "id": str(epic_comment.id),
            "comment_html": comment_html,
        }

        # update the epic comment activity
        issue_activity.delay(
            type="comment.activity.created",
            requested_data=json.dumps(comment_activity_payload),
            actor_id=str(user_id),
            project_id=str(project),
            issue_id=str(epic),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return epic_comment
