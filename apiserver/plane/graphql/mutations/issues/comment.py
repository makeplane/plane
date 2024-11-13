# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async


# Module imports
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import Workspace, IssueComment


@strawberry.type
class IssueCommentMutation:
    # adding issue comment
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

        await sync_to_async(
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

        return True
