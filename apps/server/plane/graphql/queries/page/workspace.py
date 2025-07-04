# Python imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Page, UserFavorite
from plane.ee.models import PageUser
from plane.graphql.permissions.workspace import (
    WorkspacePermission,
    WorkspaceSharedPagePermission,
)
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.page import PageType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.paginator import paginate


# workspace level queries
@strawberry.type
class WorkspacePageQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspacePages(
        self,
        info: Info,
        slug: str,
        cursor: Optional[str] = None,
        type: Optional[str] = "all",
    ) -> PaginatorResponse[PageType]:
        user = info.context.user
        user_id = str(user.id)

        is_feature_flagged = await validate_feature_flag(
            slug=slug,
            user_id=user_id,
            feature_key=FeatureFlagsTypesEnum.WORKSPACE_PAGES.value,
        )
        if not is_feature_flagged:
            message = "Feature flag not enabled."
            error_extensions = {"code": "FEATURE_FLAG_NOT_ENABLED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        page_base_query = (
            Page.objects.filter(workspace__slug=slug)
            .filter(is_global=True)
            .filter(projects__isnull=True)
            .filter(parent__isnull=True)
            .filter(moved_to_page__isnull=True)
        )

        # Get shared page ids
        if type in ["private", "shared"]:
            shared_pages = await sync_to_async(list)(
                PageUser.objects.filter(
                    workspace__slug=slug,
                ).values_list("page_id", flat=True)
            )
            shared_page_ids = list(shared_pages)
        else:
            shared_page_ids = []

        # Filter archived pages
        if type != "archived":
            page_base_query = page_base_query.filter(archived_at__isnull=True)
        else:
            page_base_query = page_base_query.filter(archived_at__isnull=False)

        # Filter pages by access level
        if type == "all":
            page_base_query = page_base_query.filter(
                Q(access=0) | (Q(access=1) & Q(owned_by_id=user_id))
            )
        elif type == "public":
            page_base_query = page_base_query.filter(access=0)
        elif type == "private":
            page_base_query = page_base_query.filter(
                Q(access=1) & ~Q(id__in=shared_page_ids)
            ).filter(owned_by_id=user_id)
        elif type == "shared":
            page_base_query = page_base_query.filter(
                Q(access=1) & Q(id__in=shared_page_ids)
            )

        # Build subquery for UserFavorite
        subquery = UserFavorite.objects.filter(
            user=user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )

        pages = await sync_to_async(list)(
            page_base_query.select_related("workspace", "owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-created_at")
        )

        return paginate(results_object=pages, cursor=cursor)

    @strawberry.field(
        extensions=[
            PermissionExtension(
                permissions=[WorkspacePermission(), WorkspaceSharedPagePermission()]
            )
        ]
    )
    async def workspacePage(
        self, info: Info, slug: str, page: strawberry.ID
    ) -> PageType:
        user = info.context.user

        # Build subquery for UserFavorite
        subquery = UserFavorite.objects.filter(
            user=user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )

        # Build the query
        query = (
            Page.objects.filter(workspace__slug=slug, id=page)
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        # Fetch the page asynchronously
        try:
            page_result = await sync_to_async(query.get, thread_sensitive=True)()
        except Exception:
            message = "Page not found."
            error_extensions = {"code": "PAGE_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        # Background task to update recent visited project
        # user_id = info.context.user.id
        # recent_visited_task.delay(
        #     slug=slug,
        #     project_id=None,
        #     user_id=user_id,
        #     entity_name="page",
        #     entity_identifier=page,
        # )

        return page_result
