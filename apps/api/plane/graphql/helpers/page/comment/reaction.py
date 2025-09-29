# Python imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import QuerySet

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.ee.models import PageCommentReaction
from plane.graphql.types.page.comment.reaction import PageCommentReactionType

# Local Imports
from .feature_flag import is_page_comment_feature_flagged
from ...workspace import _get_workspace
from ...project import _get_project


# constructing page comment reaction query
def page_comment_reaction_base_query(
    user_id: str,
    workspace_slug: str,
    comment_id: str,
    reaction: Optional[str] = None,
    project_id: Optional[str] = None,
) -> QuerySet:
    is_page_comment_feature_flagged(workspace_slug=workspace_slug, user_id=user_id)

    base_query = PageCommentReaction.objects.filter(
        workspace__slug=workspace_slug, comment_id=comment_id
    )

    if reaction:
        base_query = base_query.filter(reaction=reaction)

    if project_id:
        base_query = base_query.filter(project_id=project_id)

    base_query = base_query.order_by("-created_at")

    return base_query


def get_page_comment_reactions(
    user_id: str,
    workspace_slug: str,
    comment_id: str,
    reaction: Optional[str] = None,
    project_id: Optional[str] = None,
) -> list[PageCommentReactionType]:
    base_query = page_comment_reaction_base_query(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )

    page_comment_reactions = base_query.all()

    return list(page_comment_reactions)


@sync_to_async
def get_page_comment_reactions_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    reaction: Optional[str] = None,
    project_id: Optional[str] = None,
) -> list[PageCommentReactionType]:
    return get_page_comment_reactions(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )


def get_page_comment_reactions_by_user(
    user_id: str,
    workspace_slug: str,
    comment_id: str,
    reaction: Optional[str] = None,
    project_id: Optional[str] = None,
) -> list[PageCommentReactionType]:
    base_query = page_comment_reaction_base_query(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )

    page_comment_reactions = base_query.filter(created_by_id=user_id).all()

    return list(page_comment_reactions)


@sync_to_async
def get_page_comment_reactions_by_user_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    reaction: Optional[str] = None,
    project_id: Optional[str] = None,
) -> list[PageCommentReactionType]:
    return get_page_comment_reactions_by_user(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )


def add_page_comment_reaction(
    user_id: str,
    workspace_slug: str,
    comment_id: str,
    reaction: str,
    project_id: Optional[str] = None,
) -> bool:
    try:
        page_comment_reaction = get_page_comment_reactions_by_user(
            user_id=user_id,
            workspace_slug=workspace_slug,
            comment_id=comment_id,
            reaction=reaction,
            project_id=project_id,
        )

        if page_comment_reaction and len(page_comment_reaction) > 0:
            message = "Page comment reaction already exists"
            error_extensions = {
                "code": "PAGE_COMMENT_REACTION_ALREADY_EXISTS",
                "statusCode": 200,
            }
            raise GraphQLError(message, extensions=error_extensions)

        workspace = _get_workspace(workspace_slug=workspace_slug)
        workspace_id = workspace.id

        comment_reaction_data = {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "comment_id": comment_id,
            "actor_id": user_id,
            "reaction": reaction,
        }

        if project_id:
            project = _get_project(workspace_slug=workspace_slug, project_id=project_id)
            validated_project_id = project.id
            comment_reaction_data["project_id"] = validated_project_id

        comment_reaction_data = {
            k: v for k, v in comment_reaction_data.items() if v is not None
        }

        comment_reaction = PageCommentReaction.objects.create(**comment_reaction_data)
        if comment_reaction:
            return True
        return False
    except Exception as e:
        message = (
            e.message if hasattr(e, "message") else "Error adding page comment reaction"
        )
        error_extensions = (
            e.error_extensions
            if hasattr(e, "error_extensions")
            else {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }
        )
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def add_page_comment_reaction_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    reaction: str,
    project_id: Optional[str] = None,
) -> bool:
    return add_page_comment_reaction(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )


def remove_page_comment_reaction(
    user_id: str,
    workspace_slug: str,
    comment_id: str,
    reaction: str,
    project_id: Optional[str] = None,
) -> bool:
    try:
        page_comment_reaction = get_page_comment_reactions_by_user(
            user_id=user_id,
            workspace_slug=workspace_slug,
            comment_id=comment_id,
            reaction=reaction,
            project_id=project_id,
        )

        if not page_comment_reaction or len(page_comment_reaction) == 0:
            message = "Page comment reaction not found"
            error_extensions = {
                "code": "PAGE_COMMENT_REACTION_NOT_FOUND",
                "statusCode": 404,
            }
            raise GraphQLError(message, extensions=error_extensions)

        page_comment_reaction[0].delete()

        return True

    except Exception as e:
        message = (
            e.message
            if hasattr(e, "message")
            else "Error removing page comment reaction"
        )
        error_extensions = (
            e.error_extensions
            if hasattr(e, "error_extensions")
            else {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        )
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def remove_page_comment_reaction_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    reaction: str,
    project_id: Optional[str] = None,
) -> bool:
    return remove_page_comment_reaction(
        user_id=user_id,
        workspace_slug=workspace_slug,
        comment_id=comment_id,
        reaction=reaction,
        project_id=project_id,
    )
