# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for GET /api/v1/workspaces/<slug>/roles/ and /roles/<role_id>/."""

import uuid
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.api.views.member import ROLE_UUID_NAMESPACE
from plane.db.models import APIToken, Project, ProjectMember, User, Workspace, WorkspaceMember

ADMIN, MEMBER, GUEST = 20, 15, 5

PAGINATED_ENVELOPE_KEYS = {
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

ROLE_ITEM_KEYS = {"id", "name", "slug", "namespace", "level", "member_count"}


def _make_user(workspace, role, is_active=True):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=is_active)
    return user


def _client_for(user):
    token = APIToken.objects.create(user=user, label="t", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _roles_url(slug):
    return f"/api/v1/workspaces/{slug}/roles/"


@pytest.mark.contract
@pytest.mark.django_db
def test_list_roles_envelope_and_member_counts(api_key_client, workspace, create_user):
    ws_member = _make_user(workspace, MEMBER)
    ws_guest = _make_user(workspace, GUEST)
    _make_user(workspace, GUEST, is_active=False)

    project = Project.objects.create(name="RoleProj", identifier="RP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, workspace=workspace, member=create_user, role=ADMIN, is_active=True)
    ProjectMember.objects.create(project=project, workspace=workspace, member=ws_member, role=MEMBER, is_active=True)
    ProjectMember.objects.create(project=project, workspace=workspace, member=ws_guest, role=MEMBER, is_active=True)

    response = api_key_client.get(_roles_url(workspace.slug))

    assert response.status_code == status.HTTP_200_OK, response.content
    assert set(response.data.keys()) == PAGINATED_ENVELOPE_KEYS
    assert response.data["total_count"] == 6
    assert response.data["count"] == 6
    assert response.data["total_pages"] == 1
    assert response.data["total_results"] == 6
    assert response.data["next_page_results"] is False
    assert response.data["prev_page_results"] is False

    by_key = {(r["namespace"], r["slug"]): r for r in response.data["results"]}
    assert len(by_key) == 6
    for (ns, r_slug), item in by_key.items():
        assert set(item.keys()) == ROLE_ITEM_KEYS
        assert item["id"] == str(uuid.uuid5(ROLE_UUID_NAMESPACE, f"{ns}:{r_slug}"))

    assert by_key[("workspace", "admin")]["member_count"] == 1
    assert by_key[("workspace", "member")]["member_count"] == 1
    assert by_key[("workspace", "guest")]["member_count"] == 1
    assert by_key[("project", "admin")]["member_count"] == 1
    assert by_key[("project", "member")]["member_count"] == 2
    assert by_key[("project", "guest")]["member_count"] == 0


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("ns", ["workspace", "project"])
def test_list_roles_filtered_by_namespace(api_key_client, workspace, ns):
    response = api_key_client.get(_roles_url(workspace.slug), {"namespace": ns})

    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.data["total_count"] == 3
    assert [r["slug"] for r in response.data["results"]] == ["admin", "member", "guest"]
    assert all(r["namespace"] == ns for r in response.data["results"])


@pytest.mark.contract
@pytest.mark.django_db
def test_list_roles_pagination_and_invalid_params(api_key_client, workspace):
    url = _roles_url(workspace.slug)
    page1 = api_key_client.get(url, {"per_page": 2})
    assert page1.status_code == status.HTTP_200_OK
    assert page1.data["count"] == 2
    assert page1.data["total_count"] == 6
    assert page1.data["total_pages"] == 3
    assert page1.data["next_page_results"] is True

    page2 = api_key_client.get(url, {"per_page": 2, "cursor": page1.data["next_cursor"]})
    assert page2.status_code == status.HTTP_200_OK
    assert page2.data["count"] == 2
    assert page2.data["prev_page_results"] is True
    assert {r["id"] for r in page1.data["results"]}.isdisjoint({r["id"] for r in page2.data["results"]})

    assert api_key_client.get(url, {"namespace": "invalid"}).status_code == status.HTTP_400_BAD_REQUEST
    assert api_key_client.get(url, {"per_page": 0}).status_code == status.HTTP_400_BAD_REQUEST
    assert api_key_client.get(url, {"cursor": "bad-cursor"}).status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_retrieve_role_by_id_and_not_found(api_key_client, workspace):
    admin_id = uuid.uuid5(ROLE_UUID_NAMESPACE, "workspace:admin")
    url = f"{_roles_url(workspace.slug)}{admin_id}/"

    response = api_key_client.get(url)
    assert response.status_code == status.HTTP_200_OK, response.content
    assert set(response.data.keys()) == ROLE_ITEM_KEYS
    assert response.data["id"] == str(admin_id)
    assert response.data["slug"] == "admin"
    assert response.data["namespace"] == "workspace"
    assert response.data["level"] == ADMIN
    assert response.data["member_count"] == 1

    missing = api_key_client.get(f"{_roles_url(workspace.slug)}{uuid4()}/")
    assert missing.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "role,expected",
    [
        (ADMIN, status.HTTP_200_OK),
        (MEMBER, status.HTTP_200_OK),
        (GUEST, status.HTTP_200_OK),
        (None, status.HTTP_403_FORBIDDEN),
    ],
)
def test_roles_permission_matrix_and_workspace_isolation(workspace, role, expected):
    uid = uuid4().hex[:8]
    other_owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=other_owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=other_owner, role=ADMIN, is_active=True)

    user = _make_user(workspace, role)
    client = _client_for(user)
    admin_id = uuid.uuid5(ROLE_UUID_NAMESPACE, "workspace:admin")

    list_resp = client.get(_roles_url(workspace.slug))
    detail_resp = client.get(f"{_roles_url(workspace.slug)}{admin_id}/")
    assert list_resp.status_code == expected
    assert detail_resp.status_code == expected
    if expected == status.HTTP_200_OK:
        # Other workspace's admin must not be counted in this workspace.
        expected_admins = WorkspaceMember.objects.filter(workspace=workspace, role=ADMIN, is_active=True).count()
        assert detail_resp.data["member_count"] == expected_admins

    assert client.get(_roles_url("nonexistent-ws")).status_code == status.HTTP_404_NOT_FOUND
