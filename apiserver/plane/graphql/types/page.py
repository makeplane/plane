# Python imports
from typing import Optional
from datetime import date, datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Page


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
    # project: strawberry.ID
    owned_by: strawberry.ID
    access: int
    color: Optional[str]
    archived_at: Optional[date]
    is_locked: bool
    view_props: JSON
    logo_props: JSON
    is_global: bool
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    is_favorite: bool
    # projects: list[strawberry.ID]
    # teams: list[strawberry.ID]
    # labels: list[strawberry.ID]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    # @strawberry.field
    # def project(self) -> int:
    #     return self.project_id

    @strawberry.field
    def owned_by(self) -> int:
        return self.owned_by_id

    @strawberry.field
    def parent(self) -> int:
        return self.parent_id

    # @strawberry.field
    # async def projects(self) -> list[strawberry.ID]:
    #     projects = await sync_to_async(list)(self.projects.all())
    #     return [project.id for project in projects]

    # @strawberry.field
    # async def labels(self) -> list[strawberry.ID]:
    #     labels = await sync_to_async(list)(self.labels.all())
    #     return [label.id for label in labels]
