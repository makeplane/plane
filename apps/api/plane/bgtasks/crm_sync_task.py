# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from datetime import datetime, timezone

# Third party imports
from celery import shared_task
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils import timezone as dj_timezone

# Module imports
from plane.db.models import CrmIntegration, CrmSyncLog, CustomFieldValue, IssueWorkLog
from plane.utils.crm_client import CrmApiClient, CrmApiError

logger = logging.getLogger(__name__)


@shared_task
def monthly_crm_sync(integration_id=None):
    """Push the previous month's worklog totals into the configured CRM.

    Runs on the first of each month and always processes the *previous* calendar
    month so the data is complete. When ``integration_id`` is supplied (manual
    "Sync Now"), only that workspace is processed; otherwise every active
    integration is processed.
    """
    now = dj_timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_start = month_start - relativedelta(months=1)

    integrations = CrmIntegration.objects.select_related(
        "workspace", "crm_project_id_custom_field"
    )
    if integration_id:
        integrations = integrations.filter(id=integration_id)
    else:
        integrations = integrations.filter(is_active=True)

    for integration in integrations:
        try:
            _sync_workspace(integration, prev_month_start, month_start, now)
        except Exception as exc:  # noqa: BLE001 - isolate per-workspace failures
            logger.exception(
                "CRM sync failed for workspace %s: %s",
                integration.workspace.slug,
                exc,
            )


def _sync_workspace(integration, month_start, month_end, now):
    """Sync a single workspace's projects for the [month_start, month_end) window."""
    cf_field = integration.crm_project_id_custom_field
    if cf_field is None:
        logger.warning(
            "CRM integration for %s has no project-id custom field configured; skipping.",
            integration.workspace.slug,
        )
        return

    crm_api_key = integration.get_api_key()
    if not integration.crm_api_url or not crm_api_key:
        logger.warning(
            "CRM integration for %s is missing URL or API key; skipping.",
            integration.workspace.slug,
        )
        return

    crm = CrmApiClient(
        base_url=integration.crm_api_url,
        api_key=crm_api_key,
        verify=settings.CRM_VERIFY_SSL,
    )

    # CRM project ids already synced this month, so re-runs stay idempotent.
    already_synced = _already_synced_crm_project_ids(integration, month_start.date())

    cf_values = CustomFieldValue.objects.filter(
        workspace_id=integration.workspace_id,
        custom_field=cf_field,
        project__isnull=False,
    ).select_related("project")

    details = []
    synced = skipped = errors = 0

    for cfv in cf_values:
        crm_project_id = _coerce_crm_project_id(cfv.value)
        if crm_project_id is None:
            continue  # blank / unmapped project, silently ignored

        if crm_project_id in already_synced:
            continue  # already pushed for this month

        result = _sync_project(
            project=cfv.project,
            crm_project_id=crm_project_id,
            month_start=month_start,
            month_end=month_end,
            crm=crm,
            invoice_hours_field_id=integration.crm_invoice_hours_field_id,
        )
        details.append(result)

        if result["status"] == "synced":
            synced += 1
        elif result["status"] == "skipped":
            skipped += 1
        else:
            errors += 1

    # Nothing to record when no mapped project produced a result.
    if not details:
        return

    status = "success" if errors == 0 else ("partial" if synced > 0 else "failed")
    CrmSyncLog.objects.create(
        integration=integration,
        sync_month=month_start.date(),
        status=status,
        projects_processed=synced + skipped + errors,
        projects_synced=synced,
        projects_skipped=skipped,
        details=details,
    )
    integration.last_synced_at = now
    integration.last_sync_status = status
    integration.save(update_fields=["last_synced_at", "last_sync_status", "updated_at"])


def _sync_project(project, crm_project_id, month_start, month_end, crm, invoice_hours_field_id):
    """Aggregate one project's worklogs for the window and push them to the CRM."""
    worklogs = (
        IssueWorkLog.objects.filter(
            project=project,
            logged_at__gte=month_start,
            logged_at__lt=month_end,
            duration__isnull=False,
            duration__gt=0,
        )
        .select_related("issue")
        .order_by("issue__sequence_id")
    )

    base = {
        "project_id": str(project.id),
        "project_name": project.name,
        "crm_project_id": crm_project_id,
    }

    # Aggregate seconds per issue.
    issue_map = {}
    total_seconds = 0
    for wl in worklogs:
        entry = issue_map.setdefault(
            wl.issue_id,
            {"name": wl.issue.name, "seq": wl.issue.sequence_id, "seconds": 0},
        )
        entry["seconds"] += wl.duration
        total_seconds += wl.duration

    if total_seconds <= 0:
        return {**base, "status": "skipped", "reason": "no worklogs"}

    total_hours = round(total_seconds / 3600, 2)
    month_label = month_start.strftime("%B %Y")
    description = _build_description(issue_map, total_hours, month_label)

    try:
        task = crm.create_task(
            project_id=crm_project_id,
            name=f"Work Summary — {month_label}",
            description=description,
        )
        crm_task_id = task.get("id") if isinstance(task, dict) else None

        if invoice_hours_field_id and crm_task_id:
            crm.set_custom_field(crm_task_id, invoice_hours_field_id, str(total_hours))

        return {
            **base,
            "crm_task_id": crm_task_id,
            "total_hours": total_hours,
            "status": "synced",
        }
    except CrmApiError as exc:
        logger.error("CRM sync failed for project %s: %s", project.name, exc)
        return {**base, "total_hours": total_hours, "status": "error", "error": str(exc)}


def _build_description(issue_map, total_hours, month_label):
    """Build the HTML task description summarising hours per work item."""
    rows = "\n".join(
        f"  <tr><td>{_escape(d['name'])}</td><td>{round(d['seconds'] / 3600, 2)}h</td></tr>"
        for d in sorted(issue_map.values(), key=lambda x: x["seq"] or 0)
    )
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    return (
        f"<b>Work Summary — {_escape(month_label)}</b>\n\n"
        f"<table>\n  <tr><th>Task</th><th>Hours</th></tr>\n"
        f"{rows}\n"
        f"  <tr><td><b>Total</b></td><td><b>{total_hours}h</b></td></tr>\n"
        f"</table>\n\n"
        f"<i>Auto-generated by Plane on {generated_at} UTC</i>"
    )


def _escape(value):
    """Minimal HTML escaping for values interpolated into the description."""
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _coerce_crm_project_id(value):
    """Return a positive int CRM project id from a stored custom-field value, else None."""
    if value is None or isinstance(value, (list, dict, bool)):
        return None
    try:
        crm_id = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return crm_id if crm_id > 0 else None


def _already_synced_crm_project_ids(integration, month_date):
    """Collect CRM project ids already synced for a given month across prior logs."""
    synced = set()
    logs = CrmSyncLog.objects.filter(
        integration=integration, sync_month=month_date
    ).values_list("details", flat=True)
    for details in logs:
        for entry in details or []:
            if entry.get("status") == "synced" and entry.get("crm_project_id") is not None:
                synced.add(entry["crm_project_id"])
    return synced
