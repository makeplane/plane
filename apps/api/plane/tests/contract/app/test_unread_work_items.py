# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Liviere/plane fork: "New" work items (plane/liviere/unread) – created by somebody else and not opened yet.

from datetime import timedelta
from uuid import uuid4

import pytest
from crum import impersonate
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, State, User, WorkspaceMember
from plane.db.models.api import APIToken
from plane.liviere.models import UnreadProjectCutoff, UnreadWorkspaceCutoff, WorkItemOpen

ADMIN, MEMBER, GUEST = 20, 15, 5


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{unique_id}@plane.so", username=f"{prefix}_{unique_id}")


def _join(project, user, role=MEMBER):
    WorkspaceMember.objects.get_or_create(workspace=project.workspace, member=user, defaults={"role": role})
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _project(workspace, owner, identifier, name=None):
    project = Project.objects.create(
        name=name or f"Project {identifier}", identifier=identifier, workspace=workspace, created_by=owner
    )
    ProjectMember.objects.create(project=project, member=owner, role=ADMIN, is_active=True)
    State.objects.create(name="Todo", group="unstarted", color="#000000", project=project, workspace=workspace)
    return project


def _issue(project, author, name="Work item", **kwargs):
    with impersonate(author):
        return Issue.objects.create(project=project, workspace=project.workspace, name=name, **kwargs)


