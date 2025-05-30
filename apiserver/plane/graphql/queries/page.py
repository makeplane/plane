# Python imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Module Imports
from plane.graphql.types.page import PageType
from plane.db.models import UserFavorite, Page
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum


# workspace level queries
@strawberry.type
class WorkspacePageQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspacePages(
        self, info: Info, slug: str, cursor: Optional[str] = None
    ) -> PaginatorResponse[PageType]:
        user = info.context.user

        is_feature_flagged = await validate_feature_flag(
            slug=slug,
            user_id=str(user.id),
            feature_key=FeatureFlagsTypesEnum.WORKSPACE_PAGES.value,
        )

        if not is_feature_flagged:
            message = "Feature flag not enabled."
            error_extensions = {"code": "FEATURE_FLAG_NOT_ENABLED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # Build subquery for UserFavorite
        subquery = UserFavorite.objects.filter(
            user=user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )

        pages = await sync_to_async(list)(
            Page.objects.filter(
                workspace__slug=slug,
                is_global=True,
                archived_at__isnull=True,
                parent__isnull=True,
            )
            .filter(Q(owned_by=user) | Q(access=0))
            .select_related("workspace", "owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-created_at")
        )

        return paginate(results_object=pages, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
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
            Page.objects.filter(workspace__slug=slug, pk=page)
            .filter(Q(owned_by=user) | Q(access=0))
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


# project level queries
@strawberry.type
class UserPageQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userPages(
        self, info: Info, slug: str, cursor: Optional[str] = None
    ) -> PaginatorResponse[PageType]:
        subquery = UserFavorite.objects.filter(
            user=info.context.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )
        pages = await sync_to_async(list)(
            Page.objects.filter(workspace__slug=slug)
            .filter(
                projects__project_projectmember__member=info.context.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(projects__isnull=False, archived_at__isnull=True)
            .filter(parent__isnull=True)
            .filter(moved_to_page__isnull=True)
            .filter(Q(owned_by=info.context.user))
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=pages, cursor=cursor)


@strawberry.type
class PageQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def pages(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[PageType]:
        subquery = UserFavorite.objects.filter(
            user=info.context.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )
        pages = await sync_to_async(list)(
            Page.objects.filter(workspace__slug=slug, projects__id=project)
            .filter(
                projects__project_projectmember__member=info.context.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(parent__isnull=True, archived_at__isnull=True)
            .filter(Q(owned_by=info.context.user) | Q(access=0))
            .filter(moved_to_page__isnull=True)
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=pages, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def page(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
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
            Page.objects.filter(workspace__slug=slug, projects__id=project, pk=page)
            .filter(
                projects__project_projectmember__member=user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(Q(owned_by=user) | Q(access=0))
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
        user_id = info.context.user.id
        recent_visited_task.delay(
            slug=slug,
            project_id=project,
            user_id=user_id,
            entity_name="page",
            entity_identifier=page,
        )

        return page_result
