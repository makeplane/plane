# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for CycleProgressEndpoint.

The endpoint reports per-state-group work-item counts for a cycle. Those six
numbers used to be six sequential ``.count()`` round trips over the same
``issues ⋈ cycle_issues ⋈ states`` join; they are now a single aggregate.

These tests pin the observable contract (the six numbers, and which work items
are in scope) and guard the query count so the fan-out cannot silently return.
"""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    Project,
    ProjectMember,
    State,
)

# One work item per group, so an off-by-one or a mixed-up group label in the
# aggregate cannot be masked by two groups sharing a count.
GROUP_ISSUE_COUNTS = {
    "backlog": 1,
    "unstarted": 2,
    "started": 3,
    "cancelled": 4,
    "completed": 5,
}


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Progress Project",
        identifier="PRG",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def states(db, workspace, project):
    """One state per group, including triage (excluded by Issue.issue_objects)."""
    return {
        group: State.objects.create(
            name=group.title(),
            project=project,
            workspace=workspace,
            group=group,
            is_triage=(group == "triage"),
        )
        for group in (*GROUP_ISSUE_COUNTS, "triage")
    }


@pytest.fixture
def cycle(db, workspace, project, create_user):
    return Cycle.objects.create(
        name="Progress Cycle",
        project=project,
        workspace=workspace,
        owned_by=create_user,
    )


def _make_issue(workspace, project, state, created_by, name, **kwargs):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=created_by,
        **kwargs,
    )


def _add_to_cycle(issue, cycle, workspace, project, created_by):
    return CycleIssue.objects.create(
        issue=issue,
        cycle=cycle,
        project=project,
        workspace=workspace,
        created_by=created_by,
    )


@pytest.fixture
def populated_cycle(db, workspace, project, cycle, states, create_user):
    """GROUP_ISSUE_COUNTS work items per group, all assigned to the cycle."""
    for group, count in GROUP_ISSUE_COUNTS.items():
        for index in range(count):
            issue = _make_issue(workspace, project, states[group], create_user, f"{group}-{index}")
            _add_to_cycle(issue, cycle, workspace, project, create_user)
    return cycle


@pytest.mark.contract
class TestCycleProgressEndpoint:
    def get_url(self, workspace_slug, project_id, cycle_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/progress/"

    @pytest.mark.django_db
    def test_counts_are_reported_per_state_group(self, session_client, workspace, project, populated_cycle):
        """Each group reports its own work items, and total is their sum."""
        url = self.get_url(workspace.slug, project.id, populated_cycle.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        for group, expected in GROUP_ISSUE_COUNTS.items():
            assert response.data[f"{group}_issues"] == expected, (
                f"{group}_issues should be {expected}, got {response.data[f'{group}_issues']}"
            )
        assert response.data["total_issues"] == sum(GROUP_ISSUE_COUNTS.values())

    @pytest.mark.django_db
    def test_out_of_scope_work_items_are_excluded(self, session_client, workspace, project, cycle, states, create_user):
        """Only live, non-archived, non-draft, non-triage work items *in this
        cycle* count. Each exclusion below is one predicate the aggregate must
        keep honouring."""
        counted = _make_issue(workspace, project, states["started"], create_user, "counted")
        _add_to_cycle(counted, cycle, workspace, project, create_user)

        # Removed from the cycle: the CycleIssue row is soft-deleted. Use the
        # queryset delete (a plain deleted_at update) rather than the instance
        # delete, which enqueues a Celery cascade unrelated to this endpoint.
        removed = _make_issue(workspace, project, states["started"], create_user, "removed")
        removed_link = _add_to_cycle(removed, cycle, workspace, project, create_user)
        CycleIssue.objects.filter(pk=removed_link.pk).delete()

        # Never added to any cycle.
        _make_issue(workspace, project, states["started"], create_user, "unassigned")

        # In the cycle but filtered out by the Issue.issue_objects manager.
        for name, kwargs, state_group in (
            ("archived", {"archived_at": timezone.now()}, "started"),
            ("draft", {"is_draft": True}, "started"),
            ("triage", {}, "triage"),
        ):
            issue = _make_issue(workspace, project, states[state_group], create_user, name, **kwargs)
            _add_to_cycle(issue, cycle, workspace, project, create_user)

        url = self.get_url(workspace.slug, project.id, cycle.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert response.data["started_issues"] == 1
        assert response.data["total_issues"] == 1

    @pytest.mark.django_db
    def test_counts_are_resolved_in_a_single_query(self, session_client, workspace, project, populated_cycle):
        """Regression guard: the six group counts must stay one round trip.

        Scoped to COUNT queries touching cycle_issues so unrelated query-count
        changes elsewhere in the request do not make this brittle.
        """
        url = self.get_url(workspace.slug, project.id, populated_cycle.id)

        with CaptureQueriesContext(connection) as queries:
            response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        count_queries = [
            query["sql"]
            for query in queries.captured_queries
            if "COUNT(" in query["sql"].upper() and "cycle_issues" in query["sql"]
        ]
        assert len(count_queries) == 1, (
            f"Expected the cycle progress counts to resolve in one query, got {len(count_queries)}:\n"
            + "\n".join(count_queries)
        )

    @pytest.mark.django_db
    def test_snapshot_is_preferred_over_live_counts(self, session_client, workspace, project, populated_cycle):
        """A completed cycle serves its frozen snapshot and issues no count query."""
        populated_cycle.progress_snapshot = {
            "backlog_issues": 10,
            "unstarted_issues": 20,
            "started_issues": 30,
            "cancelled_issues": 40,
            "completed_issues": 50,
            "total_issues": 150,
        }
        populated_cycle.save(update_fields=["progress_snapshot"])

        url = self.get_url(workspace.slug, project.id, populated_cycle.id)

        with CaptureQueriesContext(connection) as queries:
            response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert response.data["total_issues"] == 150
        assert response.data["started_issues"] == 30
        assert not [
            query["sql"]
            for query in queries.captured_queries
            if "COUNT(" in query["sql"].upper() and "cycle_issues" in query["sql"]
        ], "The snapshot branch must not fall through to the live counts"
