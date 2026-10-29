# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public API work item archive, unarchive, and archived list endpoints."""

import json
from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5

EXPECTED_PAGINATED_KEYS = {
    "grouped_by",
    "sub_grouped_by",
    "total_count",
    "next_cursor",
    "prev_cursor",
    "next_page_results",
    "prev_page_results",
    "count",
    "total_pages",
    "total_results",
    "extra_stats",
    "results",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.issue.issue_activity") as activity_mock,
        mock.patch("plane.api.views.issue.base_host", return_value="http://testserver"),
    ):
        yield activity_mock


def _make_user(workspace, project, ws_role, project_role):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if ws_role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    if project is not None and project_role is not None:
        ProjectMember.objects.create(
            project=project, member=user, workspace=workspace, role=project_role, is_active=True
        )
    return user


@pytest.fixture
def client_for():
    def _factory(user):
        token = APIToken.objects.create(user=user, label="t")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)
        return client

    return _factory


def _project_with_states(workspace, owner, identifier):
    project = Project.objects.create(
        name=identifier,
        identifier=identifier,
        workspace=workspace,
        created_by=owner,
        guest_view_all_features=True,
    )
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=ADMIN, is_active=True)
    states = {
        group: State.objects.create(
            name=group.capitalize(),
            project=project,
            workspace=workspace,
            group=group,
            default=(group == "backlog"),
        )
        for group in ("backlog", "unstarted", "started", "completed", "cancelled")
    }
    return project, states


@pytest.fixture
def project_and_states(workspace, create_user):
    return _project_with_states(workspace, create_user, "ARC")


@pytest.fixture
def own_project(project_and_states):
    return project_and_states[0]


@pytest.fixture
def states(project_and_states):
    return project_and_states[1]