def _session(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _key_client(user):
    token = APIToken.objects.create(user=user, label="unread", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _url(workspace, path=""):
    return f"/api/workspaces/{workspace.slug}/liviere/new-work-items/{path}"


def _opened_url(issue):
    return f"/api/workspaces/{issue.workspace.slug}/projects/{issue.project_id}/liviere/work-items/{issue.id}/opened/"


def _new_ids(client, workspace, **params):
    response = client.get(_url(workspace), params)
    assert response.status_code == status.HTTP_200_OK, response.data
    return [item["id"] for item in response.data["results"]]


def _count(client, workspace, **params):
    response = client.get(_url(workspace, "count/"), params)
    assert response.status_code == status.HTTP_200_OK, response.data
    return response.data


@pytest.fixture
def me(db, workspace, create_user):
    return create_user


@pytest.fixture
def agent(db):
    return _make_user("agent")


@pytest.fixture
def project(db, workspace, me, agent):
    project = _project(workspace, me, "NW")
    _join(project, agent)
    return project


@pytest.mark.contract
class TestNewWorkItems:
    def test_work_item_of_somebody_else_is_new_and_own_is_not(self, workspace, project, me, agent):
        theirs = _issue(project, agent, "Theirs")
        _issue(project, me, "Mine")

        client = _session(me)
        assert _new_ids(client, workspace) == [str(theirs.id)]
        item = client.get(_url(workspace)).data["results"][0]
        assert item["project"] == {"id": str(project.id), "identifier": "NW", "name": project.name}
        assert item["sequence_id"] == theirs.sequence_id
        assert item["created_by"]["id"] == str(agent.id)
        assert item["state"]["group"] == "unstarted"
        # The agent sees my work item as new, not its own
        assert _new_ids(_session(agent), workspace) != [str(theirs.id)]

    def test_work_item_created_with_an_api_key_is_new(self, workspace, project, me, agent):
        response = _key_client(agent).post(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/",
            {"name": "From an agent"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert _new_ids(_session(me), workspace) == [str(response.data["id"])]

    def test_work_item_without_an_author_is_new(self, workspace, project, me):
        issue = Issue.objects.create(project=project, workspace=workspace, name="System")
        assert issue.created_by_id is None
        assert _new_ids(_session(me), workspace) == [str(issue.id)]

    def test_opening_clears_it_and_is_idempotent(self, workspace, project, me, agent):
        other = _join(project, _make_user("other"))
        issue = _issue(project, agent)
        client = _session(me)

        assert client.post(_opened_url(issue)).status_code == status.HTTP_204_NO_CONTENT
        assert client.post(_opened_url(issue)).status_code == status.HTTP_204_NO_CONTENT
        assert WorkItemOpen.objects.filter(user=me, issue=issue).count() == 1
        assert _new_ids(client, workspace) == []
        # Opened by me only – still new for another member
        assert _new_ids(_session(other), workspace) == [str(issue.id)]

    def test_reading_with_an_api_key_does_not_clear_it(self, workspace, project, me, agent):
        issue = _issue(project, agent)
        detail = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"

        # Not with somebody else's key, not even with my own key
        for client in (_key_client(agent), _key_client(me)):
            assert client.get(detail).status_code == status.HTTP_200_OK
        assert _new_ids(_session(me), workspace) == [str(issue.id)]
        assert WorkItemOpen.objects.count() == 0

    def test_opened_endpoint_needs_a_session(self, workspace, project, me, agent):
        issue = _issue(project, agent)
        assert _key_client(me).post(_opened_url(issue)).status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
        assert WorkItemOpen.objects.count() == 0

    def test_workspace_cutoff_hides_work_items_from_before_the_deployment(self, workspace, project, me, agent):
        old = _issue(project, agent, "Before")
        Issue.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=2))
        ProjectMember.objects.filter(project=project, member=me).update(created_at=timezone.now() - timedelta(days=30))
        UnreadWorkspaceCutoff.objects.create(workspace=workspace, since=timezone.now() - timedelta(days=1))
        recent = _issue(project, agent, "After")

        assert _new_ids(_session(me), workspace) == [str(recent.id)]

    def test_work_items_from_before_joining_the_project_are_not_new(self, workspace, project, me, agent):
        before_joining = _issue(project, me, "Before joining")
        Issue.objects.filter(pk=before_joining.pk).update(created_at=timezone.now() - timedelta(hours=2))
        newcomer = _join(project, _make_user("newcomer"))
        after_joining = _issue(project, me, "After joining")

        assert _new_ids(_session(newcomer), workspace) == [str(after_joining.id)]

    def test_restricted_guest_has_nothing_new_and_cannot_open_others(self, workspace, project, me, agent):
        guest = _join(project, _make_user("guest"), role=GUEST)
        theirs = _issue(project, agent)
        own = _issue(project, guest, "Guest's own")
        client = _session(guest)

        assert _new_ids(client, workspace) == []
        assert _count(client, workspace)["total"] == 0
        assert client.post(_opened_url(theirs)).status_code == status.HTTP_404_NOT_FOUND
        assert client.post(_opened_url(own)).status_code == status.HTTP_204_NO_CONTENT
        assert WorkItemOpen.objects.filter(user=guest).count() == 1

    def test_guest_sees_others_with_guest_view_all_features(self, workspace, project, me, agent):
        guest = _join(project, _make_user("guest"), role=GUEST)
        Project.objects.filter(pk=project.pk).update(guest_view_all_features=True)
        theirs = _issue(project, agent)
        client = _session(guest)

        assert str(theirs.id) in _new_ids(client, workspace)
        assert client.post(_opened_url(theirs)).status_code == status.HTTP_204_NO_CONTENT

    def test_projects_without_membership_do_not_count(self, workspace, project, me, agent):
        foreign = _project(workspace, agent, "FX")
        issue = _issue(foreign, agent)
        client = _session(me)

        assert _new_ids(client, workspace) == []
        assert client.post(_opened_url(issue)).status_code == status.HTTP_403_FORBIDDEN

    def test_inactive_membership_does_not_count(self, workspace, project, me, agent):
        _issue(project, agent)
        ProjectMember.objects.filter(project=project, member=me).update(is_active=False)
        assert _new_ids(_session(me), workspace) == []

    def test_drafts_triage_archived_and_deleted_do_not_count(self, workspace, project, me, agent):
        triage = State.objects.create(
            name="Triage", group="triage", is_triage=True, color="#000", project=project, workspace=workspace
        )
        _issue(project, agent, "Draft", is_draft=True)
        _issue(project, agent, "Triage", state=triage)
        _issue(project, agent, "Archived", archived_at=timezone.now())
        deleted = _issue(project, agent, "Deleted")
        deleted.delete()
        visible = _issue(project, agent, "Visible")

        assert _new_ids(_session(me), workspace) == [str(visible.id)]

    def test_count_filter_and_pagination(self, workspace, project, me, agent):
        second = _project(workspace, me, "SE")
        _join(second, agent)
        first_items = [_issue(project, agent, f"First {n}") for n in range(3)]
        second_item = _issue(second, agent, "Second")
        client = _session(me)

        counts = _count(client, workspace)
        assert counts["total"] == 4
        assert counts["by_project"] == {str(project.id): 3, str(second.id): 1}
        assert counts["as_of"]
        assert _count(client, workspace, projects=str(second.id))["total"] == 1

        assert _new_ids(client, workspace, projects=str(second.id)) == [str(second_item.id)]
        # Newest first, two per page; the next page starts below the last created_at
        page = client.get(_url(workspace), {"per_page": 2}).data
        assert [item["id"] for item in page["results"]] == [str(second_item.id), str(first_items[2].id)]
        assert page["has_more"] is True
        assert page["as_of"]
        # Opening an item of the first page does not shift the next one
        client.post(_opened_url(first_items[2]))
        older_than = page["results"][-1]["created_at"]
        next_page = client.get(_url(workspace), {"per_page": 2, "older_than": older_than}).data
        assert [item["id"] for item in next_page["results"]] == [str(first_items[1].id), str(first_items[0].id)]
        assert next_page["has_more"] is False

        for params in ({"projects": "not-a-uuid"}, {"per_page": "0"}, {"older_than": "yesterday"}):
            assert client.get(_url(workspace), params).status_code == status.HTTP_400_BAD_REQUEST

    def test_mark_all_as_read(self, workspace, project, me, agent):
        second = _project(workspace, me, "SE")
        _join(second, agent)
        _issue(project, agent)
        kept = _issue(second, agent)
        client = _session(me)

        as_of = _count(client, workspace)["as_of"]
        later = _issue(project, agent, "After as_of")

        response = client.post(
            _url(workspace, "mark-read/"), {"project_ids": [str(project.id)], "before": as_of}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["cleared"] == 1
        assert sorted(_new_ids(client, workspace)) == sorted([str(kept.id), str(later.id)])

        as_of = _count(client, workspace)["as_of"]
        response = client.post(_url(workspace, "mark-read/"), {"before": as_of}, format="json")
        assert response.data["cleared"] == 2
        assert _new_ids(client, workspace) == []
        assert UnreadProjectCutoff.objects.filter(user=me).count() == 2
        assert WorkItemOpen.objects.count() == 0

    def test_mark_all_as_read_never_moves_the_cutoff_back(self, workspace, project, me, agent):
        client = _session(me)
        first = _count(client, workspace)["as_of"]
        second = _count(client, workspace)["as_of"]
        client.post(_url(workspace, "mark-read/"), {"before": second}, format="json")
        client.post(_url(workspace, "mark-read/"), {"before": first}, format="json")
        assert UnreadProjectCutoff.objects.get(user=me, project=project).since.isoformat() == second

    @pytest.mark.parametrize(
        "before",
        [None, "", "yesterday", "2026-01-01T10:00:00", (timezone.now() + timedelta(hours=1)).isoformat()],
    )
    def test_mark_all_as_read_rejects_a_missing_or_future_before(self, workspace, project, me, before):
        body = {} if before is None else {"before": before}
        response = _session(me).post(_url(workspace, "mark-read/"), body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert UnreadProjectCutoff.objects.count() == 0

    def test_outsiders_of_the_workspace_are_refused(self, workspace, project, agent):
        outsider = _make_user("outsider")
        client = _session(outsider)
        assert client.get(_url(workspace)).status_code == status.HTTP_403_FORBIDDEN
        assert client.get(_url(workspace, "count/")).status_code == status.HTTP_403_FORBIDDEN
