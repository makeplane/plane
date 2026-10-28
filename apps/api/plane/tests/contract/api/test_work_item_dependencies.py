# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public API work item dependencies and non-dependency relations."""

import json
from unittest import mock
from uuid import uuid4

import pytest
from django.db.models import Q
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Issue,
    IssueRelation,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5

EXPECTED_DEPENDENCY_KEYS = {
    "blocking",
    "blocked_by",
    "start_before",
    "start_after",
    "finish_before",
    "finish_after",
}

EXPECTED_CUSTOM_RELATION_KEYS = {
    "relates_to",
    "duplicate",
    "implemented_by",
    "implements",
}

EXPECTED_ITEM_KEYS = {
    "id",
    "name",
    "sequence_id",
    "project_id",
    "state_id",
    "priority",
    "type_id",
    "is_epic",
    "label_ids",
    "assignee_ids",
    "sort_order",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "relation_type",
}

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


def _project(workspace, owner, identifier, guest_view_all=True):
    project = Project.objects.create(
        name=identifier,
        identifier=identifier,
        workspace=workspace,
        created_by=owner,
        guest_view_all_features=guest_view_all,
    )
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=ADMIN, is_active=True)
    State.objects.create(name="Backlog", project=project, workspace=workspace, group="backlog", default=True)
    return project


@pytest.fixture
def own_project(workspace, create_user):
    return _project(workspace, create_user, "OWN")


@pytest.fixture
def own_issue(own_project, create_user):
    issue = Issue(name="Own Issue", project=own_project, workspace=own_project.workspace)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.fixture
def related_issue(own_project, create_user):
    issue = Issue(name="Related Issue", project=own_project, workspace=own_project.workspace)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.fixture
