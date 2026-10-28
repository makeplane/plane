# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for GET /api/v1/workspaces/<slug>/features/."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, User, Workspace, WorkspaceMember

ADMIN, MEMBER, GUEST = 20, 15, 5

WORKSPACE_FEATURE_KEYS = {
    "project_grouping",
    "initiatives",
    "teams",
    "customers",
    "wiki",
    "pi",
    "work_item_types",
    "releases",
    "states_owned_by_workspace",
}


def _make_ws_user(workspace, role, is_active=True):
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


def _url(slug):
    return f"/api/v1/workspaces/{slug}/features/"


@pytest.mark.contract
@pytest.mark.django_db
def test_get_workspace_features_returns_all_false_with_sdk_keys(api_key_client, workspace):
    response = api_key_client.get(_url(workspace.slug))

    assert response.status_code == status.HTTP_200_OK, response.content
    assert set(response.data.keys()) == WORKSPACE_FEATURE_KEYS
    assert all(value is False for value in response.data.values())


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "role,is_active,expected",
    [
        (ADMIN, True, status.HTTP_200_OK),
        (MEMBER, True, status.HTTP_200_OK),
        (GUEST, True, status.HTTP_200_OK),
        (MEMBER, False, status.HTTP_403_FORBIDDEN),
        (None, True, status.HTTP_403_FORBIDDEN),
    ],
)
def test_workspace_features_permission_matrix(workspace, role, is_active, expected):
    user = _make_ws_user(workspace, role, is_active=is_active)
    client = _client_for(user)

    response = client.get(_url(workspace.slug))

    assert response.status_code == expected, response.content


@pytest.mark.contract
@pytest.mark.django_db
def test_nonexistent_and_other_workspace_slug(api_key_client):
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)

    assert api_key_client.get(_url(other_ws.slug)).status_code == status.HTTP_403_FORBIDDEN
    assert api_key_client.get(_url("nonexistent-workspace-slug")).status_code == status.HTTP_404_NOT_FOUND
