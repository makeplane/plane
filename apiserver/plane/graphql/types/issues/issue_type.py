# Third-party library imports
import strawberry
import strawberry_django

# Strawberry imports
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueType


@strawberry_django.type(IssueType)
class IssueTypesType:
    id: strawberry.ID
    workspace: strawberry.ID
    name: str
    description: str
    logo_props: JSON
    is_default: bool
    level: int
    is_active: bool

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id
