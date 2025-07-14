# Third-party library imports
import strawberry
import strawberry_django

# Strawberry imports
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueUserProperty


@strawberry_django.type(IssueUserProperty)
class IssueUserPropertyType:
    display_filters: JSON
    display_properties: JSON
    filters: JSON
    id: strawberry.ID
    project: strawberry.ID
    user: strawberry.ID
    workspace: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id
