# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Celery task helpers — decorators for business-calendar-aware scheduling."""

from __future__ import annotations

import functools
import logging
from zoneinfo import ZoneInfo

from django.utils import timezone

from plane.utils.business_calendar import BusinessCalendarService

logger = logging.getLogger(__name__)

# Vietnam timezone — server runs UTC, must convert before calling .date()
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def working_day_required(schedule_resolver=None):
    """Decorator factory that skips a Celery task on non-working days (VN calendar).

    Args:
        schedule_resolver: optional callable(task_args, task_kwargs) → schedule_id.
            When None, BusinessCalendarService falls back to the default schedule.

    Decorator order — @shared_task MUST be outermost so Celery registers the task;
    @working_day_required() MUST be inner so the guard runs before business logic:

        @shared_task          # outer — Celery sees this
        @working_day_required()  # inner — runs at task invocation time
        def my_task(): ...

    Fail-open policy: if BusinessCalendarService raises, log the exception and
    run the task anyway to avoid silently missing critical archive jobs.
    """

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            today = timezone.now().astimezone(VN_TZ).date()
            sid = schedule_resolver(*args, **kwargs) if schedule_resolver else None
            try:
                is_working = BusinessCalendarService.is_working_day(today, sid)
            except Exception:
                # Fail-open: avoid missing critical jobs when calendar service errors.
                logger.exception(
                    "BusinessCalendarService failed for %s; running task fail-open", fn.__name__
                )
                return fn(*args, **kwargs)
            if not is_working:
                logger.info("Skip %s: %s (VN) is not a working day", fn.__name__, today)
                return None
            return fn(*args, **kwargs)

        return wrapper

    return decorator
