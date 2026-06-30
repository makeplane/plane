# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.app.serializers.project_template import BUILT_IN_PROJECT_TEMPLATES
from plane.db.models import ProjectTemplate, WorkspaceMember, User


def get_project_templates_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/project-templates/"


@pytest.mark.contract
class TestProjectTemplateCatalogAPI:
    """Contract tests for the workspace project-template catalog list endpoint."""

    @pytest.mark.django_db
    def test_admin_list_returns_seeded_builtins(self, session_client, workspace):
        """Workspace admins see the three built-in templates in the catalog list."""
        response = session_client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])
        names = {row["name"] for row in results}
        assert names == {t["name"] for t in BUILT_IN_PROJECT_TEMPLATES}

    @pytest.mark.django_db
    def test_admin_list_includes_payload_and_metadata(self, session_client, workspace):
        """The list response exposes the fields the frontend needs to render the catalog."""
        response = session_client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        for row in results:
            for key in (
                "id",
                "name",
                "description",
                "template_type",
                "system_key",
                "is_system",
                "is_active",
                "payload",
                "workspace",
                "created_at",
                "updated_at",
            ):
                assert key in row, f"missing {key} in row {row}"

    @pytest.mark.django_db
    def test_builtin_records_are_workspace_null(self, session_client, workspace):
        """Each built-in returned by the list endpoint has a null workspace per D-10."""
        response = session_client.get(get_project_templates_url(workspace.slug))
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        for row in results:
            if row.get("is_system"):
                assert row["workspace"] is None

    @pytest.mark.django_db
    def test_member_list_returns_seeded_builtins(self, db, create_user, workspace):
        """Workspace members can also list the catalog per D-13."""
        member = User.objects.create_user(email="member@example.com", username="member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = session_client.__class__()
        client.force_authenticate(user=member)
        response = client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        assert {row["name"] for row in results} == {t["name"] for t in BUILT_IN_PROJECT_TEMPLATES}

    @pytest.mark.django_db
    def test_guest_list_returns_403(self, db, create_user, workspace):
        """Workspace guests are denied access to the catalog list per D-14."""
        guest = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = session_client.__class__()
        client.force_authenticate(user=guest)
        response = client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_omits_inactive_custom_templates(self, session_client, workspace, create_user):
        """Inactive custom templates are not returned in the catalog list."""
        ProjectTemplate.objects.create(
            workspace=workspace,
            name="Inactive Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=False,
            created_by=create_user,
        )
        response = session_client.get(get_project_templates_url(workspace.slug))
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        assert all(row["name"] != "Inactive Custom" for row in results)
