# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from typing import Dict, Any

# Third party imports
from celery import shared_task

# Django imports
from plane.utils.exception_logger import log_exception
from plane.db.models import APIActivityLog


logger = logging.getLogger("plane.worker")


def log_to_postgres(log_data: Dict[str, Any]) -> bool:
    """
    Persist an external API request log to PostgreSQL.
    """
    try:
        APIActivityLog.objects.create(**log_data)
        return True
    except Exception as e:
        log_exception(e)
        return False


@shared_task
def process_logs(log_data: Dict[str, Any], **_: Any) -> None:
    """
    Persist external API request logs to PostgreSQL.

    The catch-all kwargs keep this task signature compatible with jobs enqueued
    by an older release (which passed a `mongo_log` argument), so in-flight tasks
    don't fail during a rolling deploy. It can be dropped once no such jobs remain.
    """
    log_to_postgres(log_data)
