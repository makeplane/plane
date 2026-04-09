# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from datetime import datetime
from typing import Optional

# Third-Party Imports
import strawberry
import strawberry_django

# Django imports
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.types import Info
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Notification
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.types.user import UserType
from plane.graphql.utils.issue_activity import issue_activity_comment_string
from plane.graphql.utils.timezone import user_timezone_converter

_NO_VALUE = object()


@strawberry.type
class NotificationCountBaseType:
    unread: Optional[int]
    mentioned: Optional[int]


@strawberry.type
class NotificationCountWorkspaceType(NotificationCountBaseType):
    id: str
    slug: str
    name: str


@strawberry.type
class NotificationCountType(NotificationCountBaseType):
    workspaces: Optional[list[NotificationCountWorkspaceType]]


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
    project: Optional[ProjectLiteType]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def receiver(self) -> int:
        return self.receiver_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    async def data(self) -> JSON:
        # handle the html and custom mention tags in comment and issue_activity
        @sync_to_async
        def process_data() -> JSON:
            issue_activity = self.data.get("issue_activity")
            if issue_activity is not None:
                field = issue_activity.get("field")
                old_value = issue_activity.get("old_value")
                new_value = issue_activity.get("new_value")

                if field == "comment":
                    # handling the old value
                    if old_value is not None and old_value != "" and old_value != "None":
                        stripped_old_value = issue_activity_comment_string(old_value).get("content")
                        if stripped_old_value is not None:
                            self.data["issue_activity"]["old_value"] = stripped_old_value

                    # handling the new value
                    if new_value is not None and new_value != "" and new_value != "None":
                        stripped_new_value = issue_activity_comment_string(new_value).get("content")
                        if stripped_new_value is not None:
                            self.data["issue_activity"]["new_value"] = stripped_new_value

            return self.data

        return await process_data()

    @strawberry.field
    def is_mentioned_notification(self) -> bool:
        return "mentioned" in self.sender.lower()

    @strawberry.field
    def intake_id(self) -> Optional[str]:
        annotated_intake_id = getattr(self, "intake_id", None)
        return str(annotated_intake_id) if annotated_intake_id is not None else None

    @strawberry.field
    def is_intake_issue(self) -> bool:
        return getattr(self, "intake_id", None) is not None

    @strawberry.field
    def is_epic(self) -> bool:
        return getattr(self, "is_epic_issue", False)