def sibling_issue(workspace):
    colleague = User.objects.create(email=f"c-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    WorkspaceMember.objects.create(workspace=workspace, member=colleague, role=ADMIN, is_active=True)
    project = _project(workspace, colleague, "SIB")
    issue = Issue(name="Sibling Issue", project=project, workspace=workspace)
    issue.save(created_by_id=colleague.id)
    return issue


@pytest.fixture
def other_tenant_issue(db):
    owner = User.objects.create(email=f"o-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    project = _project(other_ws, owner, "OTH")
    issue = Issue(name="Other Tenant Issue", project=project, workspace=other_ws)
    issue.save(created_by_id=owner.id)
    return issue


def _dep_url(workspace, project, issue, related_issue=None):
    base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/dependencies/"
    return f"{base}{related_issue.id}/" if related_issue else base


def _custom_rel_url(workspace, project, issue, related_issue=None):
    base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/work-item-relations/"
    return f"{base}{related_issue.id}/" if related_issue else base


def _definitions_url(workspace):
    return f"/api/v1/workspaces/{workspace.slug}/work-item-relation-definitions/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemDependencies:
    @pytest.mark.parametrize(
        "relation_type,expected_db_type,is_reverse",
        [
            ("blocked_by", "blocked_by", False),
            ("blocking", "blocked_by", True),
            ("start_before", "start_before", False),
            ("start_after", "start_before", True),
            ("finish_before", "finish_before", False),
            ("finish_after", "finish_before", True),
        ],
    )
    def test_create_and_list_dependency_directions(
        self,
        api_key_client,
        workspace,
        own_project,
        own_issue,
        related_issue,
        _no_side_effects,
        relation_type,
        expected_db_type,
        is_reverse,
    ):
        resp = api_key_client.post(
            _dep_url(workspace, own_project, own_issue),
            {"relation_type": relation_type, "work_item_ids": [str(related_issue.id)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.content
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) == 1
        assert set(body[0].keys()) == EXPECTED_ITEM_KEYS
        assert body[0]["id"] == str(related_issue.id)
        assert body[0]["relation_type"] == relation_type

        row = IssueRelation.objects.get(workspace=workspace)
        assert row.relation_type == expected_db_type
        if is_reverse:
            assert row.issue_id == related_issue.id
            assert row.related_issue_id == own_issue.id
        else:
            assert row.issue_id == own_issue.id
            assert row.related_issue_id == related_issue.id

        assert _no_side_effects.delay.called
        assert _no_side_effects.delay.call_args.kwargs["type"] == "issue_relation.activity.created"

        list_resp = api_key_client.get(_dep_url(workspace, own_project, own_issue))
        assert list_resp.status_code == status.HTTP_200_OK
        list_body = list_resp.json()
        assert set(list_body.keys()) == EXPECTED_DEPENDENCY_KEYS
        assert len(list_body[relation_type]) == 1
        assert set(list_body[relation_type][0].keys()) == EXPECTED_ITEM_KEYS
        assert list_body[relation_type][0]["id"] == str(related_issue.id)
        for other_key in EXPECTED_DEPENDENCY_KEYS - {relation_type}:
            assert list_body[other_key] == []

    def test_dependencies_get_excludes_non_dependency_relations(
        self, api_key_client, workspace, own_project, own_issue, related_issue
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=own_issue,
            related_issue=related_issue,
            relation_type="relates_to",
        )
        resp = api_key_client.get(_dep_url(workspace, own_project, own_issue))
        assert resp.status_code == status.HTTP_200_OK
        assert all(items == [] for items in resp.json().values())

    @pytest.mark.parametrize(
        "payload",
        [
            {"relation_type": "relates_to", "work_item_ids": [str(uuid4())]},
            {"relation_type": "duplicate", "work_item_ids": [str(uuid4())]},
            {"relation_type": "invalid", "work_item_ids": [str(uuid4())]},
            {"relation_type": "blocking", "work_item_ids": []},
            {"relation_type": "blocking"},
            {"work_item_ids": [str(uuid4())]},
        ],
    )
    def test_create_dependency_invalid_payload_returns_400(
        self, api_key_client, workspace, own_project, own_issue, payload
    ):
        resp = api_key_client.post(_dep_url(workspace, own_project, own_issue), payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueRelation.objects.count() == 0

    @pytest.mark.parametrize(
        "stored_reverse,expected_perspective_type",
        [
            (False, "blocked_by"),
            (True, "blocking"),
        ],
    )
    def test_delete_dependency_orientation_and_activity(
        self,
        api_key_client,
        workspace,
        own_project,
        own_issue,
        related_issue,
        _no_side_effects,
        stored_reverse,
        expected_perspective_type,
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=related_issue if stored_reverse else own_issue,
            related_issue=own_issue if stored_reverse else related_issue,
            relation_type="blocked_by",
        )
        resp = api_key_client.delete(_dep_url(workspace, own_project, own_issue, related_issue))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert IssueRelation.objects.count() == 0

        kwargs = _no_side_effects.delay.call_args.kwargs
        assert kwargs["type"] == "issue_relation.activity.deleted"
        requested_data = json.loads(kwargs["requested_data"])
        assert requested_data == {
            "related_issue": str(related_issue.id),
            "relation_type": expected_perspective_type,
        }

    def test_delete_dependency_does_not_delete_non_dependency_relation(
        self, api_key_client, workspace, own_project, own_issue, related_issue
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=own_issue,
            related_issue=related_issue,
            relation_type="relates_to",
        )
        resp = api_key_client.delete(_dep_url(workspace, own_project, own_issue, related_issue))
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert IssueRelation.objects.count() == 1

    @pytest.mark.parametrize("target", ["sibling_issue", "other_tenant_issue"])
    def test_cross_project_and_cross_workspace_url_issue_returns_404(
        self, request, api_key_client, workspace, own_project, related_issue, target
    ):
        foreign_issue = request.getfixturevalue(target)
        url = _dep_url(workspace, own_project, foreign_issue)

        assert api_key_client.get(url).status_code == status.HTTP_404_NOT_FOUND
        assert (
            api_key_client.post(
                url,
                {"relation_type": "blocked_by", "work_item_ids": [str(related_issue.id)]},
                format="json",
            ).status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert (
            api_key_client.delete(_dep_url(workspace, own_project, foreign_issue, related_issue)).status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert IssueRelation.objects.filter(Q(issue=foreign_issue) | Q(related_issue=foreign_issue)).count() == 0

    def test_cross_workspace_target_in_post_body_creates_nothing(
        self, api_key_client, workspace, own_project, own_issue, other_tenant_issue
    ):
        resp = api_key_client.post(
            _dep_url(workspace, own_project, own_issue),
            {"relation_type": "blocked_by", "work_item_ids": [str(other_tenant_issue.id)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json() == []
        assert IssueRelation.objects.count() == 0

    def test_target_in_project_caller_is_not_member_of_creates_nothing(
        self, api_key_client, workspace, own_project, own_issue, sibling_issue
    ):
        resp = api_key_client.post(
            _dep_url(workspace, own_project, own_issue),
            {"relation_type": "blocked_by", "work_item_ids": [str(sibling_issue.id)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json() == []
        assert IssueRelation.objects.count() == 0

    def test_self_relation_is_skipped(self, api_key_client, workspace, own_project, own_issue, related_issue):
        url = _dep_url(workspace, own_project, own_issue)

        only_self = api_key_client.post(
            url, {"relation_type": "blocked_by", "work_item_ids": [str(own_issue.id)]}, format="json"
        )
        assert only_self.status_code == status.HTTP_201_CREATED
        assert only_self.json() == []
        assert IssueRelation.objects.count() == 0

        mixed = api_key_client.post(
            url,
            {"relation_type": "blocked_by", "work_item_ids": [str(own_issue.id), str(related_issue.id)]},
            format="json",
        )
        assert mixed.status_code == status.HTTP_201_CREATED
        assert [item["id"] for item in mixed.json()] == [str(related_issue.id)]
        assert not IssueRelation.objects.filter(issue=own_issue, related_issue=own_issue).exists()
        assert IssueRelation.objects.count() == 1

    def test_delete_dependency_removes_both_orientations(
        self, api_key_client, workspace, own_project, own_issue, related_issue, _no_side_effects
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=own_issue,
            related_issue=related_issue,
            relation_type="blocked_by",
        )
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=related_issue,
            related_issue=own_issue,
            relation_type="start_before",
        )
        resp = api_key_client.delete(_dep_url(workspace, own_project, own_issue, related_issue))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert IssueRelation.objects.count() == 0

        deleted_calls = [
            call.kwargs
            for call in _no_side_effects.delay.call_args_list
            if call.kwargs["type"] == "issue_relation.activity.deleted"
        ]
        assert sorted(json.loads(kw["requested_data"])["relation_type"] for kw in deleted_calls) == [
            "blocked_by",
            "start_after",
        ]

    def test_legacy_relations_post_with_invisible_target_creates_nothing(
        self, api_key_client, workspace, own_project, own_issue, sibling_issue
    ):
        resp = api_key_client.post(
            f"/api/v1/workspaces/{workspace.slug}/projects/{own_project.id}/work-items/{own_issue.id}/relations/",
            {"relation_type": "blocked_by", "issues": [str(sibling_issue.id)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json() == []
        assert IssueRelation.objects.count() == 0

    @pytest.mark.parametrize(
        "ws_role,project_role,get_status,write_status",
        [
            (ADMIN, ADMIN, status.HTTP_200_OK, status.HTTP_201_CREATED),
            (MEMBER, MEMBER, status.HTTP_200_OK, status.HTTP_201_CREATED),
            (GUEST, GUEST, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN),
            (MEMBER, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
            (None, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_permission_matrix(
        self,
        client_for,
        workspace,
        own_project,
        own_issue,
        related_issue,
        ws_role,
        project_role,
        get_status,
        write_status,
    ):
        user = _make_user(workspace, own_project, ws_role, project_role)
        client = client_for(user)
        url = _dep_url(workspace, own_project, own_issue)

        assert client.get(url).status_code == get_status
        post_resp = client.post(
            url,
            {"relation_type": "blocked_by", "work_item_ids": [str(related_issue.id)]},
            format="json",
        )
        assert post_resp.status_code == write_status

        if write_status == status.HTTP_201_CREATED:
            del_resp = client.delete(_dep_url(workspace, own_project, own_issue, related_issue))
            assert del_resp.status_code == status.HTTP_204_NO_CONTENT
        else:
            IssueRelation.objects.create(
                workspace=workspace,
                project=own_project,
                issue=own_issue,
                related_issue=related_issue,
                relation_type="blocked_by",
            )
            del_resp = client.delete(_dep_url(workspace, own_project, own_issue, related_issue))
            assert del_resp.status_code == status.HTTP_403_FORBIDDEN
            assert IssueRelation.objects.count() == 1

    def test_restricted_guest_visibility_on_dependencies(
        self, client_for, workspace, own_project, own_issue, related_issue
    ):
        Project.objects.filter(pk=own_project.pk).update(guest_view_all_features=False)
        guest = _make_user(workspace, own_project, GUEST, GUEST)
        guest_issue = Issue(name="Guest Issue", project=own_project, workspace=workspace)
        guest_issue.save(created_by_id=guest.id)

        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=guest_issue,
            related_issue=related_issue,
            relation_type="blocked_by",
        )
        client = client_for(guest)

        assert client.get(_dep_url(workspace, own_project, own_issue)).status_code == status.HTTP_404_NOT_FOUND
        resp = client.get(_dep_url(workspace, own_project, guest_issue))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["blocked_by"] == []


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemCustomRelationsAndDefinitions:
    @pytest.mark.parametrize(
        "db_type,is_reverse,expected_group",
        [
            ("relates_to", False, "relates_to"),
            ("duplicate", True, "duplicate"),
            ("implemented_by", False, "implemented_by"),
            ("implemented_by", True, "implements"),
        ],
    )
    def test_list_and_delete_non_dependency_relations(
        self,
        api_key_client,
        workspace,
        own_project,
        own_issue,
        related_issue,
        _no_side_effects,
        db_type,
        is_reverse,
        expected_group,
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=related_issue if is_reverse else own_issue,
            related_issue=own_issue if is_reverse else related_issue,
            relation_type=db_type,
        )
        resp = api_key_client.get(_custom_rel_url(workspace, own_project, own_issue))
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert set(body.keys()) == EXPECTED_CUSTOM_RELATION_KEYS
        assert len(body[expected_group]) == 1
        assert set(body[expected_group][0].keys()) == EXPECTED_ITEM_KEYS
        assert body[expected_group][0]["id"] == str(related_issue.id)
        assert body[expected_group][0]["relation_type"] == expected_group

        del_resp = api_key_client.delete(_custom_rel_url(workspace, own_project, own_issue, related_issue))
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT
        assert IssueRelation.objects.count() == 0

        kwargs = _no_side_effects.delay.call_args.kwargs
        assert kwargs["type"] == "issue_relation.activity.deleted"
        assert json.loads(kwargs["requested_data"]) == {
            "related_issue": str(related_issue.id),
            "relation_type": expected_group,
        }

    def test_delete_custom_relation_does_not_delete_dependency(
        self, api_key_client, workspace, own_project, own_issue, related_issue
    ):
        IssueRelation.objects.create(
            workspace=workspace,
            project=own_project,
            issue=own_issue,
            related_issue=related_issue,
            relation_type="blocked_by",
        )
        resp = api_key_client.delete(_custom_rel_url(workspace, own_project, own_issue, related_issue))
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert IssueRelation.objects.count() == 1

    @pytest.mark.parametrize(
        "ws_role,expected_status",
        [
            (ADMIN, status.HTTP_200_OK),
            (MEMBER, status.HTTP_200_OK),
            (GUEST, status.HTTP_200_OK),
            (None, status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_relation_definitions_list(self, client_for, workspace, own_project, ws_role, expected_status):
        user = _make_user(workspace, own_project, ws_role, None)
        resp = client_for(user).get(_definitions_url(workspace))
        assert resp.status_code == expected_status
        if expected_status == status.HTTP_200_OK:
            body = resp.json()
            assert set(body.keys()) == EXPECTED_PAGINATED_KEYS
            assert body["results"] == []
            assert body["total_count"] == 0
            assert body["count"] == 0
