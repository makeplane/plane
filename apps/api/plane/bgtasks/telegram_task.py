# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Deliver selected work item activity to project-mapped Telegram chats."""

import json
import logging
from html import escape

from celery import shared_task
from django.conf import settings
from django.utils.html import strip_tags

from plane.db.models import Issue, TelegramProjectChat, TelegramUserLink
from plane.bgtasks.notification_task import extract_comment_mentions, extract_mentions
from plane.utils.telegram import TelegramAPIError, TelegramRetryableError, decrypt_bot_token, telegram_api
from plane.utils.uuid import is_valid_uuid


logger = logging.getLogger("plane.worker")


def _linked_mentions(mapping, user_ids):
    links = TelegramUserLink.objects.filter(
        integration=mapping.integration, user_id__in=[user_id for user_id in user_ids if is_valid_uuid(user_id)]
    ).select_related("user")
    return " ".join(
        f'<a href="tg://user?id={link.telegram_user_id}">{escape(link.user.display_name)}</a>' for link in links[:10]
    )


def _event_messages(event_type, activities, issue):
    if event_type == "issue.activity.created":
        yield f"Created: {escape(issue.name)}"
    for activity in activities:
        field = activity.get("field")
        if field == "state":
            yield f"State changed to {escape(str(activity.get('new_value') or 'unset'))}"
        elif field == "assignees":
            if activity.get("new_value"):
                yield f"Assigned to {escape(str(activity['new_value']))}"
            elif activity.get("old_value"):
                yield f"Unassigned {escape(str(activity['old_value']))}"
        elif field == "comment" and event_type == "comment.activity.created":
            comment = strip_tags(activity.get("new_value") or "").strip()[:300]
            yield f"Commented: {escape(comment)}" if comment else "Commented"


@shared_task(autoretry_for=(TelegramRetryableError,), retry_backoff=30, retry_jitter=True, max_retries=5)
def send_telegram_issue_event(event_type, issue_id, project_id, activities_json, requested_data, current_instance):
    if event_type not in (
        "issue.activity.created",
        "issue.activity.updated",
        "comment.activity.created",
    ):
        return
    mapping = TelegramProjectChat.objects.select_related("integration", "project").filter(project_id=project_id).first()
    issue = Issue.objects.filter(id=issue_id, project_id=project_id).first()
    if not mapping or not issue:
        return

    activities = json.loads(activities_json)
    mentions = set()
    if event_type.startswith("issue.activity"):
        mentions = set(extract_mentions(requested_data)) - set(extract_mentions(current_instance))
    if event_type == "comment.activity.created":
        for activity in activities:
            if activity.get("field") == "comment":
                mentions.update(extract_comment_mentions(activity.get("new_value") or ""))
    for activity in activities:
        if activity.get("field") == "assignees" and activity.get("new_identifier"):
            mentions.add(str(activity["new_identifier"]))

    lines = list(_event_messages(event_type, activities, issue))
    linked = _linked_mentions(mapping, mentions)
    if linked:
        lines.append(f"Mentioned: {linked}")
    if not lines:
        return
    identifier = f"{mapping.project.identifier}-{issue.sequence_id}"
    app_url = (settings.APP_BASE_URL or settings.WEB_URL or "").rstrip("/")
    issue_url = f"{app_url}/{issue.workspace.slug}/browse/{identifier}/"
    text = f'<a href="{escape(issue_url, quote=True)}">{escape(identifier)}</a>\n' + "\n".join(lines)
    payload = {
        "chat_id": mapping.chat_id,
        "text": text,
        "parse_mode": "HTML",
        "link_preview_options": {"is_disabled": True},
    }
    if mapping.topic_id:
        payload["message_thread_id"] = mapping.topic_id
    try:
        telegram_api(decrypt_bot_token(mapping.integration.encrypted_bot_token), "sendMessage", payload)
    except TelegramRetryableError:
        raise
    except TelegramAPIError:
        logger.warning("Telegram delivery failed for project %s", project_id)
