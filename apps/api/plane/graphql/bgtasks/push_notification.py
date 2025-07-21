"""Firebase Cloud Messaging (FCM) Implementation"""

import base64

# Python imports
from enum import Enum
from typing import Optional

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
import firebase_admin
from firebase_admin import credentials, messaging
from bs4 import BeautifulSoup

# Module imports
from plane.db.models import Workspace, Device, User


def is_push_notification_disabled():
    if hasattr(settings, "IS_MOBILE_PUSH_NOTIFICATION_ENABLED"):
        return False if settings.IS_MOBILE_PUSH_NOTIFICATION_ENABLED else True
    return True


class PushNotificationTypes(Enum):
    """Enumeration of supported push notification types."""

    ISSUE_CREATED = "ISSUE_CREATED"
    ISSUE_UPDATED = "ISSUE_UPDATED"

    def __str__(self) -> str:
        return self.value


class PushNotification:
    """Handles push notifications using Firebase Cloud Messaging."""

    def __init__(self):
        """Initialize Firebase credentials on instantiation."""
        self.initialize_firebase()

    def decode_private_key(self, base64_string):
        """Decode the base64 encoded private key."""
        try:
            decoded_bytes = base64.b64decode(base64_string)
            private_key = decoded_bytes.decode("utf-8")

            if "-----BEGIN PRIVATE KEY-----" not in private_key:
                private_key = (
                    f"-----BEGIN PRIVATE KEY-----\n"
                    f"{private_key}\n"
                    f"-----END PRIVATE KEY-----"
                )

            return private_key
        except Exception as e:
            print(f"Error decoding private key: {str(e)}")
            return None

    def initialize_firebase(self) -> None:
        """Initialize Firebase Cloud Messaging with credentials from settings."""
        try:
            if is_push_notification_disabled():
                return

            #  convert private key from base64 to bytes
            private_key = (
                self.decode_private_key(settings.FIREBASE_PRIVATE_KEY)
                if settings.FIREBASE_PRIVATE_KEY
                else None
            )

            if private_key is not None:
                firebase_credentials = credentials.Certificate(
                    {
                        "type": "service_account",
                        "project_id": settings.FIREBASE_PROJECT_ID,
                        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                        "private_key": private_key,
                        "client_email": settings.FIREBASE_CLIENT_EMAIL,
                        "client_id": settings.FIREBASE_CLIENT_ID,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "universe_domain": "googleapis.com",
                    }
                )
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(firebase_credentials)
            return
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

    def send(
        self, title: str, body: str, device_token_id: str, data: Optional[dict] = {}
    ) -> dict:
        """Send push notifications to specified devices."""
        if is_push_notification_disabled():
            return "Mobile push notifications are disabled"

        try:
            if not all([title, body, device_token_id]):
                raise ValueError("Title, body, and device_token_id are required")

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=device_token_id,
            )

            response = messaging.send(message)

            return {
                "notification_success_count": response.success_count
                if response and hasattr(response, "success_count")
                else 0,
                "notification_failure_count": response.failure_count
                if response and hasattr(response, "failure_count")
                else 0,
            }
        except Exception as e:
            print(f"Error sending push notification: {e}")
            return {"status": "error", "error": str(e)}


def fetch_device_tokens(user_id):
    """Fetch device tokens for the user."""
    device_tokens = []

    try:
        devices = Device.objects.filter(
            user_id=user_id, is_active=True, push_token__isnull=False
        )

        for device in devices:
            device_tokens.append(device.push_token)

        return device_tokens
    except Exception as e:
        print(f"Error fetching device tokens: {e}")
        return device_tokens


