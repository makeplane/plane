# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
import re
from datetime import datetime

from bs4 import BeautifulSoup

# Third party imports
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import EmailNotificationLog, Issue, User
from plane.license.utils.instance_value import get_email_configuration
from plane.settings.redis import redis_instance
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception


def remove_unwanted_characters(input_text):
    # Remove only control characters and potentially problematic characters for email subjects
    processed_text = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", input_text)
    return processed_text


# acquire and delete redis lock
def acquire_lock(lock_id, expire_time=300):
    redis_client = redis_instance()
    """Attempt to acquire a lock with a specified expiration time."""
    return redis_client.set(lock_id, "true", nx=True, ex=expire_time)


def release_lock(lock_id):
    """Release a lock."""
    redis_client = redis_instance()
    redis_client.delete(lock_id)


@shared_task
def stack_email_notification():
    # get all email notifications
    email_notifications = EmailNotificationLog.objects.filter(processed_at__isnull=True).order_by("receiver").values()

    # Create the below format for each of the issues
    # {"issue_id" : { "actor_id1": [ { data }, { data } ], "actor_id2": [ { data }, { data } ] }}

    # Convert to unique receivers list
    receivers = list(set([str(notification.get("receiver_id")) for notification in email_notifications]))
    processed_notifications = []
    # Loop through all the issues to create the emails
    for receiver_id in receivers:
        # Notification triggered for the receiver
        receiver_notifications = [
            notification for notification in email_notifications if str(notification.get("receiver_id")) == receiver_id
        ]
        # create payload for all issues
        payload = {}
        email_notification_ids = []
        for receiver_notification in receiver_notifications:
            payload.setdefault(receiver_notification.get("entity_identifier"), {}).setdefault(
                str(receiver_notification.get("triggered_by_id")), []
            ).append(receiver_notification.get("data"))
            # append processed notifications
            processed_notifications.append(receiver_notification.get("id"))
            email_notification_ids.append(receiver_notification.get("id"))

        # Create emails for all the issues
        for issue_id, notification_data in payload.items():
            send_email_notification.delay(
                issue_id=issue_id,
                notification_data=notification_data,
                receiver_id=receiver_id,
                email_notification_ids=email_notification_ids,
            )

    # Update the email notification log
    EmailNotificationLog.objects.filter(pk__in=processed_notifications).update(processed_at=timezone.now())


# Values that must never appear as email field/comment content.
# notification_task uses str(None) → "None" for deleted comments and empty fields.
_EMPTY_ACTIVITY_VALUES = frozenset({"", "None", "null", "none", "NULL", "NoneType"})


def is_meaningful_activity_value(value):
    """Return True if value is real user-facing content (not None / "None" / blank)."""
    if value is None:
        return False
    if not isinstance(value, str):
        value = str(value)
    return value.strip() not in _EMPTY_ACTIVITY_VALUES


def absolute_avatar_url(base_api, avatar_url):
    """
    Build an absolute avatar URL for email HTML, or "" for the initials fallback.

    Upstream bug: f\"{base_api}{actor.avatar_url}\" when avatar_url is None becomes
    \"https://hostNone\", which is truthy in the template so clients show a broken
    image icon instead of the letter avatar.
    """
    if not avatar_url or not is_meaningful_activity_value(str(avatar_url)):
        return ""
    url = str(avatar_url).strip()
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if not base_api:
        return url
    base = str(base_api).rstrip("/")
    if not url.startswith("/"):
        url = f"/{url}"
    return f"{base}{url}"


def create_payload(notification_data):
    # return format {"actor_id":  { "key": { "old_value": [], "new_value": [] } }}
    data = {}
    for actor_id, changes in notification_data.items():
        for change in changes:
            issue_activity = change.get("issue_activity")
            if not issue_activity:
                continue

            field = issue_activity.get("field")
            verb = issue_activity.get("verb")

            # Deleted comments leave new_value/old_value as None → str → "None".
            # Including them produces unprofessional "None" boxes in the Comments section.
            if verb == "deleted" and field in ("comment", "mention"):
                continue

            old_value = issue_activity.get("old_value")
            new_value = issue_activity.get("new_value")
            if old_value is not None:
                old_value = str(old_value)
            if new_value is not None:
                new_value = str(new_value)

            # Append old_value if meaningful and not already in the list
            if is_meaningful_activity_value(old_value):
                old_list = data.setdefault(actor_id, {}).setdefault(field, {}).setdefault("old_value", [])
                if old_value not in old_list:
                    old_list.append(old_value)

            # Append new_value if meaningful and not already in the list
            if is_meaningful_activity_value(new_value):
                new_list = data.setdefault(actor_id, {}).setdefault(field, {}).setdefault("new_value", [])
                if new_value not in new_list:
                    new_list.append(new_value)

            # activity_time: only set when we have (or will have) payload for this actor
            activity_time = issue_activity.get("activity_time")
            if activity_time and actor_id in data and "activity_time" not in data[actor_id]:
                data[actor_id]["activity_time"] = str(
                    datetime.fromisoformat(str(activity_time).rstrip("Z")).strftime("%Y-%m-%d %H:%M:%S")
                )

    return data


