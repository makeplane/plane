# python imports
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import FileAsset


@strawberry_django.type(FileAsset)
class IssueAttachmentType:
    id: strawberry.ID
    user: strawberry.ID
    workspace: strawberry.ID
    draft_issue: strawberry.ID
    project: strawberry.ID
    issue: strawberry.ID
    comment: strawberry.ID
    page: strawberry.ID

    attributes: Optional[JSON]
    asset: str
    entity_type: str
    is_deleted: bool
    is_archived: bool

    size: float
    is_uploaded: bool
    storage_metadata: Optional[JSON]
    asset_url: Optional[str]

    external_id: strawberry.ID
    external_source: str

    @strawberry.field
    def user(self):
        return self.user_id

    @strawberry.field
    def workspace(self):
        return self.workspace_id

    @strawberry.field
    def draft_issue(self):
        return self.draft_issue_id

    @strawberry.field
    def project(self):
        return self.project_id

    @strawberry.field
    def issue(self):
        return self.external_id

    @strawberry.field
    def comment(self):
        return self.comment_id

    @strawberry.field
    def page(self):
        return self.page_id
