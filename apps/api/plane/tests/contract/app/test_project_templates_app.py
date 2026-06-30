# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.app.serializers.project_template import (
    BUILT_IN_PROJECT_TEMPLATES,
    PROJECT_TEMPLATE_SCHEMA_VERSION,
)
from plane.db.models import ProjectTemplate, WorkspaceMember, User


def get_project_templates_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/project-templates/"


def get_project_template_detail_url(workspace_slug: str, pk) -> str:
    return f"/api/workspaces/{workspace_slug}/project-templates/{pk}/"


def get_project_template_duplicate_url(workspace_slug: str, pk) -> str:
    return f"/api/workspaces/{workspace_slug}/project-templates/{pk}/duplicate/"


@pytest.fixture
def seeded_builtin_templates(db):
    """Idempotently create the three built-in project templates for tests.

    The pytest settings module disables migrations, so the seed migration does
    not run automatically; this fixture seeds the built-ins in the same shape
    the migration would.
    """
    for entry in BUILT_IN_PROJECT_TEMPLATES:
        ProjectTemplate.objects.update_or_create(
            system_key=entry["system_key"],
            is_system=True,
            workspace__isnull=True,
            defaults={
                "name": entry["name"],
                "description": entry.get("description", ""),
                "template_type": entry["template_type"],
                "is_system": True,
                "is_active": True,
                "workspace": None,
                "payload": entry["payload"],
            },
        )
    return ProjectTemplate.objects.filter(is_system=True)