def process_email_html(html_content):
    """
    Convert TipTap/editor HTML into email-safe HTML.

    - mention-component → @display_name
    - image-component → [Image] placeholder (asset UUIDs are not public URLs)
    - issue-embed-component → [Work item] placeholder
    """
    if not is_meaningful_activity_value(html_content):
        return None

    soup = BeautifulSoup(html_content, "html.parser")

    for mention in soup.find_all("mention-component"):
        user_id = mention.get("entity_identifier")
        try:
            user = User.objects.get(pk=user_id)
            mention.replace_with(f"@{user.display_name}")
        except Exception:
            mention.replace_with("@user")

    for image in soup.find_all("image-component"):
        image.replace_with("[Image]")

    for embed in soup.find_all("issue-embed-component"):
        label = embed.get("entity_name") or "Work item"
        embed.replace_with(f"[{label}]")

    # Drop empty paragraphs left after stripping custom nodes
    text = str(soup).strip()
    if not text or not BeautifulSoup(text, "html.parser").get_text(strip=True):
        # Still allow content that is only images/embeds converted to placeholders
        if "[Image]" not in text and "[" not in text:
            return None
    return text


def process_mention(mention_component):
    """Backward-compatible alias used by existing call sites / tests."""
    return process_email_html(mention_component) or ""


def process_html_content(content):
    """Process a list of HTML fragments for email. Drops empty / None / 'None' entries."""
    if content is None:
        return None
    processed_content_list = []
    for html_content in content:
        processed_content = process_email_html(html_content)
        if is_meaningful_activity_value(processed_content):
            processed_content_list.append(processed_content)
    return processed_content_list or None


