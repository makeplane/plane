# Python imports
from enum import Enum

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import User, Workspace
from plane.graphql.helpers.catch_up import push_notification_catch_up

# Local module imports
from .firebase import PushNotification
from .helper import (
    fetch_device_tokens_by_user_id,
    is_mobile_push_notification_disabled,
    notification_count,
)
from .issue_builder import Actor, IssueNotificationBuilder


class IssuePushNotificationTypes(Enum):
    """Enumeration of supported push notification types."""

    ISSUE_CREATED = "ISSUE_CREATED"
    ISSUE_UPDATED = "ISSUE_UPDATED"
    EPIC_CREATED = "EPIC_CREATED"
    EPIC_UPDATED = "EPIC_UPDATED"
    INTAKE_CREATED = "INTAKE_CREATED"
    INTAKE_UPDATED = "INTAKE_UPDATED"

    def __str__(self) -> str:
        return self.value


def construct_issue_notification_details(notification: dict) -> dict:
    """Construct the issue push notification details."""
    try:
        # notification details
        notification_id = notification.get("id", "")

        # notification issue and issue activity details
        notification_issue = notification.get("data", {}).get("issue", {})
        notification_issue_activity = notification.get("data", {}).get(
            "issue_activity", {}
        )

        # sender actor details
        actor_details = notification.get("triggered_by_details", {})
        actor_id = actor_details.get("id", "")
        actor_display_name = actor_details.get("display_name", "")
        actor_first_name = actor_details.get("first_name", "")
        actor_last_name = actor_details.get("last_name", "")
        actor_name = (
            actor_display_name
            if actor_display_name
            else f"{actor_first_name} {actor_last_name}"
        )

        # receiver actor details
        receiver_id = notification.get("receiver", None)
        receiver_name = ""
        if receiver_id is not None:
            receiver_details = User.objects.filter(id=receiver_id).first()
            if receiver_details:
                receiver_display_name = receiver_details.display_name or ""
                receiver_first_name = receiver_details.first_name or ""
                receiver_last_name = receiver_details.last_name or ""
                receiver_name = (
                    receiver_display_name
                    if receiver_display_name
                    else f"{receiver_first_name} {receiver_last_name}"
                )

        # workspace details
        workspace_id = notification.get("workspace", "")
        workspace_slug = ""
        workspace = Workspace.objects.filter(id=workspace_id).first()
        if workspace and workspace.slug:
            workspace_slug = workspace.slug

        # project details
        project_id = notification.get("project", "")
        project_identifier = notification_issue.get("identifier", "")

        # getting the push token from the device with receiver_id
        receiver_push_tokens = []
        if receiver_id is not None:
            receiver_push_tokens = fetch_device_tokens_by_user_id(receiver_id)
        if len(receiver_push_tokens) == 0:
            print("Receiver push token is not available")
            return

        # push notification details
        push_notification = {
            "id": notification_id,
            "workspace": {
                "id": workspace_id,
                "slug": workspace_slug,
            },
            "project": {
                "id": project_id,
                "identifier": project_identifier,
            },
            "sender": {"id": actor_id, "name": actor_name},
            "receiver": {
                "id": receiver_id,
                "name": receiver_name,
                "push_tokens": receiver_push_tokens,
            },
            "issue": {
                "id": notification_issue.get("id", ""),
                "sequence_id": notification_issue.get("sequence_id", ""),
                "name": notification_issue.get("name", ""),
            },
            "activity": {
                "id": notification_issue_activity.get("id", ""),
                "verb": notification_issue_activity.get("verb", ""),
                "field": notification_issue_activity.get("field", ""),
                "actor": notification_issue_activity.get("actor", ""),
                "new_value": notification_issue_activity.get("new_value", ""),
                "old_value": notification_issue_activity.get("old_value", ""),
                "old_identifier": notification_issue_activity.get("old_identifier", ""),
                "issue_comment": notification_issue_activity.get("issue_comment", ""),
                "new_identifier": notification_issue_activity.get("new_identifier", ""),
                "old_identifier_type": notification_issue_activity.get(
                    "old_identifier_type", ""
                ),
            },
        }

        return push_notification
    except Exception as e:
        print(f"Error constructing issue notification details: {e}")
        raise e


