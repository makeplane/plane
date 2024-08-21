# python imports
from typing import Optional
from datetime import date, datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import Module, Issue

# Third-party library imports
from asgiref.sync import sync_to_async


@strawberry_django.type(Module)
class ModuleType:
    name: str
    status: str
    id: strawberry.ID
    project: strawberry.ID
    workspace: strawberry.ID
    created_by: strawberry.ID
    updated_by: strawberry.ID
    created_at: datetime
    updated_at: datetime
    description: Optional[str]
    description_text: Optional[str]
    description_html: Optional[str]
    start_date: Optional[date]
    target_date: Optional[date]
    lead: Optional[strawberry.ID]
    members: Optional[list[strawberry.ID]]
    view_props: Optional[JSON]
    sort_order: float
    external_source: Optional[str]
    external_id: Optional[strawberry.ID]
    archived_at: Optional[datetime]
    logo_props: Optional[JSON]
    total_issues: int
    completed_issues: int

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def created_by(self) -> int:
        return self.created_by_id

    @strawberry.field
    async def total_issues(self, info: Info) -> int:
        total_issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(
                issue_module__module_id=self.id
            ).count()
        )()
        return total_issues

    @strawberry.field
    async def completed_issues(self, info: Info) -> int:
        total_issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(
                issue_module__module_id=self.id, state__group="completed"
            ).count()
        )()
        return total_issues
