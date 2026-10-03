# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
import sys
import logging
from datetime import timedelta

# Third party imports
from celery import Celery
from pythonjsonlogger.json import JsonFormatter
from celery.signals import (
    after_setup_logger,
    after_setup_task_logger,
    worker_process_init,
    worker_process_shutdown,
)
from celery.schedules import crontab, schedule

# Module imports
from django.conf import settings

from plane.settings.redis import redis_instance

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

# Bootstrap OpenTelemetry before Celery wires up so CeleryInstrumentor can
# patch task execution. No-op unless OTel is active.
from plane.observability.setup import (  # noqa: E402
    configure_otel,
    flush_otel,
    init_process_providers,
)
from plane.observability.logging import TraceContextFilter, is_otel_active  # noqa: E402


def _effective_pool() -> str:
    """Resolve the pool `celery worker` will actually use.

    Same precedence Celery applies: the `-P` / `--pool` CLI flag wins, then
    `worker_pool` from the config object (`CELERY_WORKER_POOL` in Django
    settings, via the namespaced config_from_object below), then the `prefork`
    default. Reading argv alone would misclassify a settings-configured pool.
    """
    argv = sys.argv
    for index, arg in enumerate(argv):
        if arg.startswith("--pool="):
            return arg.split("=", 1)[1].strip().lower()
        if arg in ("-P", "--pool") and index + 1 < len(argv):
            return argv[index + 1].strip().lower()
    return str(getattr(settings, "CELERY_WORKER_POOL", "") or "prefork").strip().lower()


def _is_prefork_worker() -> bool:
    """True when this process is `celery ... worker` on the prefork pool.

    The prefork pool forks its task children *after* this module is imported.
    The OTLP gRPC exporter opens its channel eagerly in __init__ and registers
    no os.register_at_fork handler, so a channel created here in the MainProcess
    and inherited by a forked child is not safe to export on — child exports can
    hang or fail nondeterministically. For that pool we defer exporter creation
    to worker_process_init, which fires inside each child.

    Everything else keeps the import-time bootstrap: `celery beat`, and the
    non-forking pools. That distinction matters for `threads`/`gevent`/`eventlet`,
    which run tasks in the main process and never dispatch worker_process_init —
    deferring there would leave the providers uninitialized and export nothing.
    """
    # Only worker processes fork, and only they need `settings` resolved this
    # early — keep wsgi/asgi/manage.py off that path.
    return "worker" in sys.argv and _effective_pool() == "prefork"


_DEFER_OTEL_PROVIDERS = _is_prefork_worker()

configure_otel(defer_providers=_DEFER_OTEL_PROVIDERS)

# Whether to trace-correlate worker logs. Uses the same shared is_otel_active()
# gate as the bootstrap (setup.configure_otel) and the Django LOGGING gate, so
# the log schema never changes in a process that exports no telemetry.
_OTEL_LOG_ENABLED = is_otel_active()


@worker_process_init.connect
def init_otel_in_worker_child(*args, **kwargs):
    """Create this child's OTLP exporters after the prefork fork.

    No-op unless configure_otel() deferred them (see _is_prefork_worker).
    """
    init_process_providers()


# Base JSON log fmt (unchanged off-path); the OTel variant appends the
# trace-context fields that TraceContextFilter populates.
_CELERY_LOG_FMT = '"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s'
_CELERY_OTEL_LOG_FMT = (
    '"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s '
    "%(service_name)s %(trace_id)s %(span_id)s %(trace_flags)s"
)


@worker_process_shutdown.connect
def flush_otel_on_worker_shutdown(*args, **kwargs):
    """Flush buffered spans/metrics when a prefork child exits.

    Prefork children exit via os._exit and skip atexit, so without this the tail
    of each child's telemetry is dropped on --max-tasks-per-child recycling and
    warm shutdown. No-op (bounded, never raises) unless OTel was configured.
    """
    flush_otel()


def _build_celery_log_handler() -> logging.Handler:
    """Build the worker's JSON StreamHandler.

    Off-path: identical to the historical handler (same fmt). When OTel logging
    is enabled, use the extended fmt and attach TraceContextFilter so worker
    log lines carry trace_id/span_id/service_name, matching the Django request
    path.
    """
    fmt = _CELERY_OTEL_LOG_FMT if _OTEL_LOG_ENABLED else _CELERY_LOG_FMT
    handler = logging.StreamHandler()
    handler.setFormatter(fmt=JsonFormatter(fmt))
    if _OTEL_LOG_ENABLED:
        handler.addFilter(TraceContextFilter())
    return handler


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
    "push-instance-metrics": {
        "task": "plane.license.bgtasks.telemetry_metrics.push_instance_metrics",
        "schedule": schedule(run_every=timedelta(minutes=METRICS_PUSH_INTERVAL_MINUTES)),
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


# Setup logging
@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    logger.addHandler(_build_celery_log_handler())


@after_setup_task_logger.connect
def setup_task_loggers(logger, *args, **kwargs):
    logger.addHandler(_build_celery_log_handler())


# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_scheduler = "django_celery_beat.schedulers.DatabaseScheduler"
