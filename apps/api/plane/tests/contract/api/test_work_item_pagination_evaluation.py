# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Real request-stack checks: counting must not hydrate the whole issue set.

API-key requests exercise the authenticator. The existing session_client
fixture force-authenticates; it exercises routing/permissions, not login.
Only the asynchronous recent-visit dispatch is mocked, not the ORM.
"""

from unittest import mock
from uuid import uuid4

import pytest
import requests
from django.utils import timezone

from plane.db.models import Issue, Project, ProjectMember, State, User, Workspace, WorkspaceMember

pytestmark = [pytest.mark.contract, pytest.mark.django_db(databases="__all__")]


@pytest.fixture
def pagination_project(workspace, create_user):
    project = Project.objects.create(
        workspace=workspace, name="Pagination", identifier="PG", network=0, guest_view_all_features=False
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(workspace=workspace, project=project, name="Todo", group="backlog", default=True)
    return project, state


@pytest.fixture
def pagination_issues(workspace, create_user, pagination_project):
    project, state = pagination_project
    rows = []
    for index in range(9):
        issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            state=state,
            name=f"Visible {index:02}",
            priority="high" if index % 2 == 0 else "low",
            description_html="<p>" + "large description " * 128 + "</p>",
        )
        Issue.objects.filter(pk=issue.pk).update(created_by_id=create_user.pk)
        rows.append(issue)
    return rows


def list_url(surface, workspace, project):
    prefix = "/api/v1" if surface == "public" else "/api"
    return f"{prefix}/workspaces/{workspace.slug}/projects/{project.pk}/issues/"


def fetch_page(client, url, params):
    # Dispatch remains outside the database work being measured. The full
    # repository test stack still supplies its normal Redis/broker services.
    with mock.patch("plane.app.views.issue.base.recent_visited_task.delay"):
        response = client.get(url, params)
        body = response.json()
    assert response.status_code == 200, body
    return body


@pytest.mark.parametrize("surface", ["public", "app"])
@pytest.mark.parametrize("page_number", [0, 1, 2, 3])
def test_http_page_hydration_is_bounded_by_returned_items(
    surface, page_number, workspace, pagination_project, pagination_issues, api_key_client, session_client
):
    project, _ = pagination_project
    client = api_key_client if surface == "public" else session_client
    params = {"per_page": 4, "cursor": f"4:{page_number}:0", "order_by": "sequence_id"}
    if surface == "public":
        params["fields"] = "id,name"
    url = list_url(surface, workspace, project)
    fetch_page(client, url, params)
    with mock.patch.object(Issue, "from_db", wraps=Issue.from_db) as hydrate:
        body = fetch_page(client, url, params)
    expected = pagination_issues[page_number * 4 : page_number * 4 + 4]
    assert [str(row["id"]) for row in body["results"]] == [str(issue.pk) for issue in expected]
    assert body["total_count"] == body["total_results"] == 9
    assert body["count"] == len(expected)
    assert body["next_page_results"] is (9 > page_number * 4 + 4)
    assert body["prev_page_results"] is (page_number > 0)
    # Public serializer consumes only the page; the app callback uses values().
    assert hydrate.call_count == (len(expected) if surface == "public" else 0)


@pytest.mark.parametrize("surface", ["public", "app"])
def test_http_cursor_round_trip_preserves_order_and_count(
    surface, workspace, pagination_project, pagination_issues, api_key_client, session_client
):
    project, _ = pagination_project
    client = api_key_client if surface == "public" else session_client
    url = list_url(surface, workspace, project)
    params = {"per_page": 4, "order_by": "sequence_id"}
    first = fetch_page(client, url, params)
    second = fetch_page(client, url, {**params, "cursor": first["next_cursor"]})
    previous = fetch_page(client, url, {**params, "cursor": second["prev_cursor"]})
    assert [row["id"] for row in previous["results"]] == [row["id"] for row in first["results"]]
    assert {row["id"] for row in first["results"]}.isdisjoint(row["id"] for row in second["results"])
    assert first["count"] == second["count"] == previous["count"] == 4


@pytest.mark.parametrize("surface", ["public", "app"])
def test_hidden_model_states_and_other_workspace_do_not_enter_totals(
    surface, workspace, pagination_project, pagination_issues, create_user, api_key_client, session_client
):
    project, state = pagination_project
    for attrs in ({"is_draft": True}, {"archived_at": timezone.now().date()}, {"deleted_at": timezone.now()}):
        issue = Issue.objects.create(workspace=workspace, project=project, state=state, name="Hidden")
        Issue.objects.filter(pk=issue.pk).update(**attrs)
    triage = State.objects.create(workspace=workspace, project=project, name="Triage", group="triage", is_triage=True)
    Issue.objects.create(workspace=workspace, project=project, state=triage, name="Hidden triage")
    sibling = Project.objects.create(workspace=workspace, name="Sibling private", identifier="SB", network=0)
    Issue.objects.create(workspace=workspace, project=sibling, name="Sibling private issue")
    other = Workspace.objects.create(name="Foreign", slug=f"foreign-{uuid4().hex}", owner=create_user)
    foreign_project = Project.objects.create(workspace=other, name="Foreign", identifier="FG")
    Issue.objects.create(workspace=other, project=foreign_project, name="Foreign private issue")
    client = api_key_client if surface == "public" else session_client
    body = fetch_page(client, list_url(surface, workspace, project), {"per_page": 4, "order_by": "sequence_id"})
    assert body["total_count"] == body["total_results"] == 9
    assert body["count"] == 4
    assert all(row["name"].startswith("Visible ") for row in body["results"])


def test_app_legacy_filter_applies_to_rows_and_count(workspace, pagination_project, pagination_issues, session_client):
    project, _ = pagination_project
    body = fetch_page(
        session_client,
        list_url("app", workspace, project),
        {"per_page": 4, "priority": "high", "order_by": "sequence_id"},
    )
    assert body["total_count"] == 5
    assert body["count"] == 4
    assert all(row["priority"] == "high" for row in body["results"])


def test_app_restricted_guest_total_contains_only_their_work_items(
    workspace, pagination_project, pagination_issues, session_client
):
    project, state = pagination_project
    token = uuid4().hex
    guest = User.objects.create(email=f"guest-{token}@example.test", username=f"guest-{token}")
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
    ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)
    own = Issue.objects.create(workspace=workspace, project=project, state=state, name="Guest owned")
    Issue.objects.filter(pk=own.pk).update(created_by_id=guest.pk)
    session_client.force_authenticate(user=guest)
    body = fetch_page(session_client, list_url("app", workspace, project), {"per_page": 4})
    assert body["total_count"] == body["count"] == 1
    assert [str(row["id"]) for row in body["results"]] == [str(own.pk)]


def test_app_nonmember_cannot_read_project_or_total(workspace, pagination_project, pagination_issues, session_client):
    project, _ = pagination_project
    token = uuid4().hex
    outsider = User.objects.create(email=f"outsider-{token}@example.test", username=f"outsider-{token}")
    session_client.force_authenticate(user=outsider)
    with mock.patch("plane.app.views.issue.base.recent_visited_task.delay"):
        response = session_client.get(list_url("app", workspace, project), {"per_page": 4})
    assert response.status_code in (403, 404)
    assert "total_count" not in response.json()


@pytest.mark.parametrize("subgroup", [False, True])
def test_app_grouped_metadata_counts_rows_not_group_containers(
    subgroup, workspace, pagination_project, pagination_issues, session_client
):
    project, _ = pagination_project
    params = {"per_page": 2, "group_by": "priority", "order_by": "sequence_id"}
    if subgroup:
        params["sub_group_by"] = "state_id"
    body = fetch_page(session_client, list_url("app", workspace, project), params)
    rows = []
    for group in body["results"].values():
        if subgroup:
            for nested in group["results"].values():
                rows.extend(nested["results"])
        else:
            rows.extend(group["results"])
    assert body["total_count"] == 9
    assert body["count"] == len(rows) == 4
    assert len({row["id"] for row in rows}) == 4


@pytest.mark.parametrize("surface", ["public", "app"])
def test_empty_project_returns_zero_metadata(surface, workspace, pagination_project, api_key_client, session_client):
    project, _ = pagination_project
    client = api_key_client if surface == "public" else session_client
    body = fetch_page(client, list_url(surface, workspace, project), {"per_page": 4})
    assert body["results"] == []
    assert body["count"] == body["total_count"] == body["total_pages"] == 0
    assert body["next_page_results"] is False


def test_public_nonmember_token_does_not_expose_project_total(
    workspace, pagination_project, pagination_issues, api_client
):
    from plane.db.models.api import APIToken

    project, _ = pagination_project
    token = uuid4().hex
    outsider = User.objects.create(email=f"token-outsider-{token}@example.test", username=f"out-{token}")
    api_token = APIToken.objects.create(user=outsider, label="Pagination outsider", token=uuid4().hex)
    api_client.credentials(HTTP_X_API_KEY=api_token.token)
    response = api_client.get(list_url("public", workspace, project), {"per_page": 4})
    assert response.status_code in (403, 404)
    assert "total_count" not in response.json()


@pytest.mark.django_db(transaction=True, databases="__all__")
def test_public_work_item_page_over_real_tcp(plane_server, api_token, workspace, pagination_project, pagination_issues):
    """Socket smoke test; not a latency benchmark or a production deployment."""
    project, _ = pagination_project
    response = requests.get(
        plane_server.url + list_url("public", workspace, project),
        headers={"X-API-Key": api_token.token},
        params={"per_page": 4, "fields": "id,name", "order_by": "sequence_id"},
        timeout=10,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total_count"] == body["total_results"] == 9
    assert body["count"] == 4
    assert body["next_page_results"] is True
    assert [row["name"] for row in body["results"]] == [f"Visible {index:02}" for index in range(4)]
