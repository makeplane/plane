# Python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Notification
from plane.graphql.types.users import UserType
from plane.graphql.types.project import ProjectType


@strawberry_django.type(Notification)
class NotificationType:
    id: strawberry.ID
    title: str
    message: Optional[JSON]
    message_html = Optional[str]
    message_stripped = Optional[str]
    sender: str
    triggered_by: Optional[UserType]
    receiver: strawberry.ID
    read_at: Optional[datetime]
    snoozed_till: Optional[datetime]
    archived_at: Optional[datetime]
    entity_name: str
    entity_identifier: strawberry.ID
    data: JSON
    workspace: strawberry.ID
    project: Optional[ProjectType]
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def receiver(self) -> int:
        return self.receiver_id
