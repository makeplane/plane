# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    User,
    Project,
    ProjectMember,
    IssueType,
    Issue,
    State,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue_type(db, workspace, project):
    return IssueType.objects.create(workspace=workspace, name="Task")


@pytest.fixture
def issue(db, workspace, project, issue_type, create_user):
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        type=issue_type,
        created_by=create_user,
    )


def _properties_url(slug, pid, type_id):
    return f"/api/workspaces/{slug}/projects/{pid}/issue-types/{type_id}/properties/"


def _property_detail_url(slug, pid, type_id, property_id):
    return f"/api/workspaces/{slug}/projects/{pid}/issue-types/{type_id}/properties/{property_id}/"


def _options_url(slug, pid, property_id):
    return f"/api/workspaces/{slug}/projects/{pid}/properties/{property_id}/options/"


def _values_get_url(slug, pid, issue_id):
    return f"/api/workspaces/{slug}/projects/{pid}/issues/{issue_id}/property-values/"


def _values_set_url(slug, pid, issue_id, property_id):
    return f"/api/workspaces/{slug}/projects/{pid}/issues/{issue_id}/properties/{property_id}/values/"


@pytest.mark.contract
class TestIssuePropertyDefinitions:
    @pytest.mark.django_db
    def test_create_property_success(self, session_client, workspace, project, issue_type):
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        payload = {"display_name": "Severity", "property_type": "TEXT"}
        response = session_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert IssueProperty.objects.count() == 1
        prop = IssueProperty.objects.first()
        assert prop.project_id == project.id
        assert prop.issue_type_id == issue_type.id
        assert prop.workspace_id == workspace.id

    @pytest.mark.django_db
    def test_create_property_unsupported_type(self, session_client, workspace, project, issue_type):
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = session_client.post(
            url, {"display_name": "F", "property_type": "FORMULA"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_relation_requires_relation_type(self, session_client, workspace, project, issue_type):
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = session_client.post(
            url, {"display_name": "Owner", "property_type": "RELATION"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_list_properties(self, session_client, workspace, project, issue_type):
        IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="A", property_type="TEXT"
        )
        IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="B", property_type="TEXT"
        )
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    @pytest.mark.django_db
    def test_update_and_delete_property(self, session_client, workspace, project, issue_type):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="A", property_type="TEXT"
        )
        detail = _property_detail_url(workspace.slug, project.id, issue_type.id, prop.id)
        response = session_client.patch(detail, {"display_name": "Renamed"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        prop.refresh_from_db()
        assert prop.display_name == "Renamed"

        response = session_client.delete(detail)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueProperty.objects.filter(id=prop.id).exists()

    @pytest.mark.django_db
    def test_create_property_type_from_other_workspace_rejected(
        self, session_client, workspace, project, create_user
    ):
        # A type that belongs to a different workspace must not be usable.
        from plane.db.models import Workspace

        other_ws = Workspace.objects.create(name="Other", owner=create_user, slug="other-ws")
        foreign_type = IssueType.objects.create(workspace=other_ws, name="Foreign")
        url = _properties_url(workspace.slug, project.id, foreign_type.id)
        response = session_client.post(url, {"display_name": "X", "property_type": "TEXT"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_guest_cannot_create_property(self, workspace, project, issue_type):
        guest = User.objects.create(email="guest@plane.so", username="guest-prop", first_name="Guest")
        ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)
        from plane.db.models import WorkspaceMember

        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = client.post(url, {"display_name": "X", "property_type": "TEXT"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestIssuePropertyOptions:
    @pytest.mark.django_db
    def test_create_option_success(self, session_client, workspace, project, issue_type):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Sev", property_type="OPTION"
        )
        url = _options_url(workspace.slug, project.id, prop.id)
        response = session_client.post(url, {"name": "High"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert IssuePropertyOption.objects.filter(property=prop, name="High").exists()

    @pytest.mark.django_db
    def test_option_on_non_option_property_rejected(self, session_client, workspace, project, issue_type):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="T", property_type="TEXT"
        )
        url = _options_url(workspace.slug, project.id, prop.id)
        response = session_client.post(url, {"name": "High"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_option_property_from_other_project_rejected(
        self, session_client, workspace, project, issue_type, create_user
    ):
        # Property owned by a different project must not be reachable under this project.
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_prop = IssueProperty.objects.create(
            workspace=workspace, project=other_project, issue_type=issue_type, display_name="F", property_type="OPTION"
        )
        url = _options_url(workspace.slug, project.id, foreign_prop.id)
        response = session_client.post(url, {"name": "High"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestIssuePropertyValues:
    @pytest.mark.django_db
    def test_set_and_get_text_value(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Note", property_type="TEXT"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = session_client.post(set_url, {"values": "hello"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert IssuePropertyValue.objects.filter(issue=issue, property=prop).count() == 1

        get_url = _values_get_url(workspace.slug, project.id, issue.id)
        response = session_client.get(get_url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["value_text"] == "hello"

    @pytest.mark.django_db
    def test_set_value_replaces_previous(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Note", property_type="TEXT"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        session_client.post(set_url, {"values": "first"}, format="json")
        session_client.post(set_url, {"values": "second"}, format="json")
        active = IssuePropertyValue.objects.filter(issue=issue, property=prop)
        assert active.count() == 1
        assert active.first().value_text == "second"

    @pytest.mark.django_db
    def test_set_decimal_invalid(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="N", property_type="DECIMAL"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = session_client.post(set_url, {"values": "abc"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_set_multi_value(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace,
            project=project,
            issue_type=issue_type,
            display_name="Tags",
            property_type="TEXT",
            is_multi=True,
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = session_client.post(set_url, {"values": ["a", "b", "c"]}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert IssuePropertyValue.objects.filter(issue=issue, property=prop).count() == 3

    @pytest.mark.django_db
    def test_required_value_enforced(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace,
            project=project,
            issue_type=issue_type,
            display_name="Req",
            property_type="TEXT",
            is_required=True,
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = session_client.post(set_url, {"values": None}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_value_soft_removes(self, session_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Note", property_type="TEXT"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        session_client.post(set_url, {"values": "hello"}, format="json")
        response = session_client.delete(set_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert IssuePropertyValue.objects.filter(issue=issue, property=prop).count() == 0
        # Soft-deleted row still present in all_objects.
        assert IssuePropertyValue.all_objects.filter(issue=issue, property=prop).count() == 1

    @pytest.mark.django_db
    def test_property_from_other_project_rejected_on_value_set(
        self, session_client, workspace, project, issue_type, issue, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project", identifier="OP2", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_prop = IssueProperty.objects.create(
            workspace=workspace, project=other_project, issue_type=issue_type, display_name="F", property_type="TEXT"
        )
        # Setting a value for a property that belongs to another project must 404.
        set_url = _values_set_url(workspace.slug, project.id, issue.id, foreign_prop.id)
        response = session_client.post(set_url, {"values": "x"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
