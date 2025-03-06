# python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django

# Module Imports
from plane.graphql.utils.timezone import user_timezone_converter
from plane.db.models import IssueLink


@strawberry_django.type(IssueLink)
class IssueLinkType:
    id: strawberry.ID
    title: str
    url: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @strawberry.field
    def workspace(self) -> strawberry.ID:
        return self.workspace_id

    @strawberry.field
    def project(self) -> strawberry.ID:
        return self.project_id

    @strawberry.field
    def issue(self) -> strawberry.ID:
        return self.issue_id

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id if self.created_by_id else None

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id if self.created_by_id else None

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
