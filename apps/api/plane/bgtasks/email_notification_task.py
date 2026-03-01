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
from plane.db.models import EmailNotificationLog, Issue, User, IssueSubscriber, UserNotificationPreference

from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception
from plane.db.models.notification import EntityName
from plane.ee.models import Teamspace, Initiative
from django.conf import settings


def remove_unwanted_characters(input_text):
    # Remove only control characters and potentially problematic characters for email subjects
    processed_text = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", input_text)
    return processed_text


@shared_task
def stack_email_notification():
    # get all email notifications
    email_notifications = EmailNotificationLog.objects.filter(processed_at__isnull=True).order_by("receiver").values()

    # Group by receiver_id AND entity_name to handle different entity types separately
    receivers_entities = list(
        set(
            [
                (str(notification.get("receiver_id")), notification.get("entity_name"))
                for notification in email_notifications
            ]
        )
    )

    processed_notifications = []

    for receiver_id, entity_name in receivers_entities:
        # Get notifications for this specific receiver AND entity_name combination
        receiver_notifications = [
            notification
            for notification in email_notifications
            if str(notification.get("receiver_id")) == receiver_id and notification.get("entity_name") == entity_name
        ]

        # Create payload for this entity type only
        payload = {}
        entity_notification_ids = {}

        for receiver_notification in receiver_notifications:
            entity_identifier = receiver_notification.get("entity_identifier")
            payload.setdefault(receiver_notification.get("entity_identifier"), {}).setdefault(
                str(receiver_notification.get("triggered_by_id")), []
            ).append(receiver_notification.get("data"))

            # Track processed notifications and IDs
            entity_notification_ids.setdefault(entity_identifier, []).append(receiver_notification.get("id"))

            # Track processed notifications for this entity
            processed_notifications.append(receiver_notification.get("id"))

        # send emails after processing all notifications for this receiver+entity combo
        if (
            entity_name == EntityName.ISSUE.value
            or entity_name == EntityName.EPIC.value
            or entity_name == EntityName.EPIC_UPDATE.value
            or entity_name == EntityName.INTAKE.value
        ):
            # Create emails for all the issues
            for issue_id, notification_data in payload.items():
                send_email_notification.delay(
                    issue_id=issue_id,
                    notification_data=notification_data,
                    receiver_id=receiver_id,
                    email_notification_ids=entity_notification_ids[issue_id],
                    entity_name=entity_name,
                )
        else:
            # Handle workspace-level entities (TEAMSPACE, INITIATIVE, etc.)
            for entity_id, notification_data in payload.items():
                send_workspace_level_email_notification.delay(
                    entity_id=entity_id,
                    entity_name=entity_name,
                    notification_data=notification_data,
                    receiver_id=receiver_id,
                    email_notification_ids=entity_notification_ids[entity_id],
                )

    # Update the email notification log
    EmailNotificationLog.objects.filter(pk__in=processed_notifications).update(processed_at=timezone.now())


def create_payload(notification_data, entity_name):
    # return format {"actor_id":  { "key": { "old_value": [], "new_value": [] } }}
    data = {}

    for actor_id, changes in notification_data.items():
        for change in changes:
            entity_activity = change.get(f"{entity_name}_activity", None)

            epic_update = change.get("epic_update", None)

            if entity_activity:
                field = entity_activity.get("field")
                old_value = str(entity_activity.get("old_value"))
                new_value = str(entity_activity.get("new_value"))

                # Append old_value if it's not empty and not already in the list
                if old_value:
                    (
                        data.setdefault(actor_id, {})
                        .setdefault(field, {})
                        .setdefault("old_value", [])
                        .append(old_value)
                        if old_value not in data.setdefault(actor_id, {}).setdefault(field, {}).get("old_value", [])
                        else None
                    )

                if new_value:
                    (
                        data.setdefault(actor_id, {})
                        .setdefault(field, {})
                        .setdefault("new_value", [])
                        .append(new_value)
                        if new_value not in data.setdefault(actor_id, {}).setdefault(field, {}).get("new_value", [])
                        else None
                    )

                if not data.get("actor_id", {}).get("activity_time", False):
                    data[actor_id]["activity_time"] = str(
                        datetime.fromisoformat(entity_activity.get("activity_time").rstrip("Z")).strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                    )

            elif epic_update:
                field = str(epic_update.get("field", ""))
                status = str(epic_update.get("status", ""))
                description = str(epic_update.get("description", ""))
                activity_time = str(epic_update.get("activity_time", ""))
                total_workitems = epic_update.get("total_workitems", 0)
                completed_workitems = epic_update.get("completed_workitems", 0)
                if completed_workitems > 0 and total_workitems > 0:
                    progress = round((completed_workitems / total_workitems) * 100)
                else:
                    progress = 0

                data[actor_id] = {
                    "status": status,
                    "field": field,
                    "description": description,
                    "activity_time": datetime.fromisoformat(activity_time).strftime("%d %b, %Y"),
                    "total_workitems": str(total_workitems),
                    "completed_workitems": str(completed_workitems),
                    "progress": str(progress),
                }

    return data


