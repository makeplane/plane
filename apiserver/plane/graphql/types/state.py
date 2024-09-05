# Strawberry Imports
import strawberry
import strawberry_django

# Module imports
from plane.db.models import State


@strawberry_django.type(State)
class StateType:
    id: strawberry.ID
    name: str
    description: str
    color: str
    slug: str
    sequence: float
    group: str
    is_triage: bool
    default: bool
    workspace: strawberry.ID
    project: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id
