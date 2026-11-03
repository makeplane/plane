# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Concurrent API writes by distinct members must preserve the dependency graph."""

from datetime import date
from threading import Barrier, Event, Thread
from time import monotonic
from traceback import format_exc
from unittest.mock import patch

import pytest
from django.db import close_old_connections, connection
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State, User, WorkspaceMember


pytestmark = [pytest.mark.contract, pytest.mark.django_db(transaction=True)]


@pytest.fixture(autouse=True)
def background_tasks():
    # All three issue views import the same Celery task object.
    with (
        patch("plane.app.views.issue.relation.issue_activity.delay"),
        patch("plane.db.mixins.soft_delete_related_objects.delay"),
    ):
        yield


@pytest.fixture
def members(workspace, create_user):
    if connection.vendor != "postgresql":
        pytest.skip("Requires PostgreSQL row locks and independent transactions")
    other = User.objects.create(email="gantt-concurrent@plane.so", username="gantt-concurrent", first_name="Concurrent")
    WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(role=15)
    WorkspaceMember.objects.create(workspace=workspace, member=other, role=15)
    return create_user, other


def _project(workspace, members, identifier):
    project = Project.objects.create(
        name=identifier, identifier=identifier, workspace=workspace, created_by=members[0]
    )
    for member in members:
        ProjectMember.objects.create(
            project=project, workspace=workspace, member=member, role=15, is_active=True
        )
    State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    return project


def _issue(project, name, start, end):
    return Issue.objects.create(
        name=name,
        project=project,
        workspace=project.workspace,
        start_date=date(2026, 11, start),
        target_date=date(2026, 11, end),
    )


def _link(predecessor, successor):
    IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=successor.project,
        workspace=successor.workspace,
    )


def _chain(project):
    a = _issue(project, "A", 15, 17)
    b = _issue(project, "B", 18, 20)
    c = _issue(project, "C", 21, 23)
    _link(a, b)
    _link(b, c)
    return a, b, c


def _schedule_url(project, scope):
    prefix = f"/api/workspaces/{project.workspace.slug}/"
    return prefix + (f"projects/{project.id}/" if scope == "project" else "") + "issue-schedule/"


def _move(issue, start, end):
    return {
        "change": {
            "id": str(issue.id),
            "start_date": f"2026-11-{start:02d}",
            "target_date": f"2026-11-{end:02d}",
        },
        "include_successors": True,
        "pull_earlier": True,
    }


def _dates(*issues):
    result = []
    for issue in issues:
        issue.refresh_from_db()
        result.append((issue.start_date, issue.target_date))
    return result


def _run_concurrently(members, *operations):
    barrier = Barrier(2, timeout=10)
    results = [None, None]
    errors = [None, None]

    def worker(index):
        close_old_connections()
        original_settings = connection.settings_dict
        try:
            # Connection options also apply if the API client reconnects between requests.
            options = original_settings.get("OPTIONS", {}).copy()
            options["options"] = (
                options.get("options", "") + " -c statement_timeout=10000 -c lock_timeout=10000"
            )
            connection.settings_dict = {**original_settings, "OPTIONS": options}
            client = APIClient()
            client.force_authenticate(user=User.objects.get(pk=members[index].pk))
            barrier.wait()
            results[index] = operations[index](client)
        except Exception:
            errors[index] = format_exc()
        finally:
            connection.close()
            connection.settings_dict = original_settings

    threads = [Thread(target=worker, args=(index,), daemon=True) for index in range(2)]
    deadline = monotonic() + 30
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=max(0, deadline - monotonic()))
    assert not any(thread.is_alive() for thread in threads), "Concurrent API requests exceeded 30 seconds"
    assert errors == [None, None], "\n".join(error for error in errors if error)
    return results


@pytest.mark.parametrize("scope", ["project", "workspace"])
def test_two_users_move_same_predecessor_concurrently(workspace, members, scope):
    project = _project(workspace, members, "CHAIN")
    a, b, c = _chain(project)
    url = _schedule_url(project, scope)
    moves = [_move(a, 1, 3), _move(a, 8, 10)]

    responses = _run_concurrently(
        members,
        lambda client: client.post(url, moves[0], format="json"),
        lambda client: client.post(url, moves[1], format="json"),
    )

    assert all(response.status_code in (200, 409) for response in responses)
    assert any(response.status_code == 200 for response in responses)
    final = _dates(a, b, c)
    assert final[1][0] > final[0][1]
    assert final[2][0] > final[1][1]
    outcomes = [
        [
            (date(2026, 11, 1), date(2026, 11, 3)),
            (date(2026, 11, 4), date(2026, 11, 6)),
            (date(2026, 11, 7), date(2026, 11, 9)),
        ],
        [
            (date(2026, 11, 8), date(2026, 11, 10)),
            (date(2026, 11, 11), date(2026, 11, 13)),
            (date(2026, 11, 14), date(2026, 11, 16)),
        ],
    ]
    assert final in [outcomes[index] for index, response in enumerate(responses) if response.status_code == 200]


