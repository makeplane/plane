# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
import logging
from datetime import timedelta

# Third party imports
from celery import Celery
from pythonjsonlogger.json import JsonFormatter
from celery.signals import after_setup_logger, after_setup_task_logger
from celery.schedules import crontab, schedule

# Module imports
from workspaces.settings.redis import redis_instance

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "workspaces.settings.production")

ri = redis_instance()

# Configurable metrics push interval (in minutes)
# Default: 360 (6 hours), set to 5 for development/testing
def _get_metrics_push_interval_minutes() -> int:
    raw = os.environ.get("METRICS_PUSH_INTERVAL_MINUTES", "360")
    try:
        value = int(raw)
        # Cap at 10,000,000 minutes to prevent timedelta(minutes=...) OverflowError
        # on arbitrarily large inputs while still allowing multi-year intervals.
        return value if 0 < value <= 10_000_000 else 360
    except (ValueError, OverflowError):
        return 360

METRICS_PUSH_INTERVAL_MINUTES = _get_metrics_push_interval_minutes()

app = Celery("workspaces")

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object("django.conf:settings", namespace="CELERY")

app.conf.beat_schedule = {
    # Intra day recurring jobs
    "check-every-five-minutes-to-send-email-notifications": {
        "task": "workspaces.bgtasks.email_notification_task.stack_email_notification",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "push-instance-metrics": {
        "task": "workspaces.license.bgtasks.telemetry_metrics.push_instance_metrics",
        "schedule": schedule(run_every=timedelta(minutes=METRICS_PUSH_INTERVAL_MINUTES)),
    },
    # Engineering Operations reminders. Hourly rather than daily because each
    # one checks the workspace's *local* hour before firing -- a single UTC
    # schedule cannot otherwise respect a team in Kathmandu and a team in
    # Lisbon at once. The tasks themselves refuse to notify twice a day.
    "engineering-ops-missing-work-logs": {
        "task": "workspaces.bgtasks.operations_reminder_task.remind_missing_work_logs",
        "schedule": crontab(minute=10),  # hourly, at :10
    },
    "engineering-ops-missing-attendance": {
        "task": "workspaces.bgtasks.operations_reminder_task.remind_missing_attendance",
        "schedule": crontab(minute=20),  # hourly, at :20
    },
    "engineering-ops-blocked-and-overdue": {
        "task": "workspaces.bgtasks.operations_reminder_task.remind_blocked_and_overdue",
        "schedule": crontab(hour=4, minute=0),  # UTC 04:00
    },
    "engineering-ops-operations-tickets": {
        "task": "workspaces.bgtasks.operations_reminder_task.remind_operations_tickets",
        "schedule": crontab(hour=4, minute=15),  # UTC 04:15
    },
    # Occurs once every day
    "check-every-day-to-delete-hard-delete": {
        "task": "workspaces.bgtasks.deletion_task.hard_delete",
        "schedule": crontab(hour=0, minute=0),  # UTC 00:00
    },
    "check-every-day-to-archive-and-close": {
        "task": "workspaces.bgtasks.issue_automation_task.archive_and_close_old_issues",
        "schedule": crontab(hour=1, minute=0),  # UTC 01:00
    },
    "check-every-day-to-delete_exporter_history": {
        "task": "workspaces.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=1, minute=30),  # UTC 01:30
    },
    "check-every-day-to-delete-file-asset": {
        "task": "workspaces.bgtasks.file_asset_task.delete_unuploaded_file_asset",
        "schedule": crontab(hour=2, minute=0),  # UTC 02:00
    },
    "check-every-day-to-delete-api-logs": {
        "task": "workspaces.bgtasks.cleanup_task.delete_api_logs",
        "schedule": crontab(hour=2, minute=30),  # UTC 02:30
    },
    "check-every-day-to-delete-email-notification-logs": {
        "task": "workspaces.bgtasks.cleanup_task.delete_email_notification_logs",
        "schedule": crontab(hour=2, minute=45),  # UTC 02:45
    },
    "check-every-day-to-delete-page-versions": {
        "task": "workspaces.bgtasks.cleanup_task.delete_page_versions",
        "schedule": crontab(hour=3, minute=0),  # UTC 03:00
    },
    "check-every-day-to-delete-issue-description-versions": {
        "task": "workspaces.bgtasks.cleanup_task.delete_issue_description_versions",
        "schedule": crontab(hour=3, minute=15),  # UTC 03:15
    },
    "check-every-day-to-delete-webhook-logs": {
        "task": "workspaces.bgtasks.cleanup_task.delete_webhook_logs",
        "schedule": crontab(hour=3, minute=30),  # UTC 03:30
    },
    "check-every-day-to-delete-exporter-history": {
        "task": "workspaces.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=3, minute=45),  # UTC 03:45
    },
}


# Setup logging
@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    formatter = JsonFormatter('"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s')
    handler = logging.StreamHandler()
    handler.setFormatter(fmt=formatter)
    logger.addHandler(handler)


@after_setup_task_logger.connect
def setup_task_loggers(logger, *args, **kwargs):
    formatter = JsonFormatter('"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s')
    handler = logging.StreamHandler()
    handler.setFormatter(fmt=formatter)
    logger.addHandler(handler)


# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_scheduler = "django_celery_beat.schedulers.DatabaseScheduler"
