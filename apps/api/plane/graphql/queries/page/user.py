# Python imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Page, UserFavorite
from plane.ee.models import PageUser
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.pages import PageType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@strawberry.type
class UserPageQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userPages(
        self,
        info: Info,
        slug: str,
        cursor: Optional[str] = None,
        type: Optional[str] = "all",
    ) -> PaginatorResponse[PageType]:
        user = info.context.user
        user_id = str(user.id)

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

        page_base_query = (
            Page.objects.filter(workspace__slug=slug)
            .filter(owned_by_id=user_id)
            .filter(parent__isnull=True)
            .filter(moved_to_page__isnull=True)
            .filter(is_global=False)
            .filter(project_teamspace_filter_query)
        )

        shared_pages_data = await sync_to_async(list)(
            PageUser.objects.filter(
                workspace__slug=slug,
                project_id__isnull=False,
            ).values("page_id", "user_id")
        )
        shared_page_ids = list(set(str(item["page_id"]) for item in shared_pages_data))
        pages_shared_with_user = [
            str(item["page_id"])
            for item in shared_pages_data
            if str(item["user_id"]) == user_id
        ]

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
                access=1, owned_by_id=user_id
            ).exclude(id__in=shared_page_ids)
        elif type == "shared":
            page_base_query = page_base_query.filter(
                Q(access=1)
                & (
                    Q(id__in=pages_shared_with_user)
                    | (Q(owned_by_id=user_id) & Q(id__in=shared_page_ids))
                )
            )

        subquery = UserFavorite.objects.filter(
            user=info.context.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )
        pages = await sync_to_async(list)(
            page_base_query.distinct()
            .select_related("workspace", "owned_by")
            .prefetch_related("projects")
            .annotate(is_favorite=Exists(subquery))
        )

        return paginate(results_object=pages, cursor=cursor)