@pytest.mark.parametrize("scope", ["project", "workspace"])
def test_stale_expected_is_409_after_concurrent_write(workspace, members, scope):
    project = _project(workspace, members, "STALE")
    a, b, c = _chain(project)
    url = _schedule_url(project, scope)
    body = {**_move(a, 20, 22), "pull_earlier": False}
    preview_ready, written = Event(), Event()
    committed = {}

    def preview_then_apply(client):
        before = _dates(a, b, c)
        preview = client.post(url, {**body, "dry_run": True}, format="json")
        assert preview.status_code == 200
        assert _dates(a, b, c) == before
        updates = preview.json()["updates"]
        assert {item["id"] for item in updates} == {str(b.id), str(c.id)}
        expected = [
            {"id": item["id"], "start_date": item["new_start"], "target_date": item["new_end"]}
            for item in updates
        ]
        preview_ready.set()
        assert written.wait(timeout=10), "Second user did not commit after the preview"
        return client.post(url, {**body, "expected": expected}, format="json")

    def write_between_preview_and_apply(client):
        assert preview_ready.wait(timeout=10), "First user did not finish the preview"
        response = client.post(url, {**_move(b, 25, 27), "pull_earlier": False}, format="json")
        assert response.status_code == 200
        committed["dates"] = _dates(a, b, c)
        written.set()
        return response

    stale, applied = _run_concurrently(members, preview_then_apply, write_between_preview_and_apply)

    assert applied.status_code == 200
    assert stale.status_code == 409
    assert stale.json()["message"] == "Schedule changed"
    assert _dates(a, b, c) == committed["dates"] == [
        (date(2026, 11, 15), date(2026, 11, 17)),
        (date(2026, 11, 25), date(2026, 11, 27)),
        (date(2026, 11, 28), date(2026, 11, 30)),
    ]


@pytest.mark.parametrize("scope", ["project", "workspace"])
def test_retry_with_conflict_preview_applies_after_409(workspace, members, scope):
    project = _project(workspace, members, "RETRY")
    a, b, c = _chain(project)
    url = _schedule_url(project, scope)
    body = {**_move(a, 20, 22), "pull_earlier": False}
    first, second = APIClient(), APIClient()
    first.force_authenticate(user=members[0])
    second.force_authenticate(user=members[1])

    def expected_of(updates):
        return [{"id": u["id"], "start_date": u["new_start"], "target_date": u["new_end"]} for u in updates]

    preview = first.post(url, {**body, "dry_run": True}, format="json").json()
    assert second.post(url, {**_move(b, 25, 27), "pull_earlier": False}, format="json").status_code == 200

    stale = first.post(url, {**body, "expected": expected_of(preview["updates"])}, format="json")
    assert stale.status_code == 409
    assert _dates(a, b, c)[0] == (date(2026, 11, 15), date(2026, 11, 17))  # nothing applied by the stale save

    # The web app shows the 409 body as the new preview; confirming it must now succeed.
    retry = first.post(url, {**body, "expected": expected_of(stale.json()["updates"])}, format="json")
    assert retry.status_code == 200
    assert _dates(a)[0] == (date(2026, 11, 20), date(2026, 11, 22))


def test_opposite_cross_project_links_do_not_deadlock(workspace, members):
    p = _project(workspace, members, "CROSSP")
    q = _project(workspace, members, "CROSSQ")
    a1, b1 = _issue(p, "A1", 15, 17), _issue(q, "B1", 18, 20)
    a2, b2 = _issue(q, "A2", 15, 17), _issue(p, "B2", 18, 20)
    _link(a1, b1)
    _link(a2, b2)
    url = _schedule_url(p, "workspace")

    responses = _run_concurrently(
        members,
        lambda client: client.post(url, _move(a1, 1, 3), format="json"),
        lambda client: client.post(url, _move(a2, 8, 10), format="json"),
    )

    assert [response.status_code for response in responses] == [200, 200]
    assert _dates(a1, b1, a2, b2) == [
        (date(2026, 11, 1), date(2026, 11, 3)),
        (date(2026, 11, 4), date(2026, 11, 6)),
        (date(2026, 11, 8), date(2026, 11, 10)),
        (date(2026, 11, 11), date(2026, 11, 13)),
    ]


def test_concurrent_cycle_creation_is_rejected(workspace, members):
    project = _project(workspace, members, "CYCLE")
    x, y = _issue(project, "X", 1, 3), _issue(project, "Y", 4, 6)
    prefix = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"

    responses = _run_concurrently(
        members,
        lambda client: client.post(
            f"{prefix}{x.id}/issue-relation/",
            {"relation_type": "blocked_by", "issues": [str(y.id)]},
            format="json",
        ),
        lambda client: client.post(
            f"{prefix}{y.id}/issue-relation/",
            {"relation_type": "blocked_by", "issues": [str(x.id)]},
            format="json",
        ),
    )

    assert sorted(response.status_code for response in responses) == [201, 400]
    rejected = next(response for response in responses if response.status_code == 400)
    assert rejected.json()["message"] == "Circular dependency"
    assert set(rejected.json()["cycle"]) == {str(x.id), str(y.id)}
    relations = list(
        IssueRelation.objects.filter(workspace=workspace).values_list(
            "issue_id", "related_issue_id", "relation_type"
        )
    )
    source, target = (x, y) if responses[0].status_code == 201 else (y, x)
    assert relations == [(source.id, target.id, "blocked_by")]