@shared_task
def create_emaillogs_for_epic_updates(epic_entity_update, actor_id, origin, verb):
    # Check for user preference notification
    epic_id = epic_entity_update["epic"]
    subscriber_ids = IssueSubscriber.objects.filter(issue_id=epic_id).values_list("subscriber_id", flat=True)

    for subscriber_id in subscriber_ids:
        preference = UserNotificationPreference.objects.get(user_id=subscriber_id)

        if preference.comment:
            EmailNotificationLog.objects.create(
                triggered_by_id=actor_id,
                receiver_id=subscriber_id,
                entity_identifier=epic_id,
                entity_name="epic-update",
                data={
                    "epic": {
                        "id": str(epic_id),
                        "name": str(epic_entity_update["epic_name"]),
                        "identifier": str(epic_entity_update["project_identifier"]),
                        "sequence_id": str(epic_entity_update["epic_sequence_id"]),
                    },
                    "epic_update": {
                        "id": str(epic_entity_update["id"]),
                        "verb": verb,
                        "field": "epic_update",
                        "description": str(epic_entity_update["description"]),
                        "status": str(epic_entity_update["status"]),
                        "total_workitems": epic_entity_update["total_issues"],
                        "completed_workitems": epic_entity_update["completed_issues"],
                        "activity_time": str(epic_entity_update["created_at"]),
                    },
                },
            )


def process_mention(mention_component):
    soup = BeautifulSoup(mention_component, "html.parser")
    mentions = soup.find_all("mention-component")
    for mention in mentions:
        user_id = mention["entity_identifier"]
        user = User.objects.get(pk=user_id)
        user_name = user.display_name
        highlighted_name = f"@{user_name}"
        mention.replace_with(highlighted_name)
    return str(soup)


def process_html_content(content):
    if content is None:
        return None
    processed_content_list = []
    for html_content in content:
        processed_content = process_mention(html_content)
        processed_content_list.append(processed_content)
    return processed_content_list


