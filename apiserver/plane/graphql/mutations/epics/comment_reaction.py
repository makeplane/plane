# Python imports
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
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import CommentReaction
from plane.graphql.helpers import get_workspace, get_epic
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.issues.comment_reaction import (
    CommentReactionInput,
    CommentReactionType,
)


valid_reactions = [
    "128077",
    "128078",
    "128516",
    "128165",
    "128533",
    "129505",
    "9992",
    "128064",
]


@sync_to_async
def get_epic_comment_reactions_by_reaction(
    workspace_slug: str, project_id: str, comment_id: str, user_id: str, reaction: str
):
    try:
        comment_reactions = (
            CommentReaction.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                comment_id=comment_id,
                actor_id=user_id,
                reaction=reaction,
            )
            .filter(
                project__project_projectmember__member=user_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )
        return list(comment_reactions)
    except CommentReaction.DoesNotExist:
        return []


@sync_to_async
def get_epic_comment_reaction(
    workspace_slug: str, project_id: str, comment_id: str, user_id: str, reaction: str
):
    try:
        comment_reaction = (
            CommentReaction.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                comment_id=comment_id,
                actor_id=user_id,
                reaction=reaction,
            )
            .filter(
                project__project_projectmember__member=user_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )
        if comment_reaction.exists():
            return comment_reaction.first()
        return None
    except CommentReaction.DoesNotExist:
        return None


def validate_comment_reaction(reaction: str):
    if reaction not in valid_reactions:
        message = "Invalid reaction"
        error_extensions = {"code": "INVALID_REACTION", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class EpicCommentReactionMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def add_epic_comment_reaction(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        comment: str,
        reactionInput: CommentReactionInput,
    ) -> CommentReactionType:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        await get_epic(workspace_slug=slug, project_id=project, epic_id=epic)

        reaction = reactionInput.reaction

        validate_comment_reaction(reaction)

        comment_reaction = await get_epic_comment_reaction(
            workspace_slug=slug,
            project_id=project,
            comment_id=comment,
            user_id=user_id,
            reaction=reaction,
        )
        if comment_reaction:
            message = "Reaction already exists"
            error_extensions = {"code": "REACTION_ALREADY_EXISTS", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        await sync_to_async(CommentReaction.objects.create)(
            workspace_id=workspace_id,
            project_id=project,
            comment_id=comment,
            actor_id=user_id,
            reaction=reaction,
        )

        # Create activity
        activity_payload = {"reaction": reaction}

        issue_activity.delay(
            type="comment_reaction.activity.created",
            requested_data=activity_payload,
            actor_id=user_id,
            issue_id=None,
            project_id=project,
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        comment_reactions = await get_epic_comment_reactions_by_reaction(
            workspace_slug=slug,
            project_id=project,
            comment_id=comment,
            user_id=user_id,
            reaction=reaction,
        )
        user_ids = [str(reaction.created_by_id) for reaction in comment_reactions]
        return CommentReactionType(reaction=reaction, user_ids=user_ids)

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def remove_epic_comment_reaction(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        comment: str,
        reactionInput: CommentReactionInput,
    ) -> CommentReactionType:
        user = info.context.user
        user_id = str(user.id)

        await get_epic(workspace_slug=slug, project_id=project, epic_id=epic)

        reaction = reactionInput.reaction

        validate_comment_reaction(reaction)

        comment_reaction = await get_epic_comment_reaction(
            workspace_slug=slug,
            project_id=project,
            comment_id=comment,
            user_id=user_id,
            reaction=reaction,
        )

        if comment_reaction is None:
            message = "Reaction does not exist"
            error_extensions = {"code": "REACTION_DOES_NOT_EXIST", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        comment_reaction_id = str(comment_reaction.id)
        await sync_to_async(comment_reaction.delete)()

        # Create activity
        activity_payload = {
            "comment_id": str(comment),
            "identifier": comment_reaction_id,
            "reaction": reaction,
        }
        issue_activity.delay(
            type="comment_reaction.activity.deleted",
            requested_data=None,
            actor_id=user_id,
            issue_id=None,
            project_id=project,
            current_instance=json.dumps(activity_payload),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        comment_reactions = await get_epic_comment_reactions_by_reaction(
            workspace_slug=slug,
            project_id=project,
            comment_id=comment,
            user_id=user_id,
            reaction=reaction,
        )
        user_ids = [str(reaction.created_by_id) for reaction in comment_reactions]
        return CommentReactionType(reaction=reaction, user_ids=user_ids)
