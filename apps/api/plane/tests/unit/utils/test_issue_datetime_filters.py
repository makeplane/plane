# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for created_at / updated_at rich-filter lookups (WEB-8477 Bug 5).

``created_at`` and ``updated_at`` are DateTimeFields, but the UI sends a bare calendar
date. With the default ``exact`` / ``range`` lookups django-filter coerced those dates to
midnight, so:

* ``created_at__exact=<date>`` matched only rows stamped exactly 00:00:00 -> always empty.
* ``created_at__range=<a>,<b>`` capped the upper bound at ``b`` 00:00:00 -> silently
  dropped every row created during the final day of the range.

Both surfaced as "filter returns no work items". The filters now compare the date
component (``date`` / ``date__range``) so a calendar date means the whole day.
"""

import datetime

import pytest

from plane.db.models import Issue, Project, ProjectMember
from plane.utils.filters.filterset import IssueFilterSet


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Filter Project",
        identifier="FP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _issue_at(project, create_user, name, created, updated):
    """Create an issue then force created_at/updated_at (both are auto-managed)."""
    issue = Issue.objects.create(name=name, project=project, workspace=project.workspace, created_by=create_user)
    Issue.objects.filter(pk=issue.pk).update(created_at=created, updated_at=updated)
    issue.refresh_from_db()
    return issue


@pytest.fixture
def issues(db, project, create_user):
    tz = datetime.timezone.utc
    return {
        # created mid-day, NOT at midnight — the case `exact` used to miss
        "midday": _issue_at(
            project,
            create_user,
            "midday",
            datetime.datetime(2026, 7, 30, 13, 45, tzinfo=tz),
            datetime.datetime(2026, 7, 30, 13, 45, tzinfo=tz),
        ),
        # created on an earlier day, but updated on 2026-07-30
        "old": _issue_at(
            project,
            create_user,
            "old",
            datetime.datetime(2020, 1, 1, 9, 0, tzinfo=tz),
            datetime.datetime(2026, 7, 30, 10, 0, tzinfo=tz),
        ),
    }


def _filter(project, data):
    qs = Issue.objects.filter(project=project)
    fs = IssueFilterSet(data=data, queryset=qs)
    assert fs.is_valid(), fs.errors
    return set(fs.qs.values_list("name", flat=True))


@pytest.mark.unit
class TestCreatedAtFilter:
    def test_exact_matches_whole_day_not_just_midnight(self, project, issues):
        # Previously returned nothing because 13:45 != 00:00:00.
        assert _filter(project, {"created_at__exact": "2026-07-30"}) == {"midday"}

    def test_exact_excludes_other_days(self, project, issues):
        assert _filter(project, {"created_at__exact": "2020-01-01"}) == {"old"}
        assert _filter(project, {"created_at__exact": "2019-05-05"}) == set()

    def test_range_includes_the_final_day(self, project, issues):
        # Previously returned nothing: the upper bound became 2026-07-30 00:00:00.
        assert _filter(project, {"created_at__range": "2026-07-28,2026-07-30"}) == {"midday"}

    def test_single_day_range(self, project, issues):
        assert _filter(project, {"created_at__range": "2026-07-30,2026-07-30"}) == {"midday"}

    def test_range_excludes_outside_days(self, project, issues):
        assert _filter(project, {"created_at__range": "2019-01-01,2019-12-31"}) == set()


@pytest.mark.unit
class TestUpdatedAtFilter:
    def test_exact_uses_updated_at_not_created_at(self, project, issues):
        # "old" was created in 2020 but updated on 2026-07-30, so it must be included.
        assert _filter(project, {"updated_at__exact": "2026-07-30"}) == {"midday", "old"}

    def test_range_includes_the_final_day(self, project, issues):
        assert _filter(project, {"updated_at__range": "2026-07-28,2026-07-30"}) == {"midday", "old"}
