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
import os
from datetime import timedelta

# Third party imports
from celery import Celery
from celery.signals import setup_logging
from celery.schedules import crontab, schedule

# Module imports
from plane.settings.redis import redis_instance

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

ri = redis_instance()

app = Celery("plane")

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object("django.conf:settings", namespace="CELERY")

app.conf.beat_schedule = {
    # Intra day recurring jobs
    "check-every-five-minutes-to-send-email-notifications": {
        "task": "plane.bgtasks.email_notification_task.stack_email_notification",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "run-every-6-hours-for-instance-trace": {
        "task": "plane.license.bgtasks.tracer.instance_traces",
        "schedule": crontab(hour="*/6", minute=0),  # Every 6 hours
    },
    # Occurs once every day
    "check-every-day-to-delete-hard-delete": {
        "task": "plane.bgtasks.deletion_task.hard_delete",
        "schedule": crontab(hour=0, minute=0),  # UTC 00:00
    },
    "check-every-day-to-archive-and-close": {
        "task": "plane.bgtasks.issue_automation_task.archive_and_close_old_issues",
        "schedule": crontab(hour=1, minute=0),  # UTC 01:00
    },
    "check-every-day-to-delete_exporter_history": {
        "task": "plane.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=1, minute=30),  # UTC 01:30
    },
    "check-every-day-to-delete-file-asset": {
        "task": "plane.bgtasks.file_asset_task.delete_unuploaded_file_asset",
        "schedule": crontab(hour=2, minute=0),  # UTC 02:00
    },
    "check-every-day-to-delete-api-logs": {
        "task": "plane.bgtasks.cleanup_task.delete_api_logs",
        "schedule": crontab(hour=2, minute=30),  # UTC 02:30
    },
    "check-every-day-to-delete-email-notification-logs": {
        "task": "plane.bgtasks.cleanup_task.delete_email_notification_logs",
        "schedule": crontab(hour=2, minute=45),  # UTC 02:45
    },
    "check-every-day-to-delete-page-versions": {
        "task": "plane.bgtasks.cleanup_task.delete_page_versions",
        "schedule": crontab(hour=3, minute=0),  # UTC 03:00
    },
    "check-every-day-to-delete-issue-description-versions": {
        "task": "plane.bgtasks.cleanup_task.delete_issue_description_versions",
        "schedule": crontab(hour=3, minute=15),  # UTC 03:15
    },
    "check-every-day-to-delete-webhook-logs": {
        "task": "plane.bgtasks.cleanup_task.delete_webhook_logs",
        "schedule": crontab(hour=3, minute=30),  # UTC 03:30
    },
    "check-every-day-to-delete-exporter-history": {
        "task": "plane.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=3, minute=45),  # UTC 03:45
    },
}


# Prevent Celery from hijacking the root logger so Django's LOGGING config
# (which sets up plane.worker, plane.api, etc.) remains in control.
@setup_logging.connect
def configure_logging(*args, **kwargs):
    import logging.config
    from django.conf import settings
    logging.config.dictConfig(settings.LOGGING)


EE_JOBS = {
    "check-every-day-to-delete-hard-delete": {
        "task": "plane.bgtasks.deletion_task.hard_delete",
        "schedule": crontab(hour=3, minute=0),  # UTC 03:00
    },
    # EE jobs
    "check-every-12-hr-instance-version": {
        "task": "plane.license.bgtasks.version_check_task.version_check",
        "schedule": crontab(hour="*/12", minute=0),  # Every 12 hours
    },
    "check-every-day-to-sync-workspace-members": {
        "task": "plane.payment.bgtasks.workspace_subscription_sync_task.schedule_workspace_billing_task",  # noqa: E501
        "schedule": crontab(hour=0, minute=0),  # UTC 00:00
    },
    "track-entity-issue-state-progress": {
        "task": "plane.ee.bgtasks.entity_issue_state_progress_task.track_entity_issue_state_progress",  # noqa: E501
        "schedule": crontab(hour=0, minute=30),  # UTC 00:30
    },
    # OpenSearch batched updates
    "process-batched-opensearch-updates": {
        "task": "plane.ee.bgtasks.batched_search_update_task.process_batched_opensearch_updates",  # noqa: E501
        "schedule": schedule(run_every=timedelta(seconds=5)),  # Every 5 seconds
    },
    "log-opensearch-update-queue-metrics": {
        "task": "plane.ee.bgtasks.batched_search_update_task.log_opensearch_update_queue_metrics",  # noqa: E501
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    # Outbox cleaner
    "check-every-day-to-delete-outbox-records": {
        "task": "plane.event_stream.bgtasks.outbox_cleaner.delete_outbox_records",
        "schedule": crontab(hour=0, minute=30),  # UTC 00:30
    },
    # Cycles maintenance
    "maintain-future-cycles": {
        "task": "plane.ee.bgtasks.cycle_automation_task.maintain_future_cycles",
        "schedule": crontab(minute="*/2"),  # Every 2 minutes
    },
    # Batch scheduler for recurring work items - runs every 15 minutes
    "recurring-batch-scheduler": {
        "task": "plane.ee.bgtasks.recurring_work_item_scheduler.schedule_batch",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    # IdP group sync - runs every 2 hours
    "sync-idp-groups-offline": {
        "task": "plane.authentication.bgtasks.group_sync_task.sync_idp_groups_offline",
        "schedule": crontab(hour="*/2", minute=10),  # Every 2 hours at minute 10
    },
    # Automation scheduled triggers batch scheduler
    "schedule-automation-triggers": {
        "task": "plane.automations.tasks.schedule_automation_triggers_batch",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    # Auto-reminder notifications for work items with upcoming target dates for every 4 hours at minute 20
    "auto-reminder-automation": {
        "task": "plane.ee.bgtasks.auto_reminder_automation.task.auto_reminder_automation_task",
        "schedule": crontab(hour="*/4", minute=20),  # Every 4 hours at minute 20
    },
}


app.conf.beat_schedule.update(EE_JOBS)

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_scheduler = "django_celery_beat.schedulers.DatabaseScheduler"
