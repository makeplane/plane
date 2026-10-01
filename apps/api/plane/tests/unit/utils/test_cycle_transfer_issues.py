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
import uuid
from unittest import mock

import pytest
from django.db import connection, connections
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

    def test_missing_destination_cycle_returns_error_and_changes_nothing(
        self,
        project,
        source_cycle,
        incomplete_cycle_issue,
        create_user,
        dummy_request,
    ):
        """A destination cycle id that does not exist in the project must
        yield an error dict, not an AttributeError from dereferencing None."""
        with mock.patch("plane.utils.cycle_transfer_issues.issue_activity.delay") as mock_activity:
            result = transfer_cycle_issues(
                slug=project.workspace.slug,
                project_id=str(project.id),
                cycle_id=str(source_cycle.id),
                new_cycle_id=str(uuid.uuid4()),
                request=dummy_request,
                user_id=str(create_user.id),
            )

        assert result == {"success": False, "error": "Destination cycle not found"}

        source_cycle.refresh_from_db()
        incomplete_cycle_issue.refresh_from_db()

        assert source_cycle.progress_snapshot == {}
        assert incomplete_cycle_issue.cycle_id == source_cycle.id
        mock_activity.assert_not_called()


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
class TestTransferCycleIssuesConcurrency:
    """Regression test for the race CodeRabbit flagged on PR #9684.

    transfer_cycle_issues used to lock the source cycle (select_for_update)
    only around the final writes, after already reading the cycle's issue
    counts. Two concurrent transfers of the SAME source cycle could both read
    those counts before either had moved anything. The first to commit would
    save an accurate snapshot; the second would then acquire the lock,
    overwrite that snapshot with counts read before the first transfer's move
    (now stale), and move zero issues, while still returning
    {"success": True}. The fix locks the source cycle first, before any of the
    counting queries, so the second transfer waits for the first and reads
    fresh data.

    The schedule is forced with events instead of sleeps. Each worker pauses
    right after its first counting query (the snapshot read) at a hook installed
    through connection.execute_wrapper, and the main thread then:

    1. starts B while A is paused after its read,
    2. waits until B either blocks on the row lock (fixed code) or also
       completes its read (broken code, where both reads are now stale),
    3. lets A commit, then lets B continue.
    """

    WAIT_TIMEOUT = 15

    @staticmethod
    def _transfer_is_waiting_on_row_lock() -> bool:
        """True if some other backend is blocked waiting for a row lock taken
        by a `SELECT ... FOR UPDATE` (i.e. thread B is queued behind A)."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT count(*)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
                  AND wait_event_type = 'Lock'
                  AND query ILIKE '%%FOR UPDATE%%'
                """
            )
            return cursor.fetchone()[0] > 0

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

        read_done = {"A": threading.Event(), "B": threading.Event()}
        proceed = {"A": threading.Event(), "B": threading.Event()}
        errors = []

        def make_hook(name):
            hooked = False

            def hook(execute, sql, params, many, context):
                nonlocal hooked
                result = execute(sql, params, many, context)
                # The first COUNT query is the snapshot read of the source
                # cycle's issue counts. Pause the thread straight after it.
                if not hooked and "COUNT(" in sql.upper():
                    hooked = True
                    read_done[name].set()
                    if not proceed[name].wait(timeout=self.WAIT_TIMEOUT):
                        raise TimeoutError(f"thread {name} was never released")
                return result

            return hook

        def run_transfer(name, destination):
            request = HttpRequest()
            request.META["HTTP_HOST"] = "app.plane.so"
            try:
                with connection.execute_wrapper(make_hook(name)):
                    transfer_cycle_issues(
                        slug=project.workspace.slug,
                        project_id=str(project.id),
                        cycle_id=str(source_cycle.id),
                        new_cycle_id=str(destination.id),
                        request=request,
                        user_id=str(create_user.id),
                    )
            except Exception as exc:  # surfaced via `errors`
                errors.append(exc)
            finally:
                connections.close_all()

        # daemon threads: a deadlock must fail the test, not hang the run.
        thread_a = threading.Thread(target=run_transfer, args=("A", destination_cycle), daemon=True)
        thread_b = threading.Thread(target=run_transfer, args=("B", second_destination_cycle), daemon=True)

        b_blocked_on_lock = False
        try:
            with mock.patch("plane.utils.cycle_transfer_issues.issue_activity.delay"):
                thread_a.start()
                assert read_done["A"].wait(self.WAIT_TIMEOUT), "thread A never read the snapshot counts"

                # A has read the counts and is paused before writing anything.
                # With the lock taken up front, A holds it here and B queues
                # behind it. Without it, B runs on and reads the same stale
                # counts.
                thread_b.start()
                deadline = time.monotonic() + self.WAIT_TIMEOUT
                while time.monotonic() < deadline:
                    if read_done["B"].is_set():
                        break
                    if self._transfer_is_waiting_on_row_lock():
                        b_blocked_on_lock = True
                        break
                    time.sleep(0.01)
                else:
                    pytest.fail("thread B neither blocked on the row lock nor read the counts")

                if b_blocked_on_lock:
                    assert not read_done["B"].is_set(), "thread B read the counts while A held the lock"

                # Let A commit first, then B.
                proceed["A"].set()
                thread_a.join(self.WAIT_TIMEOUT)
                assert not thread_a.is_alive(), "thread A did not finish"

                proceed["B"].set()
                thread_b.join(self.WAIT_TIMEOUT)
                assert not thread_b.is_alive(), "thread B did not finish"
        finally:
            # Never leave a worker parked on an event if an assertion fired.
            proceed["A"].set()
            proceed["B"].set()

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
        # progress_snapshot must match reality, not counts read before the
        # winning transfer moved the issue out.
        assert actual_remaining == 0
        assert source_cycle.progress_snapshot["backlog_issues"] == actual_remaining
        assert source_cycle.progress_snapshot["total_issues"] == actual_remaining
        # B must have been serialized behind A by the source-cycle row lock.
        assert b_blocked_on_lock, "thread B was not blocked by the source cycle row lock"
