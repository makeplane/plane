# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for WorkSpaceViewSet update authorization.

Editing workspace settings is workspace-admin-only. ``partial_update`` enforced that, but
``WorkSpaceBasePermission`` let members through for PUT, which routes to the undecorated
``update``. The permission class now requires the admin role for both PUT and PATCH.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.tests.factories import UserFactory, WorkspaceMemberFactory

ADMIN, MEMBER, GUEST = 20, 15, 5


def _client_for(workspace, role):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceUpdateAdminScope:
    @pytest.mark.parametrize("method", ["put", "patch"])
    @pytest.mark.parametrize("role", [GUEST, MEMBER])
    def test_non_admin_cannot_update_workspace(self, workspace, role, method):
        client = _client_for(workspace, role)
        response = getattr(client, method)(
            f"/api/workspaces/{workspace.slug}/", {"name": "Renamed", "slug": workspace.slug}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
        workspace.refresh_from_db()
        assert workspace.name == "Test Workspace"

    @pytest.mark.parametrize("method", ["put", "patch"])
    def test_admin_can_update_workspace(self, workspace, method):
        client = _client_for(workspace, ADMIN)
        response = getattr(client, method)(
            f"/api/workspaces/{workspace.slug}/", {"name": "Renamed", "slug": workspace.slug}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        workspace.refresh_from_db()
        assert workspace.name == "Renamed"
