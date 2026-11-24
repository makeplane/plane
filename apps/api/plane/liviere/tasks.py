# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Celery tasks of the Liviere/plane fork, found by app.autodiscover_tasks() (plane/celery.py).
# Scheduled by django_celery_beat rows created in our migrations, so plane/celery.py stays untouched.

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import IssueActivity
from plane.liviere.activity.record import sync_issue_activity
from plane.liviere.models import ActivityEvent
from plane.utils.exception_logger import log_exception

SYNC_ISSUE_ACTIVITY_TASK = "plane.liviere.tasks.sync_issue_activity_events"


@shared_task(name=SYNC_ISSUE_ACTIVITY_TASK)
def sync_issue_activity_events():
    """Copies new work item history (IssueActivity) into the activity heatmap events."""
    try:
        return sync_issue_activity(IssueActivity, ActivityEvent)
    except Exception as e:
        log_exception(e)
        return 0


NOTIFY_NEW_WORK_ITEM_TASK = "plane.liviere.tasks.notify_new_work_item"
SEND_TEST_PUSH_TASK = "plane.liviere.tasks.send_test_push"


@shared_task(name=NOTIFY_NEW_WORK_ITEM_TASK)
def notify_new_work_item(issue_id):
    """Web push about a new work item (queued by plane/liviere/push/signals.py after the commit)."""
    from plane.liviere.push.config import vapid_config
    from plane.liviere.push.notify import notify_new_work_item as notify

    try:
        config = vapid_config()
        return notify(issue_id, config) if config else 0
    except Exception as e:
        log_exception(e)
        return 0


@shared_task(name=SEND_TEST_PUSH_TASK)
def send_test_push(user_id):
    """Test notification to the person's own browsers (Profile settings → Notifications)."""
    from plane.liviere.push.config import vapid_config
    from plane.liviere.push.notify import send_test

    try:
        config = vapid_config()
        return send_test(user_id, config) if config else 0
    except Exception as e:
        log_exception(e)
        return 0
