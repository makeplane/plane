# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for WorkspaceUserProfileIssuesEndpoint progress_tracking filter.
URL: /api/workspaces/<slug>/user-issues/<user_id>/
Buckets (relative to today):
    off_track  -> target_date < today
    due_today  -> target_date == today
    at_risk    -> target_date == today + 1
    on_track   -> target_date > today + 1
"""

from __future__ import annotations

import json
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from plane.db.models import (
    Issue,
    IssueAssignee,
    Project,
    ProjectMember,
    State,
    StateGroup,
)


@pytest.fixture
def workspace_with_project_and_states(workspace, create_user):
    """Workspace + project (user is member) + a default state."""
    project = Project.objects.create(
        name="Profile Test Project",
        identifier="PTP",
        workspace=workspace,
        created_by=create_user,
        updated_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(
        workspace=workspace,
        project=project,
        name="Unstarted",
        group=StateGroup.UNSTARTED.value,
        color="#111111",
    )
    return {"workspace": workspace, "project": project, "state": state}


def _make_issue(fixtures, user, name, target_date):
    """Create an issue assigned to `user` with given target_date (or None)."""
    # NOTE: BaseModel.save() ignores the `created_by=` field via Manager.create
    # because save() resets it from crum's get_current_user() (None in tests).
    # Must instantiate and call save(disable_auto_set_user=True) to preserve
    # explicit created_by — see plane/db/models/base.py.
    issue = Issue(
        workspace=fixtures["workspace"],
        project=fixtures["project"],
        state=fixtures["state"],
        name=name,
        target_date=target_date,
        created_by=user,
    )
    issue.save(disable_auto_set_user=True)
    IssueAssignee.objects.create(
        issue=issue,
        assignee=user,
        project=fixtures["project"],
        workspace=fixtures["workspace"],
    )
    return issue


@pytest.fixture
def assigned_issues_by_bucket(workspace_with_project_and_states, create_user):
    """
    Create one issue per progress-tracking bucket (plus one with no target_date).
    Returns {bucket_key: issue_id}.
    """
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)

    return {
        "off_track": str(_make_issue(workspace_with_project_and_states, create_user, "Off Track", yesterday).id),
        "due_today": str(_make_issue(workspace_with_project_and_states, create_user, "Due Today", today).id),
        "at_risk": str(_make_issue(workspace_with_project_and_states, create_user, "At Risk", tomorrow).id),
        "on_track": str(_make_issue(workspace_with_project_and_states, create_user, "On Track", day_after).id),
        "no_date": str(_make_issue(workspace_with_project_and_states, create_user, "No Date", None).id),
    }


def _get(session_client, workspace, user_id, *, filters=None, view="assigned"):
    """Hit the user-issues endpoint with given JSON filters + view param."""
    url = reverse(
        "workspace-user-profile-issues",
        kwargs={"slug": workspace.slug, "user_id": str(user_id)},
    )
    params = {}
    if filters is not None:
        params["filters"] = json.dumps(filters)
    # Mirror frontend behavior — assigned view passes ?assignees=<userId>
    if view == "assigned":
        params["assignees"] = str(user_id)
    elif view == "created":
        params["created_by"] = str(user_id)
    elif view == "subscribed":
        params["subscriber"] = str(user_id)
    return session_client.get(url, params)


@pytest.mark.contract
@pytest.mark.django_db
class TestProfileIssuesProgressTracking:
    """Validate every progress_tracking bucket on /user-issues/."""

    def _ids(self, response):
        assert response.status_code == 200, response.content
        return {r["id"] for r in response.json()["results"]}

    def test_no_filter_returns_all_assigned(self, session_client, workspace, create_user, assigned_issues_by_bucket):
        ids = self._ids(_get(session_client, workspace, create_user.id))
        # all 5 issues (4 buckets + 1 no-date) belong to user
        assert ids == set(assigned_issues_by_bucket.values())

    @pytest.mark.parametrize("bucket", ["off_track", "due_today", "at_risk", "on_track"])
    def test_single_bucket_via_in(
        self, session_client, workspace, create_user, assigned_issues_by_bucket, bucket
    ):
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"progress_tracking__in": bucket},
        )
        ids = self._ids(resp)
        assert ids == {assigned_issues_by_bucket[bucket]}, (
            f"bucket={bucket} expected only {assigned_issues_by_bucket[bucket]}, got {ids}"
        )

    @pytest.mark.parametrize("bucket", ["off_track", "due_today", "at_risk", "on_track"])
    def test_single_bucket_via_exact(
        self, session_client, workspace, create_user, assigned_issues_by_bucket, bucket
    ):
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"progress_tracking__exact": bucket},
        )
        ids = self._ids(resp)
        assert ids == {assigned_issues_by_bucket[bucket]}

    def test_multi_value_in_returns_union(
        self, session_client, workspace, create_user, assigned_issues_by_bucket
    ):
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"progress_tracking__in": "off_track,due_today"},
        )
        ids = self._ids(resp)
        assert ids == {
            assigned_issues_by_bucket["off_track"],
            assigned_issues_by_bucket["due_today"],
        }

    def test_not_in_excludes_buckets(
        self, session_client, workspace, create_user, assigned_issues_by_bucket
    ):
        # NOT_IN should exclude off_track AND due_today.
        # NOTE: items with NULL target_date will also be excluded because the
        # progress_tracking buckets compare on target_date and NULL fails comparison.
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"not": {"progress_tracking__in": "off_track,due_today"}},
        )
        ids = self._ids(resp)
        assert assigned_issues_by_bucket["off_track"] not in ids
        assert assigned_issues_by_bucket["due_today"] not in ids
        # at_risk + on_track should remain
        assert assigned_issues_by_bucket["at_risk"] in ids
        assert assigned_issues_by_bucket["on_track"] in ids

    def test_unknown_bucket_value_is_noop(
        self, session_client, workspace, create_user, assigned_issues_by_bucket
    ):
        # Documents current backend behavior: when filter values do not match
        # any known bucket, `_progress_tracking_q` returns an empty Q() which
        # is a no-op — the queryset is NOT restricted. This is graceful
        # degradation (rather than 400) and matches the unknown-priority /
        # unknown-state behavior of other filters.
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"progress_tracking__in": "garbage_value"},
        )
        ids = self._ids(resp)
        # All 5 assigned issues returned — filter is silently ignored.
        assert ids == set(assigned_issues_by_bucket.values())

    def test_combined_with_and_clause(
        self, session_client, workspace, create_user, assigned_issues_by_bucket
    ):
        # AND of two single-bucket conditions on different fields — sanity check
        # that progress_tracking composes with other filters via {"and": [...]}.
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={
                "and": [
                    {"progress_tracking__in": "off_track,due_today,at_risk,on_track"},
                ]
            },
        )
        ids = self._ids(resp)
        # Should yield all 4 dated issues, exclude the no-date one
        assert ids == {
            assigned_issues_by_bucket["off_track"],
            assigned_issues_by_bucket["due_today"],
            assigned_issues_by_bucket["at_risk"],
            assigned_issues_by_bucket["on_track"],
        }

    def test_no_date_issue_not_in_any_bucket(
        self, session_client, workspace, create_user, assigned_issues_by_bucket
    ):
        for bucket in ("off_track", "due_today", "at_risk", "on_track"):
            resp = _get(
                session_client,
                workspace,
                create_user.id,
                filters={"progress_tracking__in": bucket},
            )
            ids = self._ids(resp)
            assert assigned_issues_by_bucket["no_date"] not in ids, (
                f"No-date issue leaked into bucket={bucket}"
            )

    def test_created_view_applies_filter(
        self,
        session_client,
        workspace,
        create_user,
        assigned_issues_by_bucket,
    ):
        resp = _get(
            session_client,
            workspace,
            create_user.id,
            filters={"progress_tracking__in": "off_track"},
            view="created",
        )
        ids = self._ids(resp)
        assert ids == {assigned_issues_by_bucket["off_track"]}
