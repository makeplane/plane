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
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_project,
    get_workspace,
    is_project_intakes_enabled_async,
    project_member_filter_via_teamspaces,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.issues.comment_reaction import CommentReactionType


@sync_to_async
def get_intake_work_item_comment_reactions(
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
        .order_by("-created_at")
        .distinct()
    )

    return list(comment_reactions)


@strawberry.type
class IntakeWorkItemCommentReactionQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_work_item_comment_reactions(
        self, info: Info, slug: str, project: str, intake_work_item: str, comment: str
    ) -> list[CommentReactionType]:
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
        await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )

        comment_reactions = await get_intake_work_item_comment_reactions(
            workspace_slug=slug,
            project_id=project,
            comment_id=comment,
            user_id=user_id,
        )

        grouped = defaultdict(list)
        for reaction in comment_reactions:
            grouped[reaction.reaction].append(str(reaction.created_by_id))

        return [CommentReactionType(reaction=k, user_ids=v) for k, v in grouped.items()]
