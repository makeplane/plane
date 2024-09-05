# Python imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Module Imports
from plane.graphql.types.page import PageType
from plane.db.models import UserFavorite, Page
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task


@strawberry.type
class UserPageQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def userPages(
        self,
        info: Info,
        slug: str,
        cursor: Optional[str] = None,
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
            .filter(parent__isnull=True)
            .filter(Q(owned_by=info.context.user))
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=pages, cursor=cursor)


@strawberry.type
class PageQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
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
            .filter(parent__isnull=True)
            .filter(Q(owned_by=info.context.user) | Q(access=0))
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=pages, cursor=cursor)

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def page(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        page: strawberry.ID,
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
            Page.objects.filter(
                workspace__slug=slug, projects__id=project, pk=page
            )
            .filter(
                projects__project_projectmember__member=user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(parent__isnull=True)
            .filter(Q(owned_by=user) | Q(access=0))
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        # Fetch the page asynchronously
        page_result = await sync_to_async(query.get, thread_sensitive=True)()

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
