# Strawberry imports
import strawberry
import strawberry_django

# Module Imports
from plane.db.models import EstimatePoint


@strawberry_django.type(EstimatePoint)
class EstimatePointType:
    id: strawberry.ID
    estimate: strawberry.ID
    key: int
    description: str
    value: str
    workspace: strawberry.ID
    project: strawberry.ID

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def estimate(self) -> int:
        return self.estimate_id
