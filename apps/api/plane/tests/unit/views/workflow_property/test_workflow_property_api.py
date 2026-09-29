# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Smoke tests for the §14 / §17 admin API endpoints.

These tests exercise the URL routing + view + serializer wiring
together. They do not duplicate the type-aware validation tests in
``tests/unit/services/workflow_properties``; the goal here is to
prove the API surface matches the spec endpoints.
"""

# Third Party imports
import pytest
from rest_framework.test import APIClient

# Module imports
from plane.db.models import WorkspaceMember


@pytest.fixture
def auth_client(db, create_user, workspace):
    # ``workspace`` fixture already adds ``create_user`` as a
    # WorkspaceMember; just force-authenticate the test client.
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkspacePropertyAPI:
    def test_create_property(self, db, auth_client, workspace):
        response = auth_client.post(
            f"/api/workspaces/{workspace.slug}/properties/",
            {
                "name": "Priority",
                "property_type": "DROPDOWN",
                "config": {"choices": ["low", "high"]},
            },
            format="json",
        )
        assert response.status_code == 201, response.content
        body = response.json()
        assert body["name"] == "Priority"
        assert body["property_type"] == "DROPDOWN"

    def test_create_property_requires_choices_for_dropdown(
        self, db, auth_client, workspace
    ):
        response = auth_client.post(
            f"/api/workspaces/{workspace.slug}/properties/",
            {
                "name": "Priority",
                "property_type": "DROPDOWN",
                "config": {},
            },
            format="json",
        )
        assert response.status_code == 400, response.content

    def test_list_properties(self, db, auth_client, workspace, create_user):
        from plane.db.models import WorkspaceProperty

        WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        response = auth_client.get(
            f"/api/workspaces/{workspace.slug}/properties/"
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["name"] == "Priority"

    def test_patch_property_does_not_change_type(
        self, db, auth_client, workspace, create_user
    ):
        from plane.db.models import WorkspaceProperty

        prop = WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        response = auth_client.patch(
            f"/api/workspaces/{workspace.slug}/properties/{prop.id}/",
            {"property_type": "NUMBER", "name": "Priority2"},
            format="json",
        )
        # The type field is read-only on the update serializer, so it
        # is silently ignored rather than rejected — but the name
        # change still lands.
        assert response.status_code == 200, response.content
        prop.refresh_from_db()
        assert prop.property_type == "TEXT"
        assert prop.name == "Priority2"


@pytest.mark.unit
@pytest.mark.django_db
class TestIssuePropertyValueAPI:
    def test_bulk_write_persists_values(
        self, db, auth_client, wp_project, wp_state, wp_type,
        text_property, create_user
    ):
        from plane.db.models import Issue

        issue = Issue.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            state=wp_state,
            name="x",
            type_id=wp_type.id,
            created_by=create_user,
        )
        response = auth_client.post(
            f"/api/workspaces/{wp_project.workspace.slug}/projects/{wp_project.id}/issues/{issue.id}/property-values/bulk/",
            {
                "values": [
                    {
                        "property_id": str(text_property.id),
                        "value_json": "hello",
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == 200, response.content
        body = response.json()
        assert len(body) == 1
        assert body[0]["value_json"] == "hello"

    def test_bulk_write_rejects_type_mismatch(
        self, db, auth_client, wp_project, wp_state, wp_type,
        text_property, create_user
    ):
        from plane.db.models import Issue

        issue = Issue.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            state=wp_state,
            name="x",
            type_id=wp_type.id,
            created_by=create_user,
        )
        response = auth_client.post(
            f"/api/workspaces/{wp_project.workspace.slug}/projects/{wp_project.id}/issues/{issue.id}/property-values/bulk/",
            {
                "values": [
                    {
                        "property_id": str(text_property.id),
                        "value_json": {"not": "a string"},
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == 422, response.content
        assert response.json()["code"] == "WORKFLOW_PROPERTY_INVALID_VALUE"

    def test_payload_endpoint_returns_composite(
        self, db, auth_client, wp_project, wp_state, wp_type,
        dropdown_property, create_user
    ):
        from plane.db.models import Issue, IssueTypeProperty

        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            issue_type=wp_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
        )
        issue = Issue.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            state=wp_state,
            name="x",
            type_id=wp_type.id,
            created_by=create_user,
        )
        response = auth_client.get(
            f"/api/workspaces/{wp_project.workspace.slug}/projects/{wp_project.id}/issues/{issue.id}/property-payload/"
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["property_type"] == "DROPDOWN"
        assert body[0]["is_required"] is True
