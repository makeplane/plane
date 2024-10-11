# python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import FileAsset


@strawberry_django.type(FileAsset)
class IssueAttachmentType:
    id: strawberry.ID
    created_at: datetime
    updated_at: datetime
    attributes: Optional[JSON]
    asset: str
    external_source: Optional[str]
    external_id: Optional[strawberry.ID]
    created_by: strawberry.ID
    updated_by: strawberry.ID
    project: strawberry.ID
    workspace: strawberry.ID
    entity_identifier: strawberry.ID
    entity_type: str

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue(self) -> int:
        return self.entity_identifier

    @strawberry.field
    def created_by(self) -> int:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> int:
        return self.updated_by_id
