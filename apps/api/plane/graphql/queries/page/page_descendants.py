# Python imports
from typing import List

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.permission import PermissionExtension

# Strawberry Imports
from strawberry.types import Info

# Module Imports
from plane.db.models import Page
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.pages import NestedParentPageLiteType
from plane.graphql.utils.page_descendants import (
    get_all_parent_ids,
    get_descendant_page_ids,
)


@sync_to_async
def page_parent_ids(page_id) -> list[str]:
    return list(get_all_parent_ids(page_id))


@sync_to_async
def page_child_ids(page_id) -> list[str]:
    return list(get_descendant_page_ids(page_id))


@sync_to_async
def pages_with_ids(user, slug, page_ids, project=None, filters=None) -> list[Page]:
    page_query = Page.all_objects.filter(workspace__slug=slug).filter(
        workspace__workspace_member__member=user,
        workspace__workspace_member__is_active=True,
    )

    if project:
        user_id = str(user.id)
        page_base_query = {
            "projects__project_projectmember__member_id": user_id,
            "projects__project_projectmember__is_active": True,
            "projects__archived_at__isnull": True,
        }
        project_teamspace_filter = project_member_filter_via_teamspaces(
            user_id=user_id,
            workspace_slug=slug,
            related_field="projects__id",
            query=page_base_query,
        )
        page_query = page_query.filter(projects__id=project).filter(
            project_teamspace_filter.query
        )

    if filters:
        page_query = page_query.filter(**filters)

    page_query = page_query.filter(id__in=page_ids).distinct()

    return list(page_query.order_by("created_at"))


# workspace parent pages
@strawberry.type
class WorkspaceNestedParentPagesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_nested_parent_pages(
        self, info: Info, slug: str, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user

        parent_page_ids = await page_parent_ids(page)

        if not parent_page_ids:
            return []

        pages = await pages_with_ids(
            user=user, slug=slug, project=None, page_ids=parent_page_ids
        )

        return pages


# workspace children pages
@strawberry.type
class WorkspaceNestedChildPagesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_nested_child_pages(
        self, info: Info, slug: str, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user

        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            return []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user, slug=slug, project=None, page_ids=child_page_ids
        )

        return pages


# parent pages
@strawberry.type
class NestedParentPagesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def nested_parent_pages(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user

        parent_page_ids = await page_parent_ids(page)

        if not parent_page_ids:
            return []

        pages = await pages_with_ids(
            user=user, slug=slug, project=project, page_ids=parent_page_ids
        )

        return pages


# children pages
@strawberry.type
class NestedChildPagesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def nested_child_pages(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user

        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            return []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user, slug=slug, project=project, page_ids=child_page_ids
        )

        return pages
