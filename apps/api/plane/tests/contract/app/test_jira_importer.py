# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember


@pytest.fixture
def testcase_project(db, workspace, create_user):
    project = Project.objects.create(
        name="Jira Test Cases Project",
        identifier="JTC",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        workspace=workspace,
        role=20,
        is_active=True,
    )
    return project


def _jira_payload() -> dict:
    return {
        "metadata": {
            "cloud_hostname": "company.atlassian.net",
            "email": "user@example.com",
            "api_token": "token",
            "project_key": "PROJ",
        },
        "config": {
            "issue_type_name": "Test Case",
        },
        "data": {"users": [], "invite_users": False},
    }


@pytest.mark.contract
@pytest.mark.django_db
class TestJiraImporterCreateEndpoint:
    @patch("plane.app.views.importer.jira.jira_import_task.delay")
    @patch("plane.app.views.importer.jira.JiraApiClient.get_project")
    @patch("plane.app.views.importer.jira.JiraApiClient.test_connection")
    def test_create_queues_importer(
        self,
        mock_test_connection,
        mock_get_project,
        mock_delay,
        session_client,
        workspace,
        testcase_project,
    ):
        mock_test_connection.return_value = True
        mock_get_project.return_value = {"key": "PROJ"}

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{testcase_project.id}/importers/jira/",
            _jira_payload(),
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["service"] == "jira"
        assert response.data["metadata"]["api_token"] == "***"
        mock_delay.assert_called_once()

    @patch("plane.app.views.importer.jira.jira_import_task.delay")
    @patch("plane.app.views.importer.jira.JiraApiClient.test_connection")
    def test_create_requires_project_key(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        testcase_project,
    ):
        mock_test_connection.return_value = True
        payload = _jira_payload()
        payload["metadata"].pop("project_key")

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{testcase_project.id}/importers/jira/",
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "project_key" in response.data["error"]
        mock_delay.assert_not_called()

    @patch("plane.app.views.importer.jira.JiraApiClient.test_connection")
    def test_preview_requires_credentials(self, mock_test_connection, session_client, workspace):
        mock_test_connection.return_value = True

        response = session_client.get(f"/api/workspaces/{workspace.slug}/importers/jira/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "required" in response.data["error"]

    @patch("plane.app.views.importer.jira.JiraExtractor.extract_testcases")
    @patch("plane.app.views.importer.jira.JiraExtractor.preview_counts")
    @patch("plane.app.views.importer.jira.JiraApiClient.get_project")
    @patch("plane.app.views.importer.jira.JiraApiClient.test_connection")
    def test_preview_returns_counts(
        self,
        mock_test_connection,
        mock_get_project,
        mock_preview_counts,
        mock_extract,
        session_client,
        workspace,
    ):
        mock_test_connection.return_value = True
        mock_get_project.return_value = {"key": "PROJ"}
        mock_extract.return_value = {"testcases": [], "comments": [], "jql": 'project = "PROJ"'}
        mock_preview_counts.return_value = {
            "total_testcases": 2,
            "total_comments": 1,
            "total_labels": 3,
            "total_states": 1,
            "total_users": 1,
        }

        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/importers/jira/",
            {
                "cloud_hostname": "company.atlassian.net",
                "email": "user@example.com",
                "api_token": "token",
                "project_key": "PROJ",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_testcases"] == 2
        assert response.data["jql"] == 'project = "PROJ"'