@shared_task
def send_email_notification(issue_id, notification_data, receiver_id, email_notification_ids):
    # Convert UUIDs to a sorted, concatenated string
    sorted_ids = sorted(email_notification_ids)
    ids_str = "_".join(str(id) for id in sorted_ids)
    lock_id = f"send_email_notif_{issue_id}_{receiver_id}_{ids_str}"

    # acquire the lock for sending emails
    try:
        if acquire_lock(lock_id=lock_id):
            # get the redis instance
            ri = redis_instance()
            base_api = ri.get(str(issue_id)).decode() if ri.get(str(issue_id)) else None

            # Skip if base api is not present
            if not base_api:
                return

            data = create_payload(notification_data=notification_data)

            # Get email configurations
            (
                EMAIL_HOST,
                EMAIL_HOST_USER,
                EMAIL_HOST_PASSWORD,
                EMAIL_PORT,
                EMAIL_USE_TLS,
                EMAIL_USE_SSL,
                EMAIL_FROM,
            ) = get_email_configuration()

            receiver = User.objects.get(pk=receiver_id)
            issue = Issue.objects.get(pk=issue_id)
            template_data = []
            total_changes = 0
            comments = []
            actors_involved = []
            for actor_id, changes in data.items():
                actor = User.objects.get(pk=actor_id)
                total_changes = total_changes + len(changes)
                comment = changes.pop("comment", False)
                mention = changes.pop("mention", False)
                activity_time = changes.pop("activity_time", None)
                actors_involved.append(actor_id)

                # Comments and mentions both need TipTap HTML converted for email clients.
                # Previously only mentions were processed, so raw mention-component /
                # image-component tags and str(None)→"None" deleted-comment residue
                # rendered as broken form-like boxes (see issue-updates Comments section).
                if comment:
                    comment["new_value"] = process_html_content(comment.get("new_value"))
                    comment["old_value"] = process_html_content(comment.get("old_value"))
                    if comment.get("new_value"):
                        comments.append(
                            {
                                "actor_comments": comment,
                                "actor_detail": {
                                    "avatar_url": absolute_avatar_url(base_api, actor.avatar_url),
                                    "first_name": actor.first_name,
                                    "last_name": actor.last_name,
                                },
                            }
                        )
                if mention:
                    mention["new_value"] = process_html_content(mention.get("new_value"))
                    mention["old_value"] = process_html_content(mention.get("old_value"))
                    if mention.get("new_value"):
                        comments.append(
                            {
                                "actor_comments": mention,
                                "actor_detail": {
                                    "avatar_url": absolute_avatar_url(base_api, actor.avatar_url),
                                    "first_name": actor.first_name,
                                    "last_name": actor.last_name,
                                },
                            }
                        )

                # Skip property-update block if no real field changes remain
                if changes and activity_time:
                    formatted_time = datetime.strptime(activity_time, "%Y-%m-%d %H:%M:%S").strftime("%H:%M %p")
                    template_data.append(
                        {
                            "actor_detail": {
                                "avatar_url": absolute_avatar_url(base_api, actor.avatar_url),
                                "first_name": actor.first_name,
                                "last_name": actor.last_name,
                            },
                            "changes": changes,
                            "issue_details": {
                                "name": issue.name,
                                "identifier": f"{issue.project.identifier}-{issue.sequence_id}",
                            },
                            "activity_time": str(formatted_time),
                        }
                    )

            # Nothing meaningful to email (e.g. only deleted comments / empty "None" values)
            if not template_data and not comments:
                logging.getLogger("plane.worker").info(
                    "Skipping empty issue-update email for issue %s receiver %s",
                    issue_id,
                    receiver_id,
                )
                release_lock(lock_id=lock_id)
                return

            summary = "Updates were made to the issue by"

            # Send the mail
            subject = f"{issue.project.identifier}-{issue.sequence_id} {remove_unwanted_characters(issue.name)}"
            context = {
                "data": template_data,
                "summary": summary,
                "actors_involved": len(set(actors_involved)),
                "issue": {
                    "issue_identifier": f"{str(issue.project.identifier)}-{str(issue.sequence_id)}",
                    "name": issue.name,
                    "issue_url": f"{base_api}/{str(issue.project.workspace.slug)}/projects/{str(issue.project.id)}/issues/{str(issue.id)}",  # noqa: E501
                },
                "receiver": {"email": receiver.email},
                "issue_url": f"{base_api}/{str(issue.project.workspace.slug)}/projects/{str(issue.project.id)}/issues/{str(issue.id)}",  # noqa: E501
                "project_url": f"{base_api}/{str(issue.project.workspace.slug)}/projects/{str(issue.project.id)}/issues/",  # noqa: E501
                "workspace": str(issue.project.workspace.slug),
                "project": str(issue.project.name),
                "user_preference": f"{base_api}/{str(issue.project.workspace.slug)}/settings/account/notifications/",
                "comments": comments,
                "entity_type": "issue",
            }
            html_content = render_to_string("emails/notifications/issue-updates.html", context)
            text_content = generate_plain_text_from_html(html_content)

            try:
                connection = get_connection(
                    host=EMAIL_HOST,
                    port=int(EMAIL_PORT),
                    username=EMAIL_HOST_USER,
                    password=EMAIL_HOST_PASSWORD,
                    use_tls=EMAIL_USE_TLS == "1",
                    use_ssl=EMAIL_USE_SSL == "1",
                )

                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=EMAIL_FROM,
                    to=[receiver.email],
                    connection=connection,
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()
                logging.getLogger("plane.worker").info("Email Sent Successfully")

                # Update the logs
                EmailNotificationLog.objects.filter(pk__in=email_notification_ids).update(sent_at=timezone.now())

                # release the lock
                release_lock(lock_id=lock_id)
                return
            except Exception as e:
                log_exception(e)
                # release the lock
                release_lock(lock_id=lock_id)
                return
        else:
            logging.getLogger("plane.worker").info("Duplicate email received skipping")
            return
    except (Issue.DoesNotExist, User.DoesNotExist):
        release_lock(lock_id=lock_id)
        return
    except Exception as e:
        log_exception(e)
        release_lock(lock_id=lock_id)
        return