@shared_task
def construct_issue_push_notification(notification):
    """Construct the issue push notification."""
    # getting the push token from the device with receiver_id

    receiver_id = notification.get("receiver", None)
    receiver_push_tokens = []

    if receiver_id is not None:
        receiver_push_tokens = fetch_device_tokens(receiver_id)

    if len(receiver_push_tokens) == 0:
        print("Receiver push token is not available")
        return

    # actor details
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

    notification_issue = notification.get("data", {}).get("issue", {})
    notification_issue_activity = notification.get("data", {}).get("issue_activity", {})

    workspace_id = notification.get("workspace", "")
    workspace_slug = ""
    project_id = notification.get("project", "")

    workspace = Workspace.objects.filter(id=workspace_id).first()
    if workspace and workspace.slug:
        workspace_slug = workspace.slug

    push_notification = {
        "id": notification.get("id", ""),
        "receiver": {"id": receiver_id, "push_tokens": receiver_push_tokens},
        "actor": {"id": actor_id, "name": actor_name},
        "issue": {
            "workspace_id": workspace_id,
            "workspace_slug": workspace_slug,
            "project_id": project_id,
            "project_identifier": notification_issue.get("identifier", ""),
            "id": notification_issue.get("id", ""),
            "name": notification_issue.get("name", ""),
            "sequence_id": notification_issue.get("sequence_id", ""),
        },
        "issue_activity": notification_issue_activity,
    }

    return push_notification


def comment_content(html_content):
    soup = BeautifulSoup(html_content, "html.parser")

    user_mentions = {}
    user_push_tokens = {}

    for mention_tag in soup.find_all(
        "mention-component", attrs={"entity_name": "user_mention"}
    ):
        entity_identifier = mention_tag.get("entity_identifier", "")

        user = User.objects.filter(id=entity_identifier).first()
        device = Device.objects.filter(
            user_id=entity_identifier, is_active=True, push_token__isnull=False
        ).first()

        user_mentions[entity_identifier] = user if user else None
        user_push_tokens[entity_identifier] = device.push_token if device else None

        mention_tag.replace_with(
            user.display_name
            if user.display_name
            else user.first_name
            if user.first_name
            else user.email
            if user
            else ""
        )

    for tag in soup.find_all(True):
        tag.replace_with(tag.text)

    plain_text = soup.get_text()

    return {
        "mention_objects": user_mentions,
        "user_push_tokens": user_push_tokens,
        "content": plain_text,
    }


