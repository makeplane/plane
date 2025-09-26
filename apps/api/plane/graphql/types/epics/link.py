# python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueLink
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.input
@dataclass
class EpicLinkCreateInputType:
    title: Optional[str] = field(default_factory=lambda: None)
    url: str = field(default_factory=lambda: "")


@strawberry.input
@dataclass
class EpicLinkUpdateInputType:
    title: Optional[str] = field(default_factory=lambda: None)
    url: Optional[str] = field(default_factory=lambda: None)


@strawberry_django.type(IssueLink)
class EpicLinkType:
    id: strawberry.ID
    title: Optional[str]
    url: str
    metadata: Optional[JSON]

    @strawberry.field
    def workspace(self) -> strawberry.ID:
        return self.workspace_id

    @strawberry.field
    def project(self) -> strawberry.ID:
        return self.project_id

    @strawberry.field
    def epic(self) -> strawberry.ID:
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