@pytest.fixture
def sibling_completed_issue(workspace):
    colleague = User.objects.create(email=f"c-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    WorkspaceMember.objects.create(workspace=workspace, member=colleague, role=ADMIN, is_active=True)
    project, sib_states = _project_with_states(workspace, colleague, "SIB")
    issue = Issue(name="Sibling Done", project=project, workspace=workspace, state=sib_states["completed"])
    issue.save(created_by_id=colleague.id)
    return issue


@pytest.fixture
def other_tenant_completed_issue(db):
    owner = User.objects.create(email=f"o-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    project, oth_states = _project_with_states(other_ws, owner, "OTH")
    issue = Issue(name="Other Done", project=project, workspace=other_ws, state=oth_states["completed"])
    issue.save(created_by_id=owner.id)
    return issue


def _archive_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/archive/"


def _unarchive_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/unarchive/"


def _archived_list_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/archived-work-items/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemArchiveUnarchive:
    @pytest.mark.parametrize("state_group", ["completed", "cancelled"])
    def test_archive_and_unarchive_completed_or_cancelled_issue(
        self, api_key_client, workspace, own_project, states, create_user, _no_side_effects, state_group
    ):
        issue = Issue(name="Done Issue", project=own_project, workspace=workspace, state=states[state_group])
        issue.save(created_by_id=create_user.id)

        resp = api_key_client.post(_archive_url(workspace, own_project, issue), {}, format="json")
        assert resp.status_code == status.HTTP_200_OK, resp.content
        issue.refresh_from_db()
        assert issue.archived_at is not None
        assert resp.json() == {"archived_at": str(issue.archived_at)}

        archive_call = _no_side_effects.delay.call_args.kwargs
        assert archive_call["type"] == "issue.activity.updated"
        assert json.loads(archive_call["requested_data"]) == {
            "archived_at": str(issue.archived_at),
            "automation": False,
        }

        unarch_resp = api_key_client.delete(_unarchive_url(workspace, own_project, issue))
        assert unarch_resp.status_code == status.HTTP_204_NO_CONTENT
        issue.refresh_from_db()
        assert issue.archived_at is None

        unarchive_call = _no_side_effects.delay.call_args.kwargs
        assert unarchive_call["type"] == "issue.activity.updated"
        assert json.loads(unarchive_call["requested_data"]) == {"archived_at": None}

    def test_archive_and_unarchive_write_only_archived_at(
        self, api_key_client, workspace, own_project, states, create_user
    ):
        issue = Issue(name="Done Issue", project=own_project, workspace=workspace, state=states["completed"])
        issue.save(created_by_id=create_user.id)

        original_save = Issue.save
        with mock.patch.object(Issue, "save", autospec=True, side_effect=original_save) as save_mock:
            archive_resp = api_key_client.post(_archive_url(workspace, own_project, issue), {}, format="json")
            unarchive_resp = api_key_client.delete(_unarchive_url(workspace, own_project, issue))

        assert archive_resp.status_code == status.HTTP_200_OK
        assert unarchive_resp.status_code == status.HTTP_204_NO_CONTENT
        assert [call.kwargs.get("update_fields") for call in save_mock.call_args_list] == [
            ["archived_at", "updated_at"],
            ["archived_at", "updated_at"],
        ]

    def test_archive_and_unarchive_advance_updated_at(
        self, api_key_client, workspace, own_project, states, create_user
    ):
        issue = Issue(name="Done Issue", project=own_project, workspace=workspace, state=states["completed"])
        issue.save(created_by_id=create_user.id)
        seen = issue.updated_at

        assert api_key_client.post(_archive_url(workspace, own_project, issue), {}, format="json").status_code == 200
        issue.refresh_from_db()
        assert issue.updated_at > seen
        seen = issue.updated_at

        assert api_key_client.delete(_unarchive_url(workspace, own_project, issue)).status_code == 204
        issue.refresh_from_db()
        assert issue.updated_at > seen

    @pytest.mark.parametrize("state_group", ["backlog", "unstarted", "started"])
    def test_archive_rejects_non_completed_or_cancelled_state_group(
        self, api_key_client, workspace, own_project, states, create_user, state_group
    ):
        issue = Issue(name="Active Issue", project=own_project, workspace=workspace, state=states[state_group])
        issue.save(created_by_id=create_user.id)

        resp = api_key_client.post(_archive_url(workspace, own_project, issue), {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json() == {"error": "Can only archive completed or cancelled state group issue"}
        issue.refresh_from_db()
        assert issue.archived_at is None

    def test_unarchive_non_archived_issue_returns_404(
        self, api_key_client, workspace, own_project, states, create_user
    ):
        issue = Issue(name="Active Issue", project=own_project, workspace=workspace, state=states["completed"])
        issue.save(created_by_id=create_user.id)

        resp = api_key_client.delete(_unarchive_url(workspace, own_project, issue))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.parametrize("target", ["sibling_completed_issue", "other_tenant_completed_issue"])
    def test_cross_project_and_cross_workspace_archive_unarchive_returns_404(
        self, request, api_key_client, workspace, own_project, target
    ):
        foreign_issue = request.getfixturevalue(target)

        resp = api_key_client.post(_archive_url(workspace, own_project, foreign_issue), {}, format="json")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        foreign_issue.refresh_from_db()
        assert foreign_issue.archived_at is None

        foreign_issue.archived_at = timezone.now().date()
        foreign_issue.save()
        unarch_resp = api_key_client.delete(_unarchive_url(workspace, own_project, foreign_issue))
        assert unarch_resp.status_code == status.HTTP_404_NOT_FOUND
        foreign_issue.refresh_from_db()
        assert foreign_issue.archived_at is not None

    @pytest.mark.parametrize(
        "ws_role,project_role,expected_archive,expected_unarchive,expected_list",
        [
            (ADMIN, ADMIN, status.HTTP_200_OK, status.HTTP_204_NO_CONTENT, status.HTTP_200_OK),
            (MEMBER, MEMBER, status.HTTP_200_OK, status.HTTP_204_NO_CONTENT, status.HTTP_200_OK),
            (GUEST, GUEST, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN, status.HTTP_200_OK),
            (MEMBER, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
            (None, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_permission_matrix(
        self,
        client_for,
        workspace,
        own_project,
        states,
        create_user,
        ws_role,
        project_role,
        expected_archive,
        expected_unarchive,
        expected_list,
    ):
        user = _make_user(workspace, own_project, ws_role, project_role)
        client = client_for(user)

        issue = Issue(name="Perm Issue", project=own_project, workspace=workspace, state=states["completed"])
        issue.save(created_by_id=create_user.id)

        assert (
            client.post(_archive_url(workspace, own_project, issue), {}, format="json").status_code == expected_archive
        )

        issue.archived_at = timezone.now().date()
        issue.save()

        assert client.get(_archived_list_url(workspace, own_project)).status_code == expected_list
        assert client.delete(_unarchive_url(workspace, own_project, issue)).status_code == expected_unarchive


@pytest.mark.contract
@pytest.mark.django_db
class TestArchivedWorkItemsList:
    def test_list_archived_work_items_envelope_and_filtering(
        self, api_key_client, workspace, own_project, states, create_user
    ):
        active_issue = Issue(name="Active", project=own_project, workspace=workspace, state=states["completed"])
        active_issue.save(created_by_id=create_user.id)

        archived_issue = Issue(
            name="Archived",
            project=own_project,
            workspace=workspace,
            state=states["completed"],
            archived_at=timezone.now().date(),
        )
        archived_issue.save(created_by_id=create_user.id)

        resp = api_key_client.get(_archived_list_url(workspace, own_project))
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert set(body.keys()) == EXPECTED_PAGINATED_KEYS
        assert body["total_count"] == 1
        assert body["count"] == 1
        assert [item["id"] for item in body["results"]] == [str(archived_issue.id)]

        fields_resp = api_key_client.get(f"{_archived_list_url(workspace, own_project)}?fields=id,name")
        assert fields_resp.status_code == status.HTTP_200_OK
        assert fields_resp.json()["results"] == [{"id": str(archived_issue.id), "name": "Archived"}]

    @pytest.mark.parametrize(
        "query,expected_unsupported",
        [
            ("pql=priority%20%3D%20%22high%22", ["pql"]),
            ("filters=%7B%22priority%22%3A%22high%22%7D", ["filters"]),
        ],
    )
    def test_list_archived_rejects_pql_and_filters(
        self, api_key_client, workspace, own_project, query, expected_unsupported
    ):
        resp = api_key_client.get(f"{_archived_list_url(workspace, own_project)}?{query}")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json()["unsupported_parameters"] == expected_unsupported

    def test_restricted_guest_only_sees_own_archived_work_items(
        self, client_for, workspace, own_project, states, create_user
    ):
        Project.objects.filter(pk=own_project.pk).update(guest_view_all_features=False)
        guest = _make_user(workspace, own_project, GUEST, GUEST)

        foreign_archived = Issue(
            name="Foreign Archived",
            project=own_project,
            workspace=workspace,
            state=states["completed"],
            archived_at=timezone.now().date(),
        )
        foreign_archived.save(created_by_id=create_user.id)

        own_archived = Issue(
            name="Own Archived",
            project=own_project,
            workspace=workspace,
            state=states["completed"],
            archived_at=timezone.now().date(),
        )
        own_archived.save(created_by_id=guest.id)

        resp = client_for(guest).get(_archived_list_url(workspace, own_project))
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert body["total_count"] == 1
        assert [item["id"] for item in body["results"]] == [str(own_archived.id)]
