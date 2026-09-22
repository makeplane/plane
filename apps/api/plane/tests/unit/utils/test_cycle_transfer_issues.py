# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the transfer_cycle_issues atomicity bug (#9599).

transfer_cycle_issues used to persist the source cycle's progress_snapshot
and then, in a second, unrelated DB write, move the CycleIssue rows to the
destination cycle. If the process crashed or the DB errored between the two
writes, the source cycle was left marked with a snapshot while its issues
were never actually transferred - a data-integrity bug with no recovery
path. Both writes must happen inside a single atomic transaction so a
failure during the issue move rolls back the snapshot write as well.
"""

import threading
import time
from unittest import mock

import pytest
from django.db import connections
from django.http import HttpRequest

from plane.db.models import Cycle, CycleIssue, Issue, Project, ProjectMember, State
from plane.utils.cycle_transfer_issues import transfer_cycle_issues


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TCT",
        workspace=workspace,
        created_by=create_user,
        cycle_view=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def backlog_state(db, project, create_user):
    return State.objects.create(
        name="Backlog",
        project=project,
        workspace=project.workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def source_cycle(db, project, create_user):
    return Cycle.objects.create(
        name="Source Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
    )


@pytest.fixture
def destination_cycle(db, project, create_user):
    return Cycle.objects.create(
        name="Destination Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
    )


@pytest.fixture
def incomplete_cycle_issue(db, project, create_user, backlog_state, source_cycle):
    """A single incomplete issue assigned to the source cycle."""
    issue = Issue.objects.create(
        name="Incomplete Issue",
        workspace=project.workspace,
        project=project,
        state=backlog_state,
        created_by=create_user,
    )
    return CycleIssue.objects.create(
        issue=issue,
        cycle=source_cycle,
        project=project,
        workspace=project.workspace,
        created_by=create_user,
    )


@pytest.fixture
def dummy_request():
    request = HttpRequest()
    request.META["HTTP_HOST"] = "app.plane.so"
    return request


@pytest.mark.unit
@pytest.mark.django_db
class TestTransferCycleIssuesAtomicity:
    def test_bulk_update_failure_rolls_back_snapshot(
        self,
        project,
        source_cycle,
        destination_cycle,
        incomplete_cycle_issue,
        create_user,
        dummy_request,
    ):
        """If the CycleIssue move fails, the earlier progress_snapshot write
        must also be rolled back - the two must be all-or-nothing."""
        assert source_cycle.progress_snapshot == {}

        with mock.patch(
            "plane.utils.cycle_transfer_issues.CycleIssue.objects.bulk_update",
            side_effect=RuntimeError("simulated crash mid-transfer"),
        ):
            with pytest.raises(RuntimeError):
                transfer_cycle_issues(
                    slug=project.workspace.slug,
                    project_id=str(project.id),
                    cycle_id=str(source_cycle.id),
                    new_cycle_id=str(destination_cycle.id),
                    request=dummy_request,
                    user_id=str(create_user.id),
                )

        source_cycle.refresh_from_db()
        incomplete_cycle_issue.refresh_from_db()

        # The snapshot write must have been rolled back alongside the failed
        # issue move - not left committed on its own.
        assert source_cycle.progress_snapshot == {}
        # The issue must still belong to the source cycle.
        assert incomplete_cycle_issue.cycle_id == source_cycle.id

    def test_successful_transfer_moves_issues_and_saves_snapshot(
        self,
        project,
        source_cycle,
        destination_cycle,
        incomplete_cycle_issue,
        create_user,
        dummy_request,
        settings,
    ):
        settings.WEB_URL = "http://app.plane.so"

        with mock.patch("plane.utils.cycle_transfer_issues.issue_activity.delay"):
            result = transfer_cycle_issues(
                slug=project.workspace.slug,
                project_id=str(project.id),
                cycle_id=str(source_cycle.id),
                new_cycle_id=str(destination_cycle.id),
                request=dummy_request,
                user_id=str(create_user.id),
            )

        assert result == {"success": True}

        source_cycle.refresh_from_db()
        incomplete_cycle_issue.refresh_from_db()

        assert source_cycle.progress_snapshot != {}
        assert incomplete_cycle_issue.cycle_id == destination_cycle.id


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
class TestTransferCycleIssuesConcurrency:
    """Regression test for the race CodeRabbit flagged on PR #9684.

    transfer_cycle_issues used to lock the source cycle (select_for_update)
    only around the final writes, after already reading old_cycle's issue
    counts and distributions. Two concurrent transfers of the SAME source
    cycle could both read that data before either had moved anything. The
    first to acquire the lock would move the issues and save an accurate
    snapshot; the second would then acquire the lock, overwrite that
    snapshot with data computed before the first transfer's move (now
    stale), and move zero issues - while still returning
    {"success": True}. The fix locks the source cycle first, before any of
    the counting queries, so a transfer's snapshot always reflects the
    state as of when it actually acquired the lock.
    """

    def test_concurrent_transfers_do_not_persist_a_stale_snapshot(
        self,
        project,
        source_cycle,
        destination_cycle,
        incomplete_cycle_issue,
        create_user,
        settings,
    ):
        settings.WEB_URL = "http://app.plane.so"

        second_destination_cycle = Cycle.objects.create(
            name="Second Destination Cycle",
            project=project,
            workspace=project.workspace,
            owned_by=create_user,
        )

        # Fires once thread A is holding the source cycle's row lock,
        # mid-transaction (snapshot saved, not yet committed), and is about
        # to perform the real issue move. Starting thread B only after this
        # fires guarantees B's call genuinely overlaps with A's in-flight
        # transfer instead of running strictly after it.
        a_holds_lock = threading.Event()
        errors = []

        real_bulk_update = CycleIssue.objects.bulk_update

        def delayed_bulk_update(objs, fields, batch_size=100):
            if threading.current_thread().name == "transfer-A":
                a_holds_lock.set()
                # Give thread B a real window to run its own read(s) and
                # reach (and, with the fix, block on) the row lock before A
                # finally commits and releases it.
                time.sleep(1.0)
            return real_bulk_update(objs, fields, batch_size=batch_size)

        def run_transfer(thread_name, destination):
            threading.current_thread().name = thread_name
            request = HttpRequest()
            request.META["HTTP_HOST"] = "app.plane.so"
            try:
                transfer_cycle_issues(
                    slug=project.workspace.slug,
                    project_id=str(project.id),
                    cycle_id=str(source_cycle.id),
                    new_cycle_id=str(destination.id),
                    request=request,
                    user_id=str(create_user.id),
                )
            except Exception as exc:  # pragma: no cover - surfaced via `errors`
                errors.append(exc)
            finally:
                connections.close_all()

        # Both mocks are entered once, in the main thread, around both
        # worker threads - patching the same attribute from two threads
        # independently is itself racy (whichever thread's context manager
        # exits first restores the target, possibly while the other thread
        # is still mid-call).
        with (
            mock.patch(
                "plane.utils.cycle_transfer_issues.CycleIssue.objects.bulk_update",
                side_effect=delayed_bulk_update,
            ),
            mock.patch("plane.utils.cycle_transfer_issues.issue_activity.delay"),
        ):
            thread_a = threading.Thread(target=run_transfer, args=("transfer-A", destination_cycle))
            thread_a.start()
            assert a_holds_lock.wait(timeout=5), "thread A never reached the row lock"

            thread_b = threading.Thread(target=run_transfer, args=("transfer-B", second_destination_cycle))
            thread_b.start()

            thread_a.join(timeout=15)
            thread_b.join(timeout=15)

        assert not thread_a.is_alive(), "thread A did not finish"
        assert not thread_b.is_alive(), "thread B did not finish"
        assert not errors, f"transfer_cycle_issues raised: {errors!r}"

        source_cycle.refresh_from_db()

        actual_remaining = CycleIssue.objects.filter(
            cycle_id=source_cycle.id,
            issue__archived_at__isnull=True,
            issue__is_draft=False,
            issue__state__group__in=["backlog", "unstarted", "started"],
        ).count()

        # The single issue can only be claimed by whichever transfer wins
        # the race for the row lock; the other legitimately moves nothing.
        # But whatever ends up persisted as the source cycle's
        # progress_snapshot must match reality, not data read before the
        # winning transfer moved the issue out.
        assert actual_remaining == 0
        assert source_cycle.progress_snapshot["backlog_issues"] == actual_remaining
        assert source_cycle.progress_snapshot["total_issues"] == actual_remaining
