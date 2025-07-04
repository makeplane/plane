# Python imports
from collections import defaultdict

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import CommentReaction
from plane.graphql.helpers import get_work_item
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.issues.comment_reaction import CommentReactionType


@sync_to_async
def get_work_item_comment_reactions(
    workspace_slug: str, project_id: str, comment_id: str, user_id: str
):
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id,
        workspace_slug=workspace_slug,
    )
    comment_reactions = (
        CommentReaction.objects.filter(
            workspace__slug=workspace_slug, project_id=project_id, comment_id=comment_id
        )
        .filter(project_teamspace_filter.query)
        .distinct()
        .order_by("-created_at")
    )

    return list(comment_reactions)


@strawberry.type
class WorkItemCommentReactionQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def work_item_comment_reactions(
        self, info: Info, slug: str, project: str, work_item: str, comment: str
    ) -> list[CommentReactionType]:
        user = info.context.user
        user_id = str(user.id)

        await get_work_item(
            workspace_slug=slug, project_id=project, work_item_id=work_item
        )

        comment_reactions = await get_work_item_comment_reactions(
            workspace_slug=slug, project_id=project, comment_id=comment, user_id=user_id
        )

        grouped = defaultdict(list)
        for reaction in comment_reactions:
            grouped[reaction.reaction].append(str(reaction.created_by_id))

        return [CommentReactionType(reaction=k, user_ids=v) for k, v in grouped.items()]
