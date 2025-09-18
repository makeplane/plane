# Third-party imports
import strawberry

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.graphql.helpers.page import (
    add_page_comment_reaction_async,
    create_page_comment_async,
    partial_update_page_comment_async,
    remove_page_comment_reaction_async,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.page import (
    PageCommentInput,
    PageCommentListType,
    PageCommentType,
    PageCommentUpdateTypeEnum,
    PageCommentWithReactionsListType,
)


@strawberry.type
class ProjectPageCommentsMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_page_comment(
        self, info: Info, slug: str, project: str, page: str, input: PageCommentInput
    ) -> PageCommentListType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await create_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            project_id=project,
            description_html=input.description_html,
            description_json=input.description_json,
            reference_stripped=input.reference_stripped,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_page_comment_reply(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
        input: PageCommentInput,
    ) -> PageCommentWithReactionsListType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await create_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            project_id=project,
            parent_id=comment,
            description_html=input.description_html,
            description_json=input.description_json,
            reference_stripped=input.reference_stripped,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def update_page_comment(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
        input: PageCommentInput,
    ) -> PageCommentType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await partial_update_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            update_type=PageCommentUpdateTypeEnum.UPDATE,
            project_id=project,
            comment_id=comment,
            description_html=input.description_html,
            description_json=input.description_json,
            reference_stripped=input.reference_stripped,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def resolve_page_comment(
        self, info: Info, slug: str, project: str, page: str, comment: str
    ) -> PageCommentType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await partial_update_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            update_type=PageCommentUpdateTypeEnum.RESOLVE,
            project_id=project,
            comment_id=comment,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def un_resolve_page_comment(
        self, info: Info, slug: str, project: str, page: str, comment: str
    ) -> PageCommentType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await partial_update_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            update_type=PageCommentUpdateTypeEnum.UN_RESOLVE,
            project_id=project,
            comment_id=comment,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def delete_page_comment(
        self, info: Info, slug: str, project: str, page: str, comment: str
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await partial_update_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            update_type=PageCommentUpdateTypeEnum.DELETE,
            project_id=project,
            comment_id=comment,
        )

        return page_comment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def restore_page_comment(
        self, info: Info, slug: str, project: str, page: str, comment: str
    ) -> PageCommentType:
        user = info.context.user
        user_id = str(user.id)

        page_comment = await partial_update_page_comment_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            update_type=PageCommentUpdateTypeEnum.RESTORED,
            project_id=project,
            comment_id=comment,
        )

        return page_comment


@strawberry.type
class ProjectPageCommentReactionsMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def add_page_comment_reaction(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
        reaction: str,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        page_comment_reaction = await add_page_comment_reaction_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            comment_id=comment,
            reaction=reaction,
            project_id=project,
        )

        return page_comment_reaction

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def remove_page_comment_reaction(
        self,
        info: Info,
        slug: str,
        project: str,
        page: str,
        comment: str,
        reaction: str,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        page_comment_reaction = await remove_page_comment_reaction_async(
            user_id=user_id,
            workspace_slug=slug,
            page_id=page,
            comment_id=comment,
            reaction=reaction,
            project_id=project,
        )

        return page_comment_reaction
