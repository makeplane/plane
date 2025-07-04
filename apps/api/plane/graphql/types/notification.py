# Python imports
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async

# Django imports
from django.db.models import Q
from strawberry.scalars import JSON

from plane.db.models import Issue, Notification
from plane.graphql.types.project import ProjectType
from plane.graphql.types.users import UserType
from plane.graphql.utils.issue_activity import issue_activity_comment_string

# Module imports
from plane.graphql.utils.timezone import user_timezone_converter


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
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def receiver(self) -> int:
        return self.receiver_id

    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
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
                    if (
                        old_value is not None
                        and old_value != ""
                        and old_value != "None"
                    ):
                        stripped_old_value = issue_activity_comment_string(
                            old_value
                        ).get("content")
                        if stripped_old_value is not None:
                            self.data["issue_activity"]["old_value"] = (
                                stripped_old_value
                            )

                    # handling the new value
                    if (
                        new_value is not None
                        and new_value != ""
                        and new_value != "None"
                    ):
                        stripped_new_value = issue_activity_comment_string(
                            new_value
                        ).get("content")
                        if stripped_new_value is not None:
                            self.data["issue_activity"]["new_value"] = (
                                stripped_new_value
                            )

            return self.data

        return await process_data()

    @strawberry.field
    async def is_intake_issue(self) -> bool:
        workspace_slug = await sync_to_async(lambda: self.workspace.slug)()
        work_item_id = self.entity_identifier

        if not workspace_slug or not work_item_id:
            return False

        is_intake_issue = await sync_to_async(list)(
            Issue.objects.filter(
                workspace__slug=workspace_slug,
                pk=work_item_id,
                issue_intake__status__in=[0, 2, -2],
            )
        )

        return bool(is_intake_issue)

    @strawberry.field
    async def is_mentioned_notification(self) -> bool:
        is_mentioned_notification = (
            True if "mentioned" in self.sender.lower() else False
        )

        return is_mentioned_notification

    @strawberry.field
    async def is_epic(self) -> bool:
        workspace_slug = await sync_to_async(lambda: self.workspace.slug)()
        work_item_id = self.entity_identifier

        if not work_item_id or not workspace_slug:
            return False

        is_epic_work_item = await sync_to_async(list)(
            Issue.objects.filter(
                pk=work_item_id, workspace__slug=workspace_slug
            ).filter(Q(type__isnull=False) & Q(type__is_epic=True))
        )

        return bool(is_epic_work_item)
