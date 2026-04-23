# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Contract tests for the external permission-introspection read endpoints.

Three endpoints under test:
  - GET /api/v1/workspaces/<slug>/permissions/
  - GET /api/v1/workspaces/<slug>/projects/<id>/permissions/
  - GET /api/v1/workspaces/<slug>/roles/
  - GET /api/v1/workspaces/<slug>/permission-schemes/

All gated by @can(WorkspacePermissions.VIEW, scope=workspace) — any active
workspace member allowed, outsider denied. Tests cover:
  (1) role-boundary: workspace members allowed, outsider 403
  (2) shape smoke: asserts response shape for a representative role
"""

import pytest


@pytest.mark.contract
@pytest.mark.django_db
class TestUserPermissionEndpointWorkspaceScope:
    @pytest.mark.parametrize(
        "role,allowed",
        [
            ("ws_owner", True),
            ("ws_admin", True),
            ("ws_member", True),
            ("ws_guest", True),
            ("proj_admin", True),  # is also a workspace member
            ("proj_contributor", True),
            ("proj_commenter", True),
            ("proj_guest", True),
            ("outsider", False),
        ],
    )
    def test_role_boundary(self, role_matrix, role, allowed):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/permissions/"
        response = role_matrix.clients[role].get(url)
        if allowed:
            assert response.status_code == 200, response.data
        else:
            assert response.status_code == 403, response.data

    def test_response_shape(self, role_matrix):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/permissions/"
        response = role_matrix.clients["ws_admin"].get(url)
        assert response.status_code == 200
        assert set(response.data.keys()) == {"relation", "permission_grants"}
        assert isinstance(response.data["permission_grants"], list)
        # Admin should have at least some grants
        assert len(response.data["permission_grants"]) > 0


@pytest.mark.contract
@pytest.mark.django_db
class TestUserPermissionEndpointProjectScope:
    @pytest.mark.parametrize(
        "role,allowed",
        [
            ("ws_owner", True),
            ("ws_admin", True),
            ("ws_member", True),
            ("proj_admin", True),
            ("proj_contributor", True),
            ("proj_guest", True),
            ("outsider", False),
        ],
    )
    def test_role_boundary(self, role_matrix, role, allowed):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/projects/{role_matrix.project.id}/permissions/"
        response = role_matrix.clients[role].get(url)
        if allowed:
            assert response.status_code == 200, response.data
        else:
            assert response.status_code == 403, response.data

    def test_response_shape_project_admin(self, role_matrix):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/projects/{role_matrix.project.id}/permissions/"
        response = role_matrix.clients["proj_admin"].get(url)
        assert response.status_code == 200
        assert "relation" in response.data
        assert "permission_grants" in response.data
        # Project admin should have workitem perms (not workspace-level like wiki)
        grants = response.data["permission_grants"]
        assert any(g.startswith("workitem:") for g in grants)


@pytest.mark.contract
@pytest.mark.django_db
class TestRoleListAPIEndpoint:
    @pytest.mark.parametrize(
        "role,allowed",
        [
            ("ws_owner", True),
            ("ws_member", True),
            ("proj_contributor", True),
            ("outsider", False),
        ],
    )
    def test_role_boundary(self, role_matrix, role, allowed):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/roles/"
        response = role_matrix.clients[role].get(url)
        if allowed:
            assert response.status_code == 200, response.data
        else:
            assert response.status_code == 403, response.data

    def test_response_lists_system_roles(self, role_matrix):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/roles/"
        response = role_matrix.clients["ws_admin"].get(url)
        assert response.status_code == 200
        # Paginated response — inspect `results`
        slugs = {row["slug"] for row in response.data["results"]}
        # Every workspace has system roles created for it
        assert "admin" in slugs
        assert "guest" in slugs

    def test_namespace_filter(self, role_matrix):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/roles/?namespace=project"
        response = role_matrix.clients["ws_admin"].get(url)
        assert response.status_code == 200
        namespaces = {row["namespace"] for row in response.data["results"]}
        assert namespaces == {"project"}


@pytest.mark.contract
@pytest.mark.django_db
class TestPermissionSchemeListAPIEndpoint:
    @pytest.mark.parametrize(
        "role,allowed",
        [
            ("ws_owner", True),
            ("ws_member", True),
            ("proj_contributor", True),
            ("outsider", False),
        ],
    )
    def test_role_boundary(self, role_matrix, role, allowed):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/permission-schemes/"
        response = role_matrix.clients[role].get(url)
        if allowed:
            assert response.status_code == 200, response.data
        else:
            assert response.status_code == 403, response.data

    def test_response_lists_system_schemes(self, role_matrix):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/permission-schemes/"
        response = role_matrix.clients["ws_admin"].get(url)
        assert response.status_code == 200
        # At minimum the system PSes (namespace workspace + project) should be present
        assert len(response.data["results"]) > 0
