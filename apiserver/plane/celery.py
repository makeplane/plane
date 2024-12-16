import os
from celery import Celery
from plane.settings.redis import redis_instance
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

ri = redis_instance()

app = Celery("plane")

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Add additional configurations
CELERY_CONFIGURATIONS = {
    "worker_prefetch_multiplier": int(os.environ.get("WORKER_PREFETCH_MULTIPLIER", 1)),
    "worker_max_tasks_per_child": int(
        os.environ.get("WORKER_MAX_TASKS_PER_CHILD", 100)
    ),
    "worker_max_memory_per_child": int(
        os.environ.get("WORKER_MAX_MEMORY_PER_CHILD", 150000)
    ),
    "task_time_limit": int(os.environ.get("TASK_TIME_LIMIT", 3600)),  # Hard time limit
    "task_soft_time_limit": int(
        os.environ.get("TASK_SOFT_TIME_LIMIT", 1800)
    ),  # Soft time limit (30 minutes)
    "worker_send_task_events": bool(
        os.environ.get("WORKER_SEND_TASK_EVENTS", "0") == "1"
    ),
    "task_ignore_result": bool(
        os.environ.get("TASK_IGNORE_RESULT", "1") == "1"
    ),  # Ignore results unless explicitly needed
    "task_store_errors_even_if_ignored": bool(
        os.environ.get("TASK_STORE_ERRORS_EVEN_IF_IGNORED", "1") == "1"
    ),  # Store errors even if results are ignored
    "task_acks_late": bool(
        os.environ.get("TASK_ACKS_LATE", "1") == "1"
    ),  # Acknowledge tasks after completion
    "task_reject_on_worker_lost": bool(
        os.environ.get("TASK_REJECT_ON_WORKER_LOST", "1") == "1"
    ),  # Reject tasks if worker is lost
}

app.conf.update(**CELERY_CONFIGURATIONS)


app.conf.beat_schedule = {
    # Executes every day at 12 AM
    "check-every-day-to-archive-and-close": {
        "task": "plane.bgtasks.issue_automation_task.archive_and_close_old_issues",
        "schedule": crontab(hour=0, minute=0),
    },
    "check-every-day-to-delete_exporter_history": {
        "task": "plane.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=0, minute=0),
    },
    "check-every-day-to-delete-file-asset": {
        "task": "plane.bgtasks.file_asset_task.delete_unuploaded_file_asset",
        "schedule": crontab(hour=0, minute=0),
    },
    "check-every-five-minutes-to-send-email-notifications": {
        "task": "plane.bgtasks.email_notification_task.stack_email_notification",
        "schedule": crontab(minute="*/5"),
    },
    "check-every-day-to-delete-hard-delete": {
        "task": "plane.bgtasks.deletion_task.hard_delete",
        "schedule": crontab(hour=0, minute=0),
    },
    "check-every-day-to-delete-api-logs": {
        "task": "plane.bgtasks.api_logs_task.delete_api_logs",
        "schedule": crontab(hour=0, minute=0),
    },
    "run-every-6-hours-for-instance-trace": {
        "task": "plane.license.bgtasks.tracer.instance_traces",
        "schedule": crontab(hour="*/6", minute=0),
    },
}

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_scheduler = "django_celery_beat.schedulers.DatabaseScheduler"
