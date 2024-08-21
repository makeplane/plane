# python imports
from typing import Optional
from datetime import date, datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info
from strawberry.scalars import JSON

# Third-party library imports
from asgiref.sync import sync_to_async


# Module Imports
from plane.db.models import Cycle, Issue


@strawberry_django.type(Cycle)
class CycleType:
    id: strawberry.ID
    name: str
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    owned_by: strawberry.ID
    view_props: Optional[JSON]
    sort_order: Optional[float]
    external_source: Optional[str]
    external_id: Optional[strawberry.ID]
    progress_snapshot: Optional[JSON]
    archived_at: Optional[datetime]
    logo_props: Optional[JSON]
    project: strawberry.ID
    workspace: strawberry.ID
    created_by: strawberry.ID
    updated_by: strawberry.ID
    created_at: datetime
    updated_at: datetime
    total_issues: int
    completed_issues: int

    @strawberry.field
    def owned_by(self) -> int:
        return self.owned_by_id

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
                issue_cycle__cycle_id=self.id
            ).count()
        )()
        return total_issues

    @strawberry.field
    async def completed_issues(self, info: Info) -> int:
        total_issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(
                issue_cycle__cycle_id=self.id, state__group="completed"
            ).count()
        )()
        return total_issues
