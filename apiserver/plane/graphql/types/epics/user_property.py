# python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Third-party library imports
from strawberry.scalars import JSON

# Module Imports
from plane.ee.models import EpicUserProperties
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.input
@dataclass
class EpicUserPropertyCreateInputType:
    filters: Optional[JSON] = field(default_factory=lambda: None)
    display_filters: Optional[JSON] = field(default_factory=lambda: None)
    display_properties: Optional[JSON] = field(default_factory=lambda: None)


@strawberry_django.type(EpicUserProperties)
class EpicUserPropertyType:
    id: strawberry.ID
    filters: Optional[JSON]
    display_filters: Optional[JSON]
    display_properties: Optional[JSON]

    @strawberry.field
    def workspace(self) -> Optional[strawberry.ID]:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[strawberry.ID]:
        return self.project_id

    @strawberry.field
    def user(self) -> Optional[strawberry.ID]:
        return self.user_id

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
