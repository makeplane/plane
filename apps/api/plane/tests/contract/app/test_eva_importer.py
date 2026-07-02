# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember


@pytest.fixture
def tasks_project(db, workspace, create_user):
    project = Project.objects.create(
        name="Tasks Project",
        identifier="TASK",
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


@pytest.fixture
def testcase_project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Cases Project",
        identifier="TC",
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


def _eva_payload(
    *,
    testcase_project_id: str | None = None,
    import_tasks: bool = True,
    import_testcases: bool = True,
) -> dict:
    config = {
        "lists_as_cycles": True,
        "fix_versions_as_modules": True,
        "import_tasks": import_tasks,
        "import_testcases": import_testcases,
    }
    if testcase_project_id is not None:
        config["testcase_project_id"] = testcase_project_id
    return {
        "metadata": {
            "url": "https://eva.example.com",
            "token": "token",
            "eva_project_id": str(uuid4()),
        },
        "config": config,
        "data": {"users": [], "invite_users": False},
    }


@pytest.mark.contract
@pytest.mark.django_db
class TestEvaImporterCreateEndpoint:
    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_requires_testcase_project_when_importing_both_scopes(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        tasks_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{tasks_project.id}/importers/eva/",
            _eva_payload(import_tasks=True, import_testcases=True),
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "testcase_project_id is required" in response.data["error"]
        mock_delay.assert_not_called()

    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_rejects_same_tasks_and_testcase_project(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        tasks_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{tasks_project.id}/importers/eva/",
            _eva_payload(testcase_project_id=str(tasks_project.id)),
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "must differ" in response.data["error"]
        mock_delay.assert_not_called()

    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_persists_testcase_project_id(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        tasks_project,
        testcase_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{tasks_project.id}/importers/eva/",
            _eva_payload(testcase_project_id=str(testcase_project.id)),
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["config"]["testcase_project_id"] == str(testcase_project.id)
        mock_delay.assert_called_once()

    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_allows_tasks_only_without_testcase_project(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        tasks_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{tasks_project.id}/importers/eva/",
            _eva_payload(import_tasks=True, import_testcases=False),
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["config"]["import_tasks"] is True
        assert response.data["config"]["import_testcases"] is False
        mock_delay.assert_called_once()

    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_allows_testcases_only_without_testcase_project_id(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        testcase_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{testcase_project.id}/importers/eva/",
            _eva_payload(import_tasks=False, import_testcases=True),
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["config"]["import_testcases"] is True
        mock_delay.assert_called_once()

    @patch("plane.app.views.importer.eva.eva_import_task.delay")
    @patch("plane.app.views.importer.eva.EvaApiClient.test_connection")
    def test_create_rejects_empty_import_scope(
        self,
        mock_test_connection,
        mock_delay,
        session_client,
        workspace,
        tasks_project,
    ):
        mock_test_connection.return_value = None

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{tasks_project.id}/importers/eva/",
            _eva_payload(import_tasks=False, import_testcases=False),
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "At least one" in response.data["error"]
        mock_delay.assert_not_called()