@shared_task
def issue_push_notifications(notification):
    print("====== sending issue properties push notification to mobile ======")

    if is_push_notification_disabled():
        return

    notification = construct_issue_push_notification(notification)

    if notification is None:
        print("Notification is None")
        return

    notification_id = notification.get("id", None)
    notification_receiver = notification.get("receiver", None)
    notification_actor = notification.get("actor", None)
    notification_issue = notification.get("issue", None)
    notification_issue_activity = notification.get("issue_activity", None)

    if not all(
        [
            notification_receiver,
            notification_actor,
            notification_issue,
            notification_issue_activity,
        ]
    ):
        return

    actor_id = notification_actor.get("id", "")
    actor_name = notification_actor.get("name", "")

    workspace_slug = notification_issue.get("workspace_slug", "")
    project_id = notification_issue.get("project_id", "")
    project_identifier = notification_issue.get("project_identifier", "")
    issue_id = notification_issue.get("id", "")
    issue_name = notification_issue.get("name", "")
    issue_sequence_id = notification_issue.get("sequence_id", "")

    receiver_id = notification_receiver.get("id", "")
    receiver_push_tokens = notification_receiver.get("push_tokens", "")
    mention_push_tokens = []

    issue_activity_id = notification_issue_activity.get("id", "")
    issue_activity_field = notification_issue_activity.get("field", None)
    issue_activity_new_value = notification_issue_activity.get("new_identifier", None)
    issue_comment_id = (
        issue_activity_new_value
        if issue_activity_field == "comment" and issue_activity_new_value
        else ""
    )

    title = f"{project_identifier}-{issue_sequence_id} - {issue_name}"
    data = {
        "type": PushNotificationTypes.ISSUE_UPDATED.value,
        "workspaceSlug": workspace_slug,
        "projectId": project_id,
        "issueId": issue_id,
        "userId": receiver_id,
        "notificationId": notification_id,
        "issue_activity_id": issue_activity_id,
        "issue_comment_id": issue_comment_id,
    }

    property_key = notification_issue_activity.get("field", "")
    old_value = notification_issue_activity.get("old_value", "")
    new_value = notification_issue_activity.get("new_value", "")

    body = None

    # title, state, and priority
    if property_key in ["name", "state", "priority"]:
        body = f"{actor_name} set the {property_key} to {new_value}"
    # assignees and labels
    elif property_key in ["assignees", "labels"]:
        body = (
            f"{actor_name} "
            f"{'added a new' if new_value else 'removed the'} "
            f"{'assignee' if property_key == 'assignees' else 'label'} "
            f"{new_value if new_value else old_value}"
        )
    # start_date and target_date
    elif property_key in ["start_date", "target_date"]:
        body = (
            f"{actor_name} "
            f"{'set the' if new_value else 'removed the'} "
            f"{'start' if property_key == 'start_date' else 'due'} date "
            f"{f'to {new_value}' if new_value else ''}"
        )
    # parent
    elif property_key == "parent":
        body = (
            f"{actor_name} "
            f"{'set the' if new_value else 'removed the'} parent "
            f"{f'to {new_value}' if new_value else old_value}"
        )
    # link
    elif property_key == "link":
        body = (
            f"{actor_name} "
            f"{'added' if new_value else 'removed this'} link "
            f"{new_value if new_value else old_value}"
        )
    # attachment
    elif property_key == "attachment":
        body = (
            f"{actor_name} {'updated a new' if new_value else 'removed an'} attachment"
        )
    # relations -> relates_to
    elif property_key == "relates_to":
        body = (
            f"{actor_name} "
            f"{'marked that this issue' if new_value else 'removed the relation'} "
            f"{'relates to' if new_value else 'from'} "
            f"{f'to {new_value}' if new_value else old_value}"
        )
    # relation -> duplicate and blocked_by
    elif property_key in ["duplicate", "blocked_by"]:
        body = (
            f"{actor_name} "
            f"{'marked this issue' if new_value else 'removed this issue'} "
            "as a duplicate of "
            if property_key == "duplicate"
            else f"{'is being blocked by' if new_value else 'being blocked by'} "
            f"{f'to {new_value}' if new_value else old_value}"
        )
    # relation -> blocking
    elif property_key == "blocking":
        body = (
            f"{actor_name} "
            f"{'marked that this issue' if new_value else 'removed the'} "
            f"{'is blocking issue' if new_value else 'blocking issue'} "
            f"{f'to {new_value}' if new_value else old_value}"
        )
    # comment and comment mention
    elif property_key == "comment":
        content = None if new_value == "None" and old_value == "None" else new_value
        comment_data = comment_content(content) if content else None
        body = (
            f"{actor_name} "
            f"{'removed the comment' if new_value == 'None' and old_value == 'None' else 'updated the comment' if old_value != 'None' else 'commented'} "
            f"{comment_data['content'] if comment_data else ''}"
        )

        # validate mentions in the comment
        mentions = (
            comment_data["mention_objects"]
            if comment_data and comment_data["mention_objects"]
            else None
        )
        if mentions:
            body = (
                f"{actor_name} has mentioned you in a comment in issue "
                f"{project_identifier}-{issue_sequence_id} - {issue_name}"
            )

            user_push_tokens = comment_data["user_push_tokens"]
            for user_id in mentions.items():
                push_token = user_push_tokens.get(user_id)
                if push_token and push_token in receiver_push_tokens:
                    receiver_push_tokens.remove(push_token)
                    mention_push_tokens.append(push_token)
    elif body is None:
        return

    push_notification = PushNotification()

    for token in receiver_push_tokens:
        push_notification.send(title=title, body=body, device_token_id=token, data=data)

    for token in mention_push_tokens:
        push_notification.send(title=title, body=body, device_token_id=token, data=data)

    print(
        "===== sending issue properties push notification to mobile is successful ====="
    )

    return