@shared_task
def issue_push_notifications(notification):
    try:
        print("=== sending issue properties push notification to mobile ===")

        if is_mobile_push_notification_disabled():
            return

        notification = construct_issue_notification_details(notification)
        if notification is None:
            print("=== Notification is None ===")
            return

        notification_id = notification.get("id", None)
        notification_sender = notification.get("sender", None)
        notification_receiver = notification.get("receiver", None)
        notification_workspace = notification.get("workspace", None)
        notification_project = notification.get("project", None)
        notification_issue = notification.get("issue", None)
        notification_issue_activity = notification.get("activity", None)

        if not all(
            [
                notification_receiver,
                notification_sender,
                notification_issue,
                notification_issue_activity,
            ]
        ):
            return

        # sender details
        sender_id = notification_sender.get("id", "")
        sender_name = notification_sender.get("name", "")

        # receiver details
        receiver_id = notification_receiver.get("id", "")
        receiver_name = notification_receiver.get("name", "")

        # workspace details
        workspace_slug = notification_workspace.get("slug", "")

        # project details
        project_id = notification_project.get("id", "")
        project_identifier = notification_project.get("identifier", "")

        # issue details
        issue_id = notification_issue.get("id", "")
        issue_name = notification_issue.get("name", "")
        issue_sequence_id = notification_issue.get("sequence_id", "")

        # issue activity details
        issue_activity_id = notification_issue_activity.get("id", "")
        issue_activity_field = notification_issue_activity.get("field", None)
        issue_activity_new_value = notification_issue_activity.get(
            "new_identifier", None
        )
        issue_comment_id = (
            issue_activity_new_value
            if issue_activity_field == "comment" and issue_activity_new_value
            else ""
        )

        # unread notification count
        unread_notification_count = notification_count(
            user_id=receiver_id, workspace_slug=None, mentioned=False, combined=True
        )

        # push tokens
        receiver_push_tokens = notification_receiver.get("push_tokens", [])
        mention_push_tokens = []

        catch_up = push_notification_catch_up(
            workspace_slug=workspace_slug,
            user_id=receiver_id,
            entity_identifier=issue_id,
        )

        title = f"{project_identifier}-{issue_sequence_id} - {issue_name}"
        data = {
            # deprecated fields
            "workspaceSlug": workspace_slug,
            "projectId": project_id,
            "issueId": issue_id,
            "userId": receiver_id,
            "notificationId": notification_id,
            # new fields
            "type": IssuePushNotificationTypes.ISSUE_UPDATED.value,
            "user_id": receiver_id,
            "workspace_slug": workspace_slug,
            "project_id": project_id,
            "issue_id": issue_id,
            "epic_id": "",
            "intake_id": "",
            "notification_id": notification_id,
            "issue_activity_id": issue_activity_id,
            "issue_comment_id": issue_comment_id,
            "unread_notification_count": str(unread_notification_count),
        }

        if catch_up:
            data["catch_up"] = catch_up

        property_key = notification_issue_activity.get("field", "")
        old_value = notification_issue_activity.get("old_value", "")
        new_value = notification_issue_activity.get("new_value", "")
        old_identifier = notification_issue_activity.get("old_identifier", "")
        new_identifier = notification_issue_activity.get("new_identifier", "")

        body = None
        issue_notification_description_builder = IssueNotificationBuilder(
            sender=Actor(id=sender_id, name=sender_name),
            receiver=Actor(id=receiver_id, name=receiver_name),
            property_key=property_key,
            old_value=old_value,
            new_value=new_value,
            old_identifier=old_identifier,
            new_identifier=new_identifier,
        )
        body = issue_notification_description_builder.build_notification() or ""

        if body is None:
            print("=== notification body is None ===")
            return

        # push notification
        push_notification = PushNotification()

        for token in receiver_push_tokens:
            push_notification.send(
                title=title,
                body=body,
                device_token_id=token,
                data=data,
                notification_count=unread_notification_count,
            )

        for token in mention_push_tokens:
            push_notification.send(
                title=title,
                body=body,
                device_token_id=token,
                data=data,
                notification_count=unread_notification_count,
            )

        print(
            "=== sending issue properties push notification to mobile is successful ==="
        )

        return
    except Exception as e:
        print(f"Error sending issue push notification: {e}")
        raise e
