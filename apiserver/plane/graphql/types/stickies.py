# Python imports
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Sticky
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.input
@dataclass
class StickyCreateUpdateInputType:
    name: Optional[str] = ""
    description_html: Optional[str] = ""
    background_color: Optional[str] = ""


@strawberry_django.type(Sticky)
class StickiesType:
    id: strawberry.ID

    name: Optional[str]

    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]

    logo_props: JSON
    color: Optional[str]
    background_color: Optional[str]
    sort_order: float

    workspace: strawberry.ID
    owner: strawberry.ID

    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]

    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]

    @strawberry.field
    def workspace(self) -> Optional[strawberry.ID]:
        return self.workspace_id

    @strawberry.field
    def owner(self) -> Optional[strawberry.ID]:
        return self.owner_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    def deleted_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.deleted_at)
        return converted_date

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id
