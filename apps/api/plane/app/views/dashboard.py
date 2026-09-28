# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Thin authenticated views for the Team Operations Dashboard.

Pattern mirrors :mod:`plane.app.views.analytic_v2`: real ``BaseAPIView``
+ ``@allow_permission`` workspace-level guards, DRF ``request.data``
parsing, ``Response`` payloads, and explicit ``_bad_request`` /
``_workspace_or_404`` helpers. No hand-rolled JSON parsing; no leaked
``str(exc)`` on 500.

Endpoints (all singular ``/dashboard/`` so they stay distinct from the
retired ``/dashboards/`` CRUD — see ``test_dashboard_app.py`` RD-484):

* ``POST /api/workspaces/{slug}/dashboard/overview/`` — composed overview.
* ``POST /api/workspaces/{slug}/dashboard/attention/`` — attention union + reasons.
* ``POST /api/workspaces/{slug}/dashboard/items/`` — paginated drilldown.

Each endpoint returns the canonical envelope
``{version, generated_at, scope_key, resolved_*, timezone, sections}``.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

from plane.analytics.dashboard import (
    DashboardContractError,
    MetricUnavailableError,
    VALID_DATE_BUCKETS,
    resolve_dashboard_scope,
)
from plane.analytics.dashboard.items import (
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    ItemRequest,
    attention_payload,
    list_items,
)
from plane.analytics.dashboard.projects import projects_payload
from plane.analytics.dashboard.service import envelope, overview_payload
from plane.analytics.dashboard.snapshot import (
    SnapshotIsolationUnavailable,
    dashboard_snapshot,
)
from plane.analytics.dashboard.timeline import timeline_payload
from plane.analytics.dashboard.workload import workload_payload
from plane.analytics.dashboard.group_breakdown import work_items_group_payload
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace


logger = logging.getLogger("plane.analytics.dashboard")


# ----- helpers ----------------------------------------------------------


def _workspace_or_404(slug: str) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None


def _validate_payload(payload: Any) -> Dict[str, Any]:
    """Reject malformed payloads with DashboardContractError → 400.

    DRF's ``request.data`` parser yields ``dict``, ``list``, ``str``, or
    ``None`` depending on the body. We only accept ``dict``; nested
    ``business_filters`` must also be a dict so the service layer never
    iterates over a list.
    """
    if payload is None:
        return {}
    if not isinstance(payload, dict):
        raise DashboardContractError("Body must be a JSON object")
    bf = payload.get("business_filters")
    if bf is not None and not isinstance(bf, dict):
        raise DashboardContractError("business_filters must be an object")
    return payload


def _bad_request(message: str, *, code: str = "INVALID_PAYLOAD", exc: Exception | None = None) -> Response:
    if exc is not None:
        logger.warning("Dashboard bad request: %s", code, exc_info=exc)
    return Response(
        {"error": message, "code": code},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _not_found(message: str = "Workspace not found", *, code: str = "WORKSPACE_NOT_FOUND") -> Response:
    return Response({"error": message, "code": code}, status=status.HTTP_404_NOT_FOUND)


def _conflict(message: str, *, code: str = "METRIC_UNAVAILABLE") -> Response:
    return Response({"error": message, "code": code}, status=status.HTTP_409_CONFLICT)


def _unavailable(message: str, *, code: str = "SNAPSHOT_ISOLATION_UNAVAILABLE") -> Response:
    """HTTP 503 — the request cannot be served under the documented contract.

    SnapshotIsolationUnavailable is raised by ``dashboard_snapshot`` when
    REPEATABLE READ cannot be established on the connection (test-runner
    outer transaction, savepoint nesting, SET TRANSACTION rejected by
    the server). We refuse to silently fall back to READ COMMITTED
    because that violates spec §9.4. The caller should retry the
    request from a fresh connection (e.g. after the Django test
    runner's outer transaction has committed).
    """
    return Response({"error": message, "code": code}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ----- Overview endpoint ------------------------------------------------


class DashboardOverviewEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/overview/``.

    Body: optional ``{project_ids, period_preset, start, end,
    business_filters, date_bucket}``. Returns the canonical envelope
    with sections ``kpis``, ``progress``, ``delivery`` (bucketed by
    ``date_bucket``), ``top_projects``, ``attention_preview``,
    ``workload_preview`` (deferred to Task 3), ``request_meta``.
    Each section is independently wrapped in try/except so a single
    failing section cannot blank the rest.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace,
                        principal=request.user,
                        payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                requested_bucket = str(payload.get("date_bucket", "day"))
                if requested_bucket not in VALID_DATE_BUCKETS:
                    return _bad_request(
                        f"date_bucket must be one of {sorted(VALID_DATE_BUCKETS)}",
                        code="INVALID_PAYLOAD",
                    )

                sections = overview_payload(scope, date_bucket=requested_bucket)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, sections), status=status.HTTP_200_OK)


