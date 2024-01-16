# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import EmailNotificationLog, User, Issue


@shared_task
def stack_email_notification():
    # get all email notifications
    email_notifications = (
        EmailNotificationLog.objects.filter(processed_at__isnull=True)
        .order_by("receiver")
        .values()
    )

    # {"issue_id" : { "actor_id": [ { data }, { data } ] }}

    # Convert to unique receivers list
    receivers = list(
        set(
            [
                str(notification.get("receiver_id"))
                for notification in email_notifications
            ]
        )
    )
    processed_notifications = []
    # Loop through all the issues to create the emails
    for receiver_id in receivers:
        # Notifcation triggered for the receiver
        receiver_notifications = [
            notification
            for notification in email_notifications
            if str(notification.get("receiver_id")) == receiver_id
        ]
        # create payload for all issues
        payload = {}
        email_notification_ids = []
        for receiver_notification in receiver_notifications:
            payload.setdefault(
                receiver_notification.get("entity_identifier"), {}
            ).setdefault(str(receiver_notification.get("triggered_by_id")), []).append(
                receiver_notification.get("data")
            )
            # append processed notifications
            processed_notifications.append(receiver_notification.get("id"))
            email_notification_ids.append(receiver_notification.get("id"))

        # Create emails for all the issues
        for issue_id, issue_data in payload.items():
            send_email_notification.delay(
                issue_id=issue_id,
                issue_data=issue_data,
                receiver_id=receiver_id,
                email_notification_ids=email_notification_ids,
            )

    # Update the email notification log
    EmailNotificationLog.objects.filter(pk__in=processed_notifications).update(
        processed_at=timezone.now()
    )


def create_payload(payload):
    # {"actor_id":  { "key": { "old_value": [], "new_value": [] } }}
    data = {}
    for actor_id, changes in payload.items():
        for change in changes:
            issue_activity = change.get("issue_activity")
            if issue_activity:  # Ensure issue_activity is not None
                field = issue_activity.get("field")
                old_value = issue_activity.get("old_value")
                new_value = issue_activity.get("new_value")

                # Append old_value if it's not empty and not already in the list
                if old_value:
                    data.setdefault(actor_id, {}).setdefault(field, {}).setdefault(
                        "old_value", []
                    ).append(old_value) if old_value not in data.setdefault(
                        actor_id, {}
                    ).setdefault(
                        field, {}
                    ).get(
                        "old_value", []
                    ) else None

                # Append new_value if it's not empty and not already in the list
                if new_value:
                    data.setdefault(actor_id, {}).setdefault(field, {}).setdefault(
                        "new_value", []
                    ).append(new_value) if new_value not in data.setdefault(
                        actor_id, {}
                    ).setdefault(
                        field, {}
                    ).get(
                        "new_value", []
                    ) else None

    return data


@shared_task
def send_email_notification(issue_id, issue_data, receiver_id, email_notification_ids):
    data = create_payload(payload=issue_data)

    receiver = User.objects.get(pk=receiver_id)
    issue = Issue.objects.get(pk=issue_id)
    template_data = []
    for actor_id, changes in data.items():
        actor = User.objects.get(pk=actor_id)
        template_data.append(
            {
                "actor_details": {
                    "avatar": actor.avatar,
                    "first_name": actor.first_name,
                    "last_name": actor.last_name,
                },
                "changes": changes,
                "issue_details": {
                    "name": issue.name,
                    "identifier": f"{issue.project.identifier}-{issue.sequence_id}",
                },
            }
        )
    
    EmailNotificationLog.objects.filter(pk__in=email_notification_ids).update(
        sent_at=timezone.now()
    )
