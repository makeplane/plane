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
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.page import PageType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


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
        type: Optional[str] = "all",
    ) -> PaginatorResponse[PageType]:
        user = info.context.user
        user_id = str(user.id)

        # Teamspace filter for project
        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
            related_field="projects__id",
            query={
                "projects__project_projectmember__member_id": user_id,
                "projects__project_projectmember__is_active": True,
                "projects__archived_at__isnull": True,
            },
        )
        project_teamspace_filter_query = project_teamspace_filter.query

        # Base query for pages
        page_base_query = (
            Page.objects.filter(workspace__slug=slug)
            .filter(projects__id=project)
            .filter(project_teamspace_filter_query)
            .filter(is_global=False)
            .filter(parent__isnull=True)
            .filter(moved_to_page__isnull=True)
        )

        # Get shared page ids for private and shared pages
        if type in ["private", "shared"]:
            shared_pages = await sync_to_async(list)(
                PageUser.objects.filter(
                    workspace__slug=slug,
                    project__id=project,
                ).values_list("page_id", flat=True)
            )
            shared_page_ids = list(shared_pages)
        else:
            shared_page_ids = []

        # Filter archived pages for all, public and shared pages
        if type != "archived":
            page_base_query = page_base_query.filter(archived_at__isnull=True)
        else:
            page_base_query = page_base_query.filter(archived_at__isnull=False)

        # Filter pages by access level for all, public and shared pages
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

        # Subquery for UserFavorite
        subquery = UserFavorite.objects.filter(
            user=info.context.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )

        # Fetch pages
        pages = await sync_to_async(list)(
            page_base_query.distinct()
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
        user_id = str(user.id)

        # Build subquery for UserFavorite
        subquery = UserFavorite.objects.filter(
            user=user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )

        # Build the query
        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
            related_field="projects__id",
            query={
                "projects__project_projectmember__member_id": user_id,
                "projects__project_projectmember__is_active": True,
                "projects__archived_at__isnull": True,
            },
        )
        query = (
            Page.objects.filter(workspace__slug=slug, projects__id=project, pk=page)
            .filter(project_teamspace_filter.query)
            .distinct()
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
