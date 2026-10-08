# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
import logging
from urllib.parse import urlparse

# Third party imports
from celery import shared_task
from django.db.models import Count
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource

# Module imports
from plane.utils.otlp_endpoints import get_otlp_grpc_endpoint, get_otlp_http_metrics_url
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

logger = logging.getLogger(__name__)

WORKSPACE_METRICS_LIMIT = 1000
FLUSH_TIMEOUT_MILLIS = 30000
EXPORT_INTERVAL_MILLIS = 20000


def _create_otlp_metric_exporter():
    """
    Create OTLP metric exporter based on OTLP_METRICS_PROTOCOL (http or grpc).
    Uses shared endpoint helpers so metrics and traces target the same collector.
    Default is grpc; override with OTLP_METRICS_PROTOCOL=http if needed.
    """
    protocol = (os.environ.get("OTLP_METRICS_PROTOCOL") or "grpc").strip().lower()

    if protocol == "grpc":
        from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
            OTLPMetricExporter as GrpcOTLPMetricExporter,
        )

        grpc_endpoint = get_otlp_grpc_endpoint()
        insecure = os.environ.get("OTEL_EXPORTER_OTLP_METRICS_INSECURE", "").lower() == "true"
        return GrpcOTLPMetricExporter(endpoint=grpc_endpoint, insecure=insecure)

    # HTTP fallback
    from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
        OTLPMetricExporter as HttpOTLPMetricExporter,
    )

    return HttpOTLPMetricExporter(endpoint=get_otlp_http_metrics_url())


