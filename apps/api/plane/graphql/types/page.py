# Python imports
from datetime import date, datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import Page
from plane.ee.models import PageUser
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.utils.timezone import user_timezone_converter


@sync_to_async
def shared_page_access(user_id: str, workspace_slug: str, page_id: str, owner_id: str):
    shared_pages_data = PageUser.objects.filter(
        workspace__slug=workspace_slug, page_id=page_id
    ).values("user_id", "access")
    shared_pages_data = list(shared_pages_data)

    page_access = 0
    if owner_id == user_id:
        page_access = 2
    else:
        for item in shared_pages_data:
            if str(item["user_id"]) == user_id:
                page_access = item["access"]
                break

    return (len(shared_pages_data) > 0, page_access)


@strawberry_django.type(Page)
class PageType:
    id: strawberry.ID
    parent: Optional[strawberry.ID]
    name: str
    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]
    workspace: strawberry.ID
    project: strawberry.ID
    owned_by: strawberry.ID
    access: int
    color: Optional[str]
    archived_at: Optional[date]
    is_locked: bool
    view_props: JSON
    logo_props: JSON
    is_global: bool
    is_favorite: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    projects: list[strawberry.ID]
    is_description_empty: bool
    is_shared: bool
    is_shared_access: int
    # teams: list[strawberry.ID]
    # labels: list[strawberry.ID]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    # @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def owned_by(self) -> int:
        return self.owned_by_id

    @strawberry.field
    def parent(self) -> int:
        return self.parent_id

    @strawberry.field
    async def projects(self) -> list[strawberry.ID]:
        projects = await sync_to_async(list)(self.projects.all())
        return [project.id for project in projects]

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    async def is_shared(self, info: Info) -> bool:
        if self.access == 0:
            return False

        user = info.context.user
        user_id = str(user.id)

        workspace_slug = self.workspace.slug
        page_id = str(self.id)

        shared_page_count, _ = await shared_page_access(
            workspace_slug=workspace_slug,
            page_id=page_id,
            user_id=user_id,
            owner_id=str(self.owned_by_id),
        )
        if shared_page_count > 0:
            return True
        return False

    @strawberry.field
    async def is_shared_access(self, info: Info) -> int:
        if self.access == 0:
            return 0

        user = info.context.user
        user_id = str(user.id)

        workspace_slug = self.workspace.slug
        page_id = str(self.id)

        shared_page_count, page_access = await shared_page_access(
            workspace_slug=workspace_slug,
            page_id=page_id,
            user_id=user_id,
            owner_id=str(self.owned_by_id),
        )

        if shared_page_count > 0:
            return page_access
        return 0

    # @strawberry.field
    # async def labels(self) -> list[strawberry.ID]:
    #     labels = await sync_to_async(list)(self.labels.all())
    #     return [label.id for label in labels]


@strawberry_django.type(Page)
class PageLiteType:
    id: strawberry.ID
    name: str

    @strawberry.field
    def projects(self) -> list[ProjectLiteType]:
        return self.projects.all()


@strawberry_django.type(Page)
class NestedParentPageLiteType:
    id: strawberry.ID
    name: str
    access: int
    logo_props: JSON
    is_locked: bool
    archived_at: Optional[date]
    parent: Optional[strawberry.ID]
    workspace: strawberry.ID
    owned_by: strawberry.ID
    deleted_at: Optional[datetime]
    is_description_empty: bool

    @strawberry.field
    def owned_by(self) -> list[ProjectLiteType]:
        return self.owned_by_id

    @strawberry.field
    async def projects(self) -> list[strawberry.ID]:
        projects = await sync_to_async(list)(self.projects.all())
        return [project.id for project in projects]
