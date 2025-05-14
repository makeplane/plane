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
from plane.db.models import IssueComment, Workspace
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.comment import IssueCommentActivityType


@strawberry.type
class IssueCommentMutation:
    # Deprecated: adding issue comment in favor of add_issue_comment_v2
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def addIssueComment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        comment_html: str,
    ) -> bool:
        workspace_details = await sync_to_async(
            Workspace.objects.filter(slug=slug).first
        )()
        if not workspace_details:
            return False

        issue_comment = await sync_to_async(
            lambda: IssueComment.objects.create(
                workspace_id=workspace_details.id,
                project_id=project,
                issue_id=issue,
                comment_html=comment_html,
                actor=info.context.user,
                created_by=info.context.user,
                updated_by=info.context.user,
            )
        )()

        comment_activity_payload = {
            "id": str(issue_comment.id),
            "comment_html": comment_html,
        }

        # update the issue comment activity
        await sync_to_async(issue_activity.delay)(
            type="comment.activity.created",
            requested_data=json.dumps(comment_activity_payload),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True

    # adding issue comment version 2
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_issue_comment_v2(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        comment_html: str,
    ) -> IssueCommentActivityType:
        workspace_details = await sync_to_async(
            Workspace.objects.filter(slug=slug).first
        )()
        if not workspace_details:
            return False

        issue_comment = await sync_to_async(
            lambda: IssueComment.objects.create(
                workspace_id=workspace_details.id,
                project_id=project,
                issue_id=issue,
                comment_html=comment_html,
                actor=info.context.user,
                created_by=info.context.user,
                updated_by=info.context.user,
            )
        )()

        comment_activity_payload = {
            "id": str(issue_comment.id),
            "comment_html": comment_html,
        }

        # update the issue comment activity
        await sync_to_async(issue_activity.delay)(
            type="comment.activity.created",
            requested_data=json.dumps(comment_activity_payload),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return issue_comment