def _collect_and_push_metrics() -> None:
    """
    Collect instance metrics and push them to OTEL collector.

    Uses OTEL metrics SDK to push gauge metrics directly to the collector,
    replacing the previous span-based tracing approach.
    """
    # Check if the instance is registered
    instance = Instance.objects.first()

    if instance is None:
        logger.debug("No instance registered, skipping metrics push")
        return

    if not instance.is_telemetry_enabled:
        logger.debug("Telemetry disabled, skipping metrics push")
        return

    # Configure OTEL metrics (gRPC default, or HTTP if OTLP_METRICS_PROTOCOL=http)
    protocol = (os.environ.get("OTLP_METRICS_PROTOCOL") or "grpc").strip().lower()
    export_endpoint = get_otlp_grpc_endpoint() if protocol == "grpc" else get_otlp_http_metrics_url()

    service_name = os.environ.get("SERVICE_NAME", "plane-ce-api")

    # Create resource with instance identification for the collector
    resource = Resource.create({
        "service.name": service_name,
        "instance_id": str(instance.instance_id or ""),
        "plane.instance.type": "self-hosted",
    })

    # Configure the OTLP metric exporter (HTTP or gRPC)
    logger.info(f"Configuring OTLP exporter: protocol={protocol}, endpoint={export_endpoint}")
    exporter = _create_otlp_metric_exporter()
    reader = PeriodicExportingMetricReader(
        exporter,
        export_interval_millis=EXPORT_INTERVAL_MILLIS,
    )

    # Create a new MeterProvider per execution. Gauges use callbacks that capture
    # current DB counts, so we need fresh meters each run. provider.shutdown() in
    # finally ensures clean teardown. For a 6-hour periodic task, this overhead is acceptable.
    provider = MeterProvider(resource=resource, metric_readers=[reader])

    try:
        # Get a meter
        meter = provider.get_meter(__name__)

        # Collect instance-level counts
        user_count = User.objects.filter(is_bot=False).count()
        workspace_count = Workspace.objects.count()
        project_count = Project.objects.count()
        issue_count = Issue.objects.count()
        module_count = Module.objects.count()
        cycle_count = Cycle.objects.count()
        cycle_issue_count = CycleIssue.objects.count()
        module_issue_count = ModuleIssue.objects.count()
        page_count = Page.objects.exclude(owned_by__is_bot=True, access=1).count()

        # Derive domain from WEB_URL env var (e.g. https://plane.acmecorp.com -> plane.acmecorp.com).
        # Prepend "//" for scheme-less values (e.g. "plane.acmecorp.com") so urlparse
        # populates netloc correctly instead of treating the host as a path component.
        web_url = os.environ.get("WEB_URL", "")
        if web_url and "://" not in web_url:
            web_url = "//" + web_url
        domain = urlparse(web_url).netloc if web_url else ""

        # Common attributes for all instance-level metrics
        instance_attrs = {
            "instance_id": str(instance.instance_id or ""),
            "instance_name": str(instance.instance_name or ""),
            "current_version": str(instance.current_version or ""),
            "latest_version": str(instance.latest_version or ""),
            "edition": str(instance.edition or ""),
            "domain": domain,
            "is_verified": str(instance.is_verified).lower(),
            "is_setup_done": str(instance.is_setup_done).lower(),
        }

        # Create gauge callbacks for instance-level metrics
        def users_callback(_options):
            yield metrics.Observation(user_count, instance_attrs)

        def workspaces_callback(_options):
            yield metrics.Observation(workspace_count, instance_attrs)

        def projects_callback(_options):
            yield metrics.Observation(project_count, instance_attrs)

        def issues_callback(_options):
            yield metrics.Observation(issue_count, instance_attrs)

        def modules_callback(_options):
            yield metrics.Observation(module_count, instance_attrs)

        def cycles_callback(_options):
            yield metrics.Observation(cycle_count, instance_attrs)

        def cycle_issues_callback(_options):
            yield metrics.Observation(cycle_issue_count, instance_attrs)

        def module_issues_callback(_options):
            yield metrics.Observation(module_issue_count, instance_attrs)

        def pages_callback(_options):
            yield metrics.Observation(page_count, instance_attrs)

        # Register observable gauges for instance metrics
        meter.create_observable_gauge(
            name="plane_instance_users_total",
            description="Total number of users in the Plane instance",
            callbacks=[users_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_workspaces_total",
            description="Total number of workspaces",
            callbacks=[workspaces_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_projects_total",
            description="Total number of projects across all workspaces",
            callbacks=[projects_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_issues_total",
            description="Total number of issues across all projects",
            callbacks=[issues_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_modules_total",
            description="Total number of modules",
            callbacks=[modules_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_cycles_total",
            description="Total number of cycles",
            callbacks=[cycles_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_cycle_issues_total",
            description="Total number of issues in cycles",
            callbacks=[cycle_issues_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_module_issues_total",
            description="Total number of issues in modules",
            callbacks=[module_issues_callback],
        )
        meter.create_observable_gauge(
            name="plane_instance_pages_total",
            description="Total number of pages",
            callbacks=[pages_callback],
        )

        # Collect workspace-level metrics (limited to WORKSPACE_METRICS_LIMIT).
        # Fetch workspaces in a deterministic order so the slice is stable across runs.
        # Counts are batched into 6 aggregation queries instead of 6×N per-workspace
        # queries (avoids N+1 at scale when WORKSPACE_METRICS_LIMIT is large).
        instance_id_str = str(instance.instance_id or "")
        workspaces = list(Workspace.objects.order_by("created_at")[:WORKSPACE_METRICS_LIMIT])
        workspace_ids = [ws.id for ws in workspaces]

        project_counts = dict(
            Project.objects.filter(workspace_id__in=workspace_ids)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )
        issue_counts = dict(
            Issue.objects.filter(workspace_id__in=workspace_ids)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )
        module_counts = dict(
            Module.objects.filter(workspace_id__in=workspace_ids)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )
        cycle_counts = dict(
            Cycle.objects.filter(workspace_id__in=workspace_ids)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )
        member_counts = dict(
            WorkspaceMember.objects.filter(workspace_id__in=workspace_ids)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )
        page_counts = dict(
            Page.objects.filter(workspace_id__in=workspace_ids)
            .exclude(owned_by__is_bot=True, access=1)
            .values("workspace_id")
            .annotate(count=Count("id"))
            .values_list("workspace_id", "count")
        )

        workspace_metrics = []
        for workspace in workspaces:
            ws_id = workspace.id
            workspace_metrics.append({
                "instance_id": instance_id_str,
                "workspace_id": str(ws_id),
                "workspace_slug": str(workspace.slug),
                "project_count": project_counts.get(ws_id, 0),
                "issue_count": issue_counts.get(ws_id, 0),
                "module_count": module_counts.get(ws_id, 0),
                "cycle_count": cycle_counts.get(ws_id, 0),
                "member_count": member_counts.get(ws_id, 0),
                "page_count": page_counts.get(ws_id, 0),
            })

        def _ws_attrs(ws: dict) -> dict:
            return {
                "workspace_id": ws["workspace_id"],
                "workspace_slug": ws["workspace_slug"],
                "instance_id": ws["instance_id"],
            }

        # Create callbacks for workspace-level metrics
        def ws_projects_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["project_count"], _ws_attrs(ws))

        def ws_issues_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["issue_count"], _ws_attrs(ws))

        def ws_modules_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["module_count"], _ws_attrs(ws))

        def ws_cycles_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["cycle_count"], _ws_attrs(ws))

        def ws_members_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["member_count"], _ws_attrs(ws))

        def ws_pages_callback(_options):
            for ws in workspace_metrics:
                yield metrics.Observation(ws["page_count"], _ws_attrs(ws))

        # Register observable gauges for workspace metrics
        meter.create_observable_gauge(
            name="plane_workspace_projects_total",
            description="Number of projects per workspace",
            callbacks=[ws_projects_callback],
        )
        meter.create_observable_gauge(
            name="plane_workspace_issues_total",
            description="Number of issues per workspace",
            callbacks=[ws_issues_callback],
        )
        meter.create_observable_gauge(
            name="plane_workspace_modules_total",
            description="Number of modules per workspace",
            callbacks=[ws_modules_callback],
        )
        meter.create_observable_gauge(
            name="plane_workspace_cycles_total",
            description="Number of cycles per workspace",
            callbacks=[ws_cycles_callback],
        )
        meter.create_observable_gauge(
            name="plane_workspace_members_total",
            description="Number of members per workspace",
            callbacks=[ws_members_callback],
        )
        meter.create_observable_gauge(
            name="plane_workspace_pages_total",
            description="Number of pages per workspace",
            callbacks=[ws_pages_callback],
        )

        # Force a synchronous flush to ensure all metrics are exported
        # force_flush() blocks until all metrics are exported or timeout is reached
        flush_success = provider.force_flush(timeout_millis=FLUSH_TIMEOUT_MILLIS)

        if flush_success:
            logger.info(
                f"Successfully pushed metrics to OTEL collector at {export_endpoint} "
                f"for instance {instance.instance_id}"
            )
        else:
            logger.warning(
                f"Metrics flush timed out for instance {instance.instance_id}, "
                f"some metrics may not have been exported"
            )

    except Exception as e:
        logger.exception(f"Error pushing metrics to OTEL collector: {e}")
        # Don't re-raise: allow task to complete gracefully so it retries on next scheduled run
    finally:
        # Shutdown the provider to clean up resources
        provider.shutdown()


@shared_task
def push_instance_metrics():
    """
    Celery task to push instance metrics to OTEL collector.

    Replaces the previous span-based tracing approach with OTLP metrics gauges.
    Scheduled to run every 6 hours via Celery beat.
    """
    logger.debug("Starting push_instance_metrics task")
    try:
        _collect_and_push_metrics()
        logger.debug("Completed push_instance_metrics task")
    except Exception as e:
        logger.exception(f"Failed to push instance metrics: {e}")