@shared_task
def send_email_notification(issue_id, notification_data, receiver_id, email_notification_ids, entity_name):
    try:
        base_api = settings.WEB_URL

        # Skip if base api is not present
        if not base_api:
            return

        # setting entity_name as issue since all project-level notifications has issue_activity in it's data attribute
        data = create_payload(notification_data=notification_data, entity_name="issue")

        # Get email configurations

        try:
            receiver = User.objects.get(pk=receiver_id)
            issue = Issue.objects.get(pk=issue_id)
        except (Issue.DoesNotExist, User.DoesNotExist):
            return

        if issue.type and issue.type.is_epic:
            entity_type = "epic"
        else:
            entity_type = "work-item"

        template_data = []
        comments = []
        actors_involved = []

        for actor_id, changes in data.items():
            actor = User.objects.get(pk=actor_id)
            comment = changes.pop("comment", False)
            mention = changes.pop("mention", False)
            actors_involved.append(actor_id)
            if comment:
                comments.append(
                    {
                        "actor_comments": comment,
                        "actor_detail": {
                            "avatar_url": f"{base_api}{actor.avatar_url}",
                            "first_name": actor.first_name,
                            "last_name": actor.last_name,
                        },
                    }
                )
            if mention:
                mention["new_value"] = process_html_content(mention.get("new_value"))
                mention["old_value"] = process_html_content(mention.get("old_value"))
                comments.append(
                    {
                        "actor_comments": mention,
                        "actor_detail": {
                            "avatar_url": f"{base_api}{actor.avatar_url}",
                            "first_name": actor.first_name,
                            "last_name": actor.last_name,
                        },
                    }
                )

            activity_time = changes.pop("activity_time")

            if entity_name == EntityName.EPIC_UPDATE.value:
                summary = "Updates were added to the Epic"
                template_name = "emails/notifications/epic_updates.html"
                formatted_time = activity_time
            elif entity_name == EntityName.ISSUE.value or entity_name == EntityName.EPIC.value:
                summary = f"Updates were made to the {entity_name} by"
                template_name = "emails/notifications/issue-updates.html"
                formatted_time = datetime.strptime(activity_time, "%Y-%m-%d %H:%M:%S").strftime("%H:%M %p")
            elif entity_name == EntityName.INTAKE.value:
                summary = f"{actor.display_name} has made updates to this work item"
                template_name = "emails/notifications/intake-updates.html"
                formatted_time = activity_time

            if changes:
                template_data.append(
                    {
                        "actor_detail": {
                            "avatar_url": f"{base_api}{actor.avatar_url}",
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

        issue_identifier = f"{str(issue.project.identifier)}-{str(issue.sequence_id)}"

        # Send the mail
        subject = f"{issue.project.identifier}-{issue.sequence_id} {remove_unwanted_characters(issue.name)}"
        context = {
            "data": template_data,
            "summary": summary,
            "actors_involved": len(set(actors_involved)),
            "issue": {
                "issue_identifier": issue_identifier,
                "name": issue.name,
                "issue_url": f"{base_api}/{str(issue.project.workspace.slug)}/browse/{issue_identifier}",
            },
            "receiver": {"email": receiver.email},
            "issue_url": f"{base_api}/{str(issue.project.workspace.slug)}/browse/{issue_identifier}",
            "project_url": f"{base_api}/{str(issue.project.workspace.slug)}/projects/{str(issue.project.id)}/issues/",  # noqa: E501
            "workspace": str(issue.project.workspace.slug),
            "project": str(issue.project.name),
            "user_preference": f"{base_api}/{str(issue.project.workspace.slug)}/settings/account/notifications/",
            "comments": comments,
            "entity_type": entity_type,
        }
        html_content = render_to_string(template_name, context)
        text_content = generate_plain_text_from_html(html_content)

        try:
            send_email(subject, text_content, receiver, html_content, email_notification_ids)

            return
        except Exception as e:
            log_exception(e)
            return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def send_workspace_level_email_notification(
    entity_id, entity_name, notification_data, receiver_id, email_notification_ids
):
    try:
        base_api = settings.WEB_URL

        data = create_payload(notification_data=notification_data, entity_name=entity_name)

        ENTITY_MAPPER = {EntityName.TEAMSPACE.value: Teamspace, EntityName.INITIATIVE.value: Initiative}

        try:
            entity = ENTITY_MAPPER.get(entity_name).objects.get(pk=entity_id)
        except (Teamspace.DoesNotExist, Initiative.DoesNotExist):
            logging.getLogger("plane.worker").warning(f"Entity not found: {entity_id} for entity name: {entity_name}")
            return

        actors_involved = []
        template_data = []

        for actor_id, changes in data.items():
            actor = User.objects.get(pk=actor_id)
            actors_involved.append(actor_id)
            activity_time = changes.pop("activity_time")
            # Parse the input string into a datetime object
            formatted_time = datetime.strptime(activity_time, "%Y-%m-%d %H:%M:%S").strftime("%H:%M %p")

            if changes:
                template_data.append(
                    {
                        "actor_detail": {
                            "avatar_url": f"{base_api}{actor.avatar_url}",
                            "first_name": actor.first_name,
                            "last_name": actor.last_name,
                        },
                        "changes": changes,
                        "entity_name": entity.name,
                        "activity_time": str(formatted_time),
                    }
                )

        receiver = User.objects.get(pk=receiver_id)
        context = {
            "data": template_data,
            "summary": f"Updates were made to the {entity_name} by",
            "actors_involved": len(set(actors_involved)),
            entity_name: {
                f"{entity}_name": entity.name,
                "entity_url": f"{base_api}/{str(entity.workspace.slug)}/{str(entity_name)}s/{entity.id}/",
            },
            "receiver": {"email": receiver.email},
            "entity_url": f"{base_api}/{str(entity.workspace.slug)}/{str(entity_name)}s/{entity.id}/",
            "user_preference": f"{base_api}/{str(entity.workspace.slug)}/settings/account/notifications/",
            "workspace": str(entity.workspace.slug),
        }

        if entity_name == EntityName.INITIATIVE.value:
            template_name = "emails/notifications/initiative-updates.html"
        elif entity_name == EntityName.TEAMSPACE.value:
            template_name = "emails/notifications/teamspace-updates.html"

        html_content = render_to_string(template_name, context)
        text_content = generate_plain_text_from_html(html_content)

        try:
            # Get email configurations
            send_email(entity.name, text_content, receiver, html_content, email_notification_ids)
            return
        except Exception as e:
            log_exception(e)
            return
    except Exception as e:
        log_exception(e)
        return


def send_email(subject, text_content, receiver, html_content, email_notification_ids):
    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_USE_SSL,
        EMAIL_FROM,
    ) = get_email_configuration()

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

    EmailNotificationLog.objects.filter(pk__in=email_notification_ids).update(sent_at=timezone.now())
