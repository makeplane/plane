# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests for the Engineering Operations rules that fail silently if they break.

The dashboards and analytics endpoints are mostly queries, and a query that
goes wrong shows up as an obviously empty screen. These four do not:

* **The configuration merge.** A workspace that overrides one setting must not
  lose the rest. Get this wrong and a workspace silently loses its state
  mapping, and every dashboard reads zero without erroring.
* **The reporting period.** A "weekly" report that quietly covers thirty days
  is worse than no report -- nothing about it looks wrong.
* **The ticket lifecycle graph.** It is the only thing standing between a
  request and being converted without review.
* **The bridge's optional endpoints.** A 404 from a bridge that has not been
  upgraded has to read as "not available yet", not as an outage.
"""

from datetime import date, timedelta
from unittest.mock import patch

import pytest
from rest_framework import status

from workspaces.app.views.operations.report import REPORT_TYPES, report_period
from workspaces.app.views.operations.ticket import ALLOWED_TRANSITIONS
from workspaces.db.models import OperationsTicketStatus
from workspaces.utils.engineering_ops import (
    DEFAULT_OPERATIONS_CONFIG,
    DEFAULT_STATE_MAPPING,
    average,
    days_between,
    deep_merge,
    hours_between,
    resolve_period,
    state_names,
)
from workspaces.utils.odoo_bridge import call_optional


class FakeRequest:
    """The only thing the period helpers touch on a request."""

    def __init__(self, **params):
        self.query_params = {key: value for key, value in params.items() if value is not None}


# ---------------------------------------------------------------------------
# deep_merge
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_deep_merge_keeps_sibling_keys():
    """Overriding one nested key must not drop the others beside it."""
    merged = deep_merge(DEFAULT_OPERATIONS_CONFIG, {"work_log": {"reminder_hour": 9}})

    assert merged["work_log"]["reminder_hour"] == 9
    # The half the caller did not mention.
    assert merged["work_log"]["required_weekdays"] == DEFAULT_OPERATIONS_CONFIG["work_log"]["required_weekdays"]
    assert merged["work_log"]["enabled"] is True
    # And the panels it did not touch at all.
    assert merged["state_mapping"] == DEFAULT_OPERATIONS_CONFIG["state_mapping"]
    assert merged["notifications"] == DEFAULT_OPERATIONS_CONFIG["notifications"]


@pytest.mark.unit
def test_deep_merge_does_not_mutate_the_defaults():
    """The defaults are module state; merging must never write through to them."""
    before = DEFAULT_OPERATIONS_CONFIG["work_log"]["reminder_hour"]
    deep_merge(DEFAULT_OPERATIONS_CONFIG, {"work_log": {"reminder_hour": 3}})

    assert DEFAULT_OPERATIONS_CONFIG["work_log"]["reminder_hour"] == before


@pytest.mark.unit
def test_deep_merge_replaces_lists_wholesale():
    """A list is a value, not a thing to merge -- overriding one replaces it."""
    merged = deep_merge(DEFAULT_OPERATIONS_CONFIG, {"state_mapping": {"qa": ["Testing"]}})

    assert merged["state_mapping"]["qa"] == ["Testing"]
    assert merged["state_mapping"]["in_progress"] == DEFAULT_STATE_MAPPING["in_progress"]


# ---------------------------------------------------------------------------
# state_names
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_state_names_falls_back_to_the_default_bucket():
    """A config missing a bucket entirely still resolves to the shipped names."""
    assert state_names({}, "qa") == DEFAULT_STATE_MAPPING["qa"]
    assert state_names({"state_mapping": {}}, "qa") == DEFAULT_STATE_MAPPING["qa"]


@pytest.mark.unit
def test_state_names_returns_empty_for_an_unknown_bucket():
    assert state_names(DEFAULT_OPERATIONS_CONFIG, "no_such_bucket") == []


# ---------------------------------------------------------------------------
# resolve_period
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_resolve_period_honours_explicit_dates():
    start, end = resolve_period(FakeRequest(start_date="2026-01-01", end_date="2026-01-31"))

    assert (start, end) == (date(2026, 1, 1), date(2026, 1, 31))


@pytest.mark.unit
def test_resolve_period_swaps_a_backwards_range():
    """A range entered the wrong way round is a typo, not an empty report."""
    start, end = resolve_period(FakeRequest(start_date="2026-01-31", end_date="2026-01-01"))

    assert (start, end) == (date(2026, 1, 1), date(2026, 1, 31))


@pytest.mark.unit
def test_resolve_period_days_window_is_inclusive_of_both_ends():
    start, end = resolve_period(FakeRequest(days=7, end_date="2026-01-31"))

    assert end == date(2026, 1, 31)
    assert start == date(2026, 1, 25)
    assert (end - start).days + 1 == 7


@pytest.mark.unit
@pytest.mark.parametrize("days", ["0", "-5", "9999", "not-a-number", ""])
def test_resolve_period_clamps_nonsense_windows(days):
    """
    An unbounded window is a full scan of the workspace's activity trail.

    Every one of these has to land inside the 1..365 day clamp rather than
    reaching the database.
    """
    start, end = resolve_period(FakeRequest(days=days, end_date="2026-01-31"))

    assert 1 <= (end - start).days + 1 <= 365


# ---------------------------------------------------------------------------
# Arithmetic helpers
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_average_ignores_missing_values():
    """`None` means "not measurable", which is not the same as zero."""
    assert average([2, None, 4]) == 3
    assert average([None, None]) is None
    assert average([]) is None


@pytest.mark.unit
def test_duration_helpers_return_none_without_both_ends():
    from django.utils import timezone

    now = timezone.now()
    assert hours_between(None, now) is None
    assert hours_between(now, None) is None
    assert days_between(None, None) is None

    assert hours_between(now - timedelta(hours=3), now) == 3.0
    assert days_between(now - timedelta(days=2), now) == 2.0


# ---------------------------------------------------------------------------
# The operations ticket lifecycle
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_every_status_has_a_transition_entry():
    """
    A status missing from the graph would refuse every move out of it.

    `.get(status, [])` in the view means the ticket would simply be stuck,
    with no error anywhere to explain why.
    """
    assert set(ALLOWED_TRANSITIONS) == set(OperationsTicketStatus.values)


@pytest.mark.unit
def test_no_transition_reaches_converted():
    """
    Conversion happens through `/convert/` only.

    Reaching CONVERTED through the transition endpoint would mark a ticket
    converted with no work item behind it, which nothing in the UI can undo.
    """
    for targets in ALLOWED_TRANSITIONS.values():
        assert OperationsTicketStatus.CONVERTED not in targets


@pytest.mark.unit
def test_approval_requires_passing_through_review():
    """A brand new request cannot be approved without somebody looking at it."""
    assert OperationsTicketStatus.APPROVED not in ALLOWED_TRANSITIONS[OperationsTicketStatus.NEW]
    assert OperationsTicketStatus.APPROVED in ALLOWED_TRANSITIONS[OperationsTicketStatus.PM_REVIEW]


@pytest.mark.unit
def test_closed_is_terminal():
    assert ALLOWED_TRANSITIONS[OperationsTicketStatus.CLOSED] == []


@pytest.mark.unit
def test_every_transition_target_is_a_real_status():
    for source, targets in ALLOWED_TRANSITIONS.items():
        for target in targets:
            assert target in OperationsTicketStatus.values, f"{source} -> {target}"
            assert target != source, f"{source} transitions to itself"


# ---------------------------------------------------------------------------
# Report periods
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_weekly_report_covers_the_week_that_just_finished():
    """Monday to Sunday of the previous week, whatever day it is run."""
    # 2026-09-04 is a Friday.
    start, end = report_period("weekly", FakeRequest(end_date="2026-09-04"))

    assert start == date(2026, 8, 24)  # Monday
    assert end == date(2026, 8, 30)  # Sunday
    assert start.isoweekday() == 1
    assert end.isoweekday() == 7


@pytest.mark.unit
def test_monthly_report_covers_the_previous_month():
    start, end = report_period("monthly", FakeRequest(end_date="2026-09-04"))

    assert start == date(2026, 8, 1)
    assert end == date(2026, 8, 31)


@pytest.mark.unit
def test_explicit_dates_win_over_the_preset():
    start, end = report_period("weekly", FakeRequest(start_date="2026-01-01", end_date="2026-03-31"))

    assert (start, end) == (date(2026, 1, 1), date(2026, 3, 31))


@pytest.mark.unit
@pytest.mark.parametrize("report_type", REPORT_TYPES)
def test_every_report_type_produces_a_forward_range(report_type):
    start, end = report_period(report_type, FakeRequest(end_date="2026-09-04"))

    assert start <= end


# ---------------------------------------------------------------------------
# call_optional
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.parametrize("code", [404, 405, 501])
def test_call_optional_reports_a_missing_route_as_absent(code):
    """
    A bridge that has not been upgraded is a deployment fact, not an outage.

    Returning `(None, None)` is what lets the endpoint answer 200 with
    `available: false` instead of a 503 that says something is broken.
    """
    with patch("workspaces.utils.odoo_bridge.call", return_value=(code, {})):
        assert call_optional("GET", "/api/v1/leave/me") == (None, None)


@pytest.mark.unit
def test_call_optional_passes_a_real_answer_straight_through():
    payload = {"balances": []}
    with patch("workspaces.utils.odoo_bridge.call", return_value=(status.HTTP_200_OK, payload)):
        assert call_optional("GET", "/api/v1/leave/me") == (status.HTTP_200_OK, payload)


# ---------------------------------------------------------------------------
# The beat schedule
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_every_scheduled_task_is_registered():
    """
    Beat publishes by name; a worker that never imported the module rejects it.

    Celery's autodiscovery looks for a ``tasks`` module inside each installed
    app, and this project's live under ``workspaces/bgtasks/*_task.py`` -- so a task module
    that nothing imports at runtime has to be listed in ``CELERY_IMPORTS``.
    Miss it and there is no error anywhere on either side: beat logs that it
    sent the task, the worker logs "received unregistered task", and the
    reminders simply never run.
    """
    from workspaces.celery import app

    app.loader.import_default_modules()

    unregistered = sorted(
        {entry["task"] for entry in app.conf.beat_schedule.values() if entry["task"] not in app.tasks}
    )

    assert unregistered == [], (
        f"Scheduled but not registered: {unregistered}. Add the module to CELERY_IMPORTS in workspaces/settings/common.py."
    )