# ----- Attention endpoint -----------------------------------------------


class DashboardAttentionEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/attention/``.

    Returns paginated attention union rows + per-rule reason counts.
    Each row carries ONLY the rule keys it actually satisfies (per-row
    Exists annotations; no fabricated badges). Supports ``page`` and
    ``page_size`` query params; rows are sorted by severity-first then
    by id as a final tie-break.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace,
                        principal=request.user,
                        payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                from plane.analytics.dashboard.items import paginated_attention
                try:
                    page = int(payload.get("page", 1))
                    page_size = int(payload.get("page_size", 25))
                except (ValueError, TypeError) as exc:
                    return _bad_request(f"Invalid attention payload: {exc}", code="INVALID_PAYLOAD", exc=exc)
                page = max(1, page)
                page_size = max(1, min(page_size, 100))

                data = paginated_attention(scope, page=page, page_size=page_size)
                # Wrap as a section dict for envelope consistency.
                section = {
                    "status": "ok",
                    "section_id": "attention",
                    "data": {
                        "rows": data["rows"],
                        "total": data["total"],
                        "reason_counts": data["reason_counts"],
                        "union_total": data["union_total"],
                        "page": data["page"],
                        "page_size": data["page_size"],
                        "has_more": data["has_more"],
                        "scope_key": data["scope_key"],
                    },
                }
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, section), status=status.HTTP_200_OK)


# ----- Items / drilldown endpoint --------------------------------------


class DashboardWorkloadEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/workload/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace, principal=request.user, payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    page = int(payload.get("page", 1))
                    page_size = int(payload.get("page_size", 25))
                except (ValueError, TypeError) as exc:
                    return _bad_request(f"Invalid workload payload: {exc}", code="INVALID_PAYLOAD", exc=exc)
                page = max(1, page)
                page_size = max(1, min(page_size, 100))

                wip_threshold = payload.get("wip_threshold")
                if wip_threshold is not None:
                    try:
                        wip_threshold = int(wip_threshold)
                    except (ValueError, TypeError):
                        return _bad_request("wip_threshold must be an integer", code="INVALID_PAYLOAD")

                preview = bool(payload.get("preview", False))
                breakdown_by = payload.get("breakdown_by")
                if breakdown_by is not None:
                    breakdown_by = str(breakdown_by)
                breakdown_limit = 5
                if payload.get("breakdown_limit") is not None:
                    try:
                        breakdown_limit = int(payload.get("breakdown_limit"))
                    except (ValueError, TypeError) as exc:
                        return _bad_request(f"Invalid breakdown_limit: {exc}", code="INVALID_PAYLOAD", exc=exc)
                try:
                    data = workload_payload(
                        scope, page=page, page_size=page_size,
                        wip_threshold=wip_threshold, preview=preview,
                        breakdown_by=breakdown_by,
                        breakdown_limit=breakdown_limit,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, data), status=status.HTTP_200_OK)


class DashboardProjectsEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/projects/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace, principal=request.user, payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    page = int(payload.get("page", 1))
                    page_size = int(payload.get("page_size", 25))
                except (ValueError, TypeError) as exc:
                    return _bad_request(f"Invalid projects payload: {exc}", code="INVALID_PAYLOAD", exc=exc)
                page = max(1, page)
                page_size = max(1, min(page_size, 100))

                try:
                    data = projects_payload(scope, page=page, page_size=page_size)
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, data), status=status.HTTP_200_OK)


class DashboardTimelineEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/timeline/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace, principal=request.user, payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    cycles_page = int(payload.get("cycles_page", 1))
                    deadlines_page = int(payload.get("deadlines_page", 1))
                    unscheduled_page = int(payload.get("unscheduled_page", 1))
                    page_size = int(payload.get("page_size", 25))
                except (ValueError, TypeError) as exc:
                    return _bad_request(f"Invalid timeline payload: {exc}", code="INVALID_PAYLOAD", exc=exc)

                try:
                    data = timeline_payload(
                        scope,
                        cycles_page=cycles_page,
                        deadlines_page=deadlines_page,
                        unscheduled_page=unscheduled_page,
                        page_size=page_size,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, data), status=status.HTTP_200_OK)


class DashboardWorkItemsGroupEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/work-items-group/``.

    Groups open work in the current scope by ``project``, ``module``,
    ``cycle``, or ``label``. Body: canonical scope fields plus
    ``group_by`` and optional ``limit`` (default 10, max 50).
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        group_by = str(payload.get("group_by", "label"))
        try:
            limit = int(payload.get("limit", 10))
        except (ValueError, TypeError) as exc:
            return _bad_request(f"Invalid limit: {exc}", code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace, principal=request.user, payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    data = work_items_group_payload(scope, group_by=group_by, limit=limit)
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))

        section = {"status": "ok", "section_id": "work_items_group", "data": data}
        return Response(envelope(scope, section), status=status.HTTP_200_OK)


class DashboardItemsEndpoint(BaseAPIView):
    """``POST /api/workspaces/{slug}/dashboard/items/``.

    Body::

        {
          "metric": "overdue" | "blocked" | ... | "all",
          "page": 1,
          "page_size": 25,
          "project_ids": [...],
          "period_preset": "this_month",
          "business_filters": {...},
          "selection": {
            "metric": "...",
            "values": {"project_id": "...", "assignee_id": null, ...},
            "date_start": "...",
            "date_end": "..."
          }
        }

    Returns a paginated items payload (rows + total + scope_key +
    echoed selection). The total equals the corresponding ``count_*``
    for the same metric and unchanged read state (count/list parity).
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request: Request, slug: str) -> Response:
        workspace = _workspace_or_404(slug)
        if workspace is None:
            return _not_found()

        try:
            payload = _validate_payload(request.data or {})
        except DashboardContractError as exc:
            return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

        try:
            with dashboard_snapshot():
                try:
                    scope = resolve_dashboard_scope(
                        workspace=workspace,
                        principal=request.user,
                        payload=payload,
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    raw_page = int(payload.get("page", 1))
                    raw_page_size = int(payload.get("page_size", DEFAULT_PAGE_SIZE))
                except (ValueError, TypeError) as exc:
                    return _bad_request(
                        f"Invalid items payload: {exc}",
                        code="INVALID_PAYLOAD",
                        exc=exc,
                    )

                clamped_page_size = min(max(raw_page_size, 1), MAX_PAGE_SIZE)
                clamped_page = max(raw_page, 1)

                selection = payload.get("selection") or {}
                values = selection.get("values") or {}

                # Agreed contract: ``selection.metric`` is the authoritative
                # metric. ``payload.metric`` is the legacy path kept for
                # compatibility with the prior worker; if both are present,
                # ``selection.metric`` wins. ``selection.metric`` must validate
                # against VALID_SNAPSHOT_RULES.
                selection_metric = selection.get("metric")
                payload_metric = payload.get("metric")
                effective_metric = selection_metric if selection_metric is not None else payload_metric

                try:
                    item_request = ItemRequest(
                        metric=effective_metric,
                        attention_rules=payload.get("attention_rules"),
                        page=clamped_page,
                        page_size=clamped_page_size,
                        project_id=values.get("project_id"),
                        cycle_id=values.get("cycle_id"),
                        module_id=values.get("module_id"),
                        label_id=values.get("label_id"),
                        state_group=values.get("state_group"),
                        priority=values.get("priority"),
                        # Coerce explicit None to "" so the canonical unassigned
                        # representation passes through.
                        assignee_id="" if values.get("assignee_id", "__missing__") is None
                        else values.get("assignee_id"),
                        date_start=selection.get("date_start"),
                        date_end=selection.get("date_end"),
                        delivery_base=selection.get("delivery_base", "created_at"),
                    )
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)

                try:
                    data = list_items(scope, item_request)
                except MetricUnavailableError as exc:
                    return _conflict(str(exc), code="METRIC_UNAVAILABLE")
                except DashboardContractError as exc:
                    return _bad_request(str(exc), code="INVALID_PAYLOAD", exc=exc)
        except SnapshotIsolationUnavailable as exc:
            return _unavailable(str(exc))
        return Response(envelope(scope, data), status=status.HTTP_200_OK)