# python imports
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import IntakeIssue
from plane.graphql.types.issues.base import IssuesType
from plane.graphql.utils.timezone import user_timezone_converter


class IntakeSettingsType(Enum):
    IN_APP = "is_in_app_enabled"
    EMAIL = "is_email_enabled"
    FORMS = "is_form_enabled"

    def __str__(self):
        return self.name.lower()


class IntakeSourceType(Enum):
    EMAIL = "EMAIL"
    IN_APP = "IN_APP"
    FORMS = "FORMS"

    def __str__(self):
        return self.name.lower()


class IntakeWorkItemStatusType(Enum):
    PENDING = -2
    REJECTED = -1
    SNOOZED = 0
    ACCEPTED = 1
    DUPLICATE = 2

    def __str__(self):
        return self.name.lower()


# Epic Count Type
@strawberry.type
class IntakeCountType:
    total_intake_work_items: Optional[int] = field(default_factory=lambda: None)


@strawberry.type
class IntakeStatsType:
    attachments: int = 0
    relations: int = 0
    sub_work_items: int = 0
    links: int = 0


# Intake Types
@strawberry.input
@dataclass
class IntakeWorkItemCreateInputType:
    name: str = field()
    description_html: Optional[str] = field(default_factory=lambda: "<p></p>")
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    priority: Optional[str] = field(default_factory=lambda: "none")
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)


@strawberry.input
@dataclass
class IntakeWorkItemUpdateInputType:
    name: Optional[str] = field(default_factory=lambda: None)
    description_html: Optional[str] = field(default_factory=lambda: None)
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    priority: Optional[str] = field(default_factory=lambda: None)
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)


@strawberry.input
@dataclass
class IntakeWorkItemStatusInputType:
    status: Optional[int] = field(default_factory=lambda: None)
    snoozed_till: Optional[datetime] = field(default_factory=lambda: None)
    duplicate_to: Optional[strawberry.ID] = field(default_factory=lambda: None)


@strawberry_django.type(IntakeIssue)
class IntakeWorkItemType:
    id: strawberry.ID
    intake: strawberry.ID
    issue: IssuesType
    status: Optional[strawberry.ID]
    snoozed_till: Optional[datetime]
    duplicate_to: Optional[strawberry.ID]
    source: Optional[str]
    source_email: Optional[str]
    external_source: Optional[str]
    external_id: Optional[str]
    extra: Optional[JSON]

    @strawberry.field
    def intake_id(self) -> Optional[strawberry.ID]:
        return self.intake_id

    @strawberry.field
    def workspace(self) -> Optional[strawberry.ID]:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[strawberry.ID]:
        return self.project_id

    @strawberry.field
    def duplicate_to(self) -> Optional[str]:
        return self.duplicate_to_id

    @strawberry_django.field
    def project_identifier(self) -> Optional[str]:
        return self.project.identifier

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        user = info.context.user
        created_at = self.created_at

        converted_date = user_timezone_converter(user, created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        user = info.context.user
        updated_at = self.updated_at

        converted_date = user_timezone_converter(user, updated_at)
        return converted_date
