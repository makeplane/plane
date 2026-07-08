# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    User,
    WorkspaceMember,
    Project,
    ProjectMember,
    IssueType,
    Issue,
    State,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
)
from plane.db.models.api import APIToken


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
    return f"/api/v1/workspaces/{slug}/projects/{pid}/work-item-types/{type_id}/properties/"


def _options_url(slug, pid, property_id):
    return f"/api/v1/workspaces/{slug}/projects/{pid}/properties/{property_id}/options/"


def _values_list_url(slug, pid, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{pid}/work-items/{issue_id}/property-values/"


def _values_set_url(slug, pid, issue_id, property_id):
    return f"/api/v1/workspaces/{slug}/projects/{pid}/work-items/{issue_id}/properties/{property_id}/values/"


@pytest.mark.contract
class TestIssuePropertyV1Definitions:
    @pytest.mark.django_db
    def test_create_property_success(self, api_key_client, workspace, project, issue_type):
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = api_key_client.post(url, {"display_name": "Sev", "property_type": "TEXT"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert IssueProperty.objects.count() == 1

    @pytest.mark.django_db
    def test_list_properties_paginated(self, api_key_client, workspace, project, issue_type):
        IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="A", property_type="TEXT"
        )
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 1

    @pytest.mark.django_db
    def test_member_cannot_create_property(self, workspace, project, issue_type, db):
        # A project MEMBER (not admin) must be rejected on definition mutations.
        member = User.objects.create(email="member@plane.so", username="member-prop", first_name="Member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
        ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
        token = APIToken.objects.create(user=member, label="member-token", token="member-token-123")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)
        url = _properties_url(workspace.slug, project.id, issue_type.id)
        response = client.post(url, {"display_name": "X", "property_type": "TEXT"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestIssuePropertyV1Options:
    @pytest.mark.django_db
    def test_create_option(self, api_key_client, workspace, project, issue_type):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Sev", property_type="OPTION"
        )
        url = _options_url(workspace.slug, project.id, prop.id)
        response = api_key_client.post(url, {"name": "High"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert IssuePropertyOption.objects.filter(property=prop).count() == 1


@pytest.mark.contract
class TestIssuePropertyV1Values:
    @pytest.mark.django_db
    def test_set_option_value_scoped(self, api_key_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Sev", property_type="OPTION"
        )
        option = IssuePropertyOption.objects.create(
            workspace=workspace, project=project, property=prop, name="High"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = api_key_client.post(set_url, {"values": str(option.id)}, format="json")
        assert response.status_code == status.HTTP_200_OK
        value = IssuePropertyValue.objects.get(issue=issue, property=prop)
        assert value.value_option_id == option.id

    @pytest.mark.django_db
    def test_set_option_from_other_property_rejected(self, api_key_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Sev", property_type="OPTION"
        )
        other_prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Imp", property_type="OPTION"
        )
        foreign_option = IssuePropertyOption.objects.create(
            workspace=workspace, project=project, property=other_prop, name="Low"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = api_key_client.post(set_url, {"values": str(foreign_option.id)}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_list_values_paginated(self, api_key_client, workspace, project, issue_type, issue):
        prop = IssueProperty.objects.create(
            workspace=workspace, project=project, issue_type=issue_type, display_name="Note", property_type="TEXT"
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        api_key_client.post(set_url, {"values": "hello"}, format="json")
        list_url = _values_list_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(list_url)
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 1

    @pytest.mark.django_db
    def test_relation_user_isolation(self, api_key_client, workspace, project, issue_type, issue):
        # A user who is not a project member cannot be referenced.
        outsider = User.objects.create(email="outsider@plane.so", username="outsider-prop", first_name="Out")
        prop = IssueProperty.objects.create(
            workspace=workspace,
            project=project,
            issue_type=issue_type,
            display_name="Owner",
            property_type="RELATION",
            relation_type="USER",
        )
        set_url = _values_set_url(workspace.slug, project.id, issue.id, prop.id)
        response = api_key_client.post(set_url, {"values": str(outsider.id)}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