@pytest.mark.contract
class TestProjectTemplateCatalogAPI:
    """Contract tests for the workspace project-template catalog list endpoint."""

    @pytest.mark.django_db
    def test_admin_list_returns_seeded_builtins(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """Workspace admins see the three built-in templates in the catalog list."""
        response = session_client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])
        names = {row["name"] for row in results}
        assert names == {t["name"] for t in BUILT_IN_PROJECT_TEMPLATES}

    @pytest.mark.django_db
    def test_admin_list_includes_payload_and_metadata(
        self, session_client, workspace, seeded_builtin_templates
    ):
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
    def test_builtin_records_are_workspace_null(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """Each built-in returned by the list endpoint has a null workspace per D-10."""
        response = session_client.get(get_project_templates_url(workspace.slug))
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        for row in results:
            if row.get("is_system"):
                assert row["workspace"] is None

    @pytest.mark.django_db
    def test_member_list_returns_seeded_builtins(
        self, workspace, seeded_builtin_templates
    ):
        """Workspace members can also list the catalog per D-13."""
        member = User.objects.create_user(email="member@example.com", username="member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        assert {row["name"] for row in results} == {
            t["name"] for t in BUILT_IN_PROJECT_TEMPLATES
        }

    @pytest.mark.django_db
    def test_guest_list_returns_403(self, workspace, seeded_builtin_templates):
        """Workspace guests are denied access to the catalog list per D-14."""
        guest = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.get(get_project_templates_url(workspace.slug))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_omits_inactive_custom_templates(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
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


def _minimal_valid_payload():
    """Return a minimal but valid template payload for contract tests."""
    return {
        "schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION,
        "states": [
            {
                "state_key": "backlog",
                "name": "Backlog",
                "color": "#60646C",
                "group": "backlog",
                "sequence": 15000,
                "default": True,
            },
            {
                "state_key": "todo",
                "name": "Todo",
                "color": "#3F76FF",
                "group": "unstarted",
                "sequence": 25000,
            },
        ],
        "labels": [],
        "modules": [],
        "cycles": [],
        "starter_issues": [],
    }


@pytest.mark.contract
class TestProjectTemplateWriteAPI:
    """Contract tests for the workspace project-template custom write lifecycle.

    Covers admin success, member/guest 403, built-in mutation rejection, and
    soft deactivate behavior (D-05, D-06, D-11, D-15, D-16).
    """

    @pytest.mark.django_db
    def test_admin_create_creates_custom_template(
        self, session_client, workspace, seeded_builtin_templates, create_user
    ):
        """Workspace admins can create a custom template with strict payload validation."""
        payload = _minimal_valid_payload()
        response = session_client.post(
            get_project_templates_url(workspace.slug),
            {
                "name": "Custom Admin Template",
                "description": "Custom admin payload",
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": payload,
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.content
        data = response.json()
        assert data["name"] == "Custom Admin Template"
        assert data["template_type"] == ProjectTemplate.TemplateType.CUSTOM
        assert data["is_system"] is False
        assert data["system_key"] is None
        assert data["workspace"] == str(workspace.id)
        assert ProjectTemplate.objects.filter(name="Custom Admin Template").exists()

    @pytest.mark.django_db
    def test_admin_create_with_invalid_payload_returns_400(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """Custom template POST with an invalid payload returns 400."""
        response = session_client.post(
            get_project_templates_url(workspace.slug),
            {
                "name": "Invalid Template",
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": {"schema_version": 999, "states": []},
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_admin_partial_update_updates_custom_template(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """Workspace admins can PATCH a custom template and the change is persisted."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Original Name",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        response = session_client.patch(
            get_project_template_detail_url(workspace.slug, template.id),
            {"description": "Updated description"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.content
        template.refresh_from_db()
        assert template.description == "Updated description"

    @pytest.mark.django_db
    def test_admin_destroy_soft_deactivates_custom_template(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """Admin DELETE soft-deactivates the custom template (is_active=False)."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Soft Delete Me",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        response = session_client.delete(
            get_project_template_detail_url(workspace.slug, template.id)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        template.refresh_from_db()
        assert template.is_active is False

    @pytest.mark.django_db
    def test_admin_destroy_removed_from_list(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """After soft-deactivate, the custom template is not returned by the list endpoint."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Hidden After Deactivate",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        session_client.delete(get_project_template_detail_url(workspace.slug, template.id))
        response = session_client.get(get_project_templates_url(workspace.slug))
        results = response.json() if isinstance(response.json(), list) else response.json().get("results", [])
        assert all(row["name"] != "Hidden After Deactivate" for row in results)

    @pytest.mark.django_db
    def test_admin_patch_builtin_returns_400_and_does_not_mutate(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """PATCH against a built-in template is rejected and leaves the system row untouched."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        original_description = builtin.description
        original_name = builtin.name
        response = session_client.patch(
            get_project_template_detail_url(workspace.slug, builtin.id),
            {"description": "Hacked"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        builtin.refresh_from_db()
        assert builtin.description == original_description
        assert builtin.name == original_name
        assert builtin.is_system is True

    @pytest.mark.django_db
    def test_admin_delete_builtin_returns_400_and_does_not_mutate(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """DELETE against a built-in template is rejected and leaves the system row untouched."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        response = session_client.delete(
            get_project_template_detail_url(workspace.slug, builtin.id)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        builtin.refresh_from_db()
        assert builtin.is_active is True
        assert builtin.is_system is True

    @pytest.mark.django_db
    def test_member_create_returns_403(
        self, workspace, seeded_builtin_templates
    ):
        """Workspace members cannot create custom templates per D-15/D-16."""
        member = User.objects.create_user(email="m2@example.com", username="m2")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.post(
            get_project_templates_url(workspace.slug),
            {
                "name": "Member Template",
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": _minimal_valid_payload(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_member_patch_returns_403(
        self, workspace, create_user, seeded_builtin_templates
    ):
        """Workspace members cannot PATCH custom templates per D-15/D-16."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Member Cannot Patch",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        member = User.objects.create_user(email="m3@example.com", username="m3")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.patch(
            get_project_template_detail_url(workspace.slug, template.id),
            {"description": "Member attempt"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_member_delete_returns_403(
        self, workspace, create_user, seeded_builtin_templates
    ):
        """Workspace members cannot DELETE custom templates per D-15/D-16."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Member Cannot Delete",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        member = User.objects.create_user(email="m4@example.com", username="m4")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.delete(get_project_template_detail_url(workspace.slug, template.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_create_returns_403(
        self, workspace, seeded_builtin_templates
    ):
        """Workspace guests cannot create custom templates per D-14/D-15/D-16."""
        guest = User.objects.create_user(email="g2@example.com", username="g2")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.post(
            get_project_templates_url(workspace.slug),
            {
                "name": "Guest Template",
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": _minimal_valid_payload(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_patch_returns_403(
        self, workspace, create_user, seeded_builtin_templates
    ):
        """Workspace guests cannot PATCH custom templates per D-14/D-15/D-16."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Guest Cannot Patch",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        guest = User.objects.create_user(email="g3@example.com", username="g3")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.patch(
            get_project_template_detail_url(workspace.slug, template.id),
            {"description": "Guest attempt"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_delete_returns_403(
        self, workspace, create_user, seeded_builtin_templates
    ):
        """Workspace guests cannot DELETE custom templates per D-14/D-15/D-16."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Guest Cannot Delete",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        guest = User.objects.create_user(email="g4@example.com", username="g4")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.delete(get_project_template_detail_url(workspace.slug, template.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_cross_workspace_patch_returns_404(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """A custom template from another workspace is not reachable from this workspace's URL."""
        other_workspace = workspace.__class__.objects.create(
            name="Other Workspace",
            owner=create_user,
            slug="other-workspace",
        )
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        foreign_template = ProjectTemplate.objects.create(
            workspace=other_workspace,
            name="Foreign Template",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        response = session_client.patch(
            get_project_template_detail_url(workspace.slug, foreign_template.id),
            {"description": "Cross-workspace attempt"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestProjectTemplateDuplicateAPI:
    """Contract tests for the duplicate-built-in-into-custom endpoint (D-07)."""

    @pytest.mark.django_db
    def test_admin_duplicate_builtin_creates_custom_copy(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """An admin can duplicate a built-in into a workspace-scoped editable custom template."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        original_payload = builtin.payload
        response = session_client.post(
            get_project_template_duplicate_url(workspace.slug, builtin.id),
            {"name": "Software Project (Custom)"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.content
        data = response.json()
        assert data["name"] == "Software Project (Custom)"
        assert data["is_system"] is False
        assert data["system_key"] is None
        assert data["template_type"] == ProjectTemplate.TemplateType.CUSTOM
        assert data["workspace"] == str(workspace.id)
        # The payload content is preserved so the admin can edit it next.
        assert data["payload"] == original_payload

    @pytest.mark.django_db
    def test_admin_duplicate_builtin_default_name(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """When no name is provided the duplicate carries the built-in's name."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        response = session_client.post(
            get_project_template_duplicate_url(workspace.slug, builtin.id),
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.content
        data = response.json()
        assert data["name"] == builtin.name
        assert data["is_system"] is False
        assert data["workspace"] == str(workspace.id)

    @pytest.mark.django_db
    def test_member_duplicate_returns_403(
        self, workspace, seeded_builtin_templates
    ):
        """Workspace members cannot duplicate built-ins per D-15/D-16."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        member = User.objects.create_user(email="m5@example.com", username="m5")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.post(
            get_project_template_duplicate_url(workspace.slug, builtin.id),
            {"name": "Should Not Be Allowed"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_duplicate_returns_403(
        self, workspace, seeded_builtin_templates
    ):
        """Workspace guests cannot duplicate built-ins per D-14/D-15/D-16."""
        builtin = ProjectTemplate.objects.filter(is_system=True).first()
        guest = User.objects.create_user(email="g5@example.com", username="g5")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.post(
            get_project_template_duplicate_url(workspace.slug, builtin.id),
            {"name": "Should Not Be Allowed"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_admin_duplicate_missing_builtin_returns_404(
        self, session_client, workspace, seeded_builtin_templates
    ):
        """An unknown source template returns 404 from the duplicate endpoint."""
        import uuid

        response = session_client.post(
            get_project_template_duplicate_url(workspace.slug, uuid.uuid4()),
            {"name": "Ghost Copy"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
