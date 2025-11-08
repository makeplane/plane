# Third party imports
from celery import shared_task
from opentelemetry import trace

# Module imports
from plane.license.models import Instance
from plane.db.models import (
    User,
    Workspace,
    Project,
    Issue,
    Module,
    Cycle,
    CycleIssue,
    ModuleIssue,
    Page,
    WorkspaceMember,
)
from plane.utils.telemetry import init_tracer, shutdown_tracer


@shared_task
def instance_traces():
    """Instance telemetry task - DISABLED

    Telemetry has been disabled. This task is now a no-op to prevent
    external data collection to telemetry.plane.so
    """
    # Telemetry disabled - no external connections
    return
