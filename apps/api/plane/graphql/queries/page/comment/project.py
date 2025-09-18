# Python imports
from collections import defaultdict
from typing import Optional

# Third-party imports
import strawberry

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.graphql.helpers.page import (
    get_page_comment_async,
    get_page_comment_reactions_async,
    get_page_comment_replies_async,
    get_page_comments_async,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.page import (
    PageCommentListType,
    PageCommentReactionCountType,
    PageCommentType,
    PageCommentWithReactionsListType,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@strawberry.type
class ProjectPageCommentsQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def page_comments(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[PageCommentListType]:
        user = info.context.user
        user_id = str(user.id)

        page_comments = await get_page_comments_async(
            user_id=user_id,
            workspace_slug=slug,
            project_id=project,
            page_id=page,
            is_root=True,
        )

        return paginate(results_object=page_comments, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def page_comments_with_ids(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment_ids: list[str],
    ) -> list[PageCommentListType]:
        user = info.context.user
        user_id = str(user.id)

        page_comments = await get_page_comments_async(
            user_id=user_id,
            workspace_slug=slug,
            project_id=project,
            page_id=page,
            comment_ids=comment_ids,
        )

        return page_comments

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def page_comment_replies(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[PageCommentWithReactionsListType]:
        user = info.context.user
        user_id = str(user.id)

        page_comments = await get_page_comment_replies_async(
            user_id=user_id,
            workspace_slug=slug,
            project_id=project,
            page_id=page,
            parent_id=comment,
        )

        return paginate(results_object=page_comments, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def page_comment(
        self, info: Info, slug: str, project: str, page: str, comment: str
    ) -> PageCommentType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await get_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            project_id=project,
            page_id=page,
            comment_id=comment,
        )

        return page_comment

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def project_page_comment_reactions(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
    ) -> list[PageCommentReactionCountType]:
        user = info.context.user
        user_id = str(user.id)

        page_comment_reactions = await get_page_comment_reactions_async(
            user_id=user_id,
            workspace_slug=slug,
            project_id=project,
            page_id=page,
            comment_id=comment,
        )

        if not page_comment_reactions or len(page_comment_reactions) == 0:
            return []

        grouped = defaultdict(list)
        for reaction in page_comment_reactions:
            grouped[reaction.reaction].append(str(reaction.created_by_id))

        return [
            PageCommentReactionCountType(reaction=k, user_ids=v)
            for k, v in grouped.items()
        ]
