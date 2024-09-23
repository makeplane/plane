# python imports
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueLink


@strawberry_django.type(IssueLink)
class IssueLinkType:
    id: strawberry.ID
    created_at: datetime
    updated_at: datetime
    title: str
    url: str
    metadata: JSON
    created_by: strawberry.ID
    updated_by: strawberry.ID
    project: strawberry.ID
    workspace: strawberry.ID
    issue: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id

    @strawberry.field
    def created_by(self) -> int:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> int:
        return self.updated_by_id
