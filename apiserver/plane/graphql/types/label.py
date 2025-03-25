# Python imports
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Module imports
from plane.db.models import Label


@strawberry_django.type(Label)
class LabelType:
    id: strawberry.ID
    parent: Optional[strawberry.ID]
    name: str
    description: str
    color: str
    sort_order: float
    workspace: strawberry.ID
    project: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def parent(self) -> int:
        return self.parent_id
