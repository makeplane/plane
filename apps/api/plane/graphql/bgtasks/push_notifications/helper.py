# Python imports
from typing import Optional

# Django imports
from django.conf import settings

# Module imports
from plane.db.models import Device, Notification, Workspace


def is_mobile_push_notification_disabled() -> bool:
    """Check if push notification is disabled."""
    if hasattr(settings, "IS_MOBILE_PUSH_NOTIFICATION_ENABLED"):
        return False if settings.IS_MOBILE_PUSH_NOTIFICATION_ENABLED else True
    return True


def fetch_device_tokens_by_user_id(user_id: str) -> list[str]:
    """Fetch device tokens for the user."""
    device_tokens = []

    try:
        devices = Device.objects.filter(
            user_id=user_id,
            is_active=True,
            push_token__isnull=False,
            deleted_at__isnull=True,
        )
        for device in devices:
            device_tokens.append(device.push_token)
    except Exception as e:
        print(f"Error fetching device tokens: {e}")

    return device_tokens


def notification_count(
    user_id: str,
    workspace_slug: Optional[str] = None,
    mentioned: bool = False,
    combined: bool = False,
) -> int:
    """Fetch unread notification count for the user."""

    try:
        notification_query = Notification.objects.filter(
            receiver_id=user_id,
            read_at__isnull=True,
            snoozed_till__isnull=True,
            archived_at__isnull=True,
        )

        # filter by workspace
        if workspace_slug:
            workspace = Workspace.objects.get(slug=workspace_slug)
            notification_query = notification_query.filter(workspace=workspace)

        # filter by mentioned
        if combined:
            if mentioned:
                notification_query = notification_query.filter(
                    sender__icontains="mentioned"
                )
            else:
                notification_query = notification_query.exclude(
                    sender__icontains="mentioned"
                )

        total_notification_count = notification_query.count()

        return total_notification_count
    except Workspace.DoesNotExist:
        return 0
    except Exception as e:
        print(f"Error fetching unread notification count: {e}")
        return 0
