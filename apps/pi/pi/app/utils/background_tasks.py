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

"""
Background task utilities for chat search index operations.

This module provides shared functions for scheduling Celery background tasks
for chat search index operations, used across both web and mobile endpoints.
"""

from pi import logger
from pi import settings

log = logger.getChild(__name__)


def schedule_chat_search_upsert(token_id: str) -> None:
    """
    Schedule background task to upsert chat and message data to OpenSearch index.

    Args:
        token_id: The query message ID used to find related chat and messages
    """
    try:
        from pi.celery_app import celery_app

        if not settings.celery.PI_MESSAGES_INDEX_SYNC_ENABLED:
            # log.debug("Chat search index sync is disabled, skipping upsert for token_id: %s", token_id)
            return

        celery_app.send_task("pi.celery_app.upsert_chat_search_index_task", args=[token_id])
    except Exception as e:
        log.error(f"Failed to dispatch chat search index task for {token_id}: {e}")


def schedule_chat_deletion(chat_id: str) -> None:
    """
    Schedule background task to mark chat as deleted in OpenSearch index.

    Args:
        chat_id: The chat ID to mark as deleted
    """
    try:
        from pi.celery_app import celery_app

        if not settings.celery.PI_MESSAGES_INDEX_SYNC_ENABLED:
            # log.debug("Chat search index sync is disabled, skipping deletion for chat_id: %s", chat_id)
            return

        celery_app.send_task("pi.celery_app.upsert_chat_search_index_deletion_task", args=[chat_id])
        log.debug(f"Celery task dispatched for chat deletion: {chat_id}")
    except Exception as e:
        log.error(f"Failed to dispatch chat deletion task for {chat_id}: {e}")


def schedule_chat_rename(chat_id: str, title: str) -> None:
    """
    Schedule background task to update chat title in OpenSearch index.

    Args:
        chat_id: The chat ID to update
        title: The new title
    """
    try:
        from pi.celery_app import celery_app

        if not settings.celery.PI_MESSAGES_INDEX_SYNC_ENABLED:
            # log.debug("Chat search index sync is disabled, skipping rename for chat_id: %s", chat_id)
            return

        celery_app.send_task("pi.celery_app.upsert_chat_search_index_title_task", args=[chat_id, title])
        log.debug(f"Celery task dispatched for chat title update: {chat_id}")
    except Exception as e:
        log.error(f"Failed to dispatch chat title update task for {chat_id}: {e}")
