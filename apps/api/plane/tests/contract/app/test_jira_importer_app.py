from unittest.mock import patch

import pytest
from rest_framework import status

from plane.bgtasks.jira_import_task import jira_import_task
from plane.db.models import APIToken, Importer, Issue, Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.license.models import Instance


JIRA_METADATA_URL = "/api/workspaces/{slug}/importers/jira"
JIRA_CREATE_URL = "/api/workspaces/{slug}/projects/importers/jira/"
IMPORTER_DELETE_URL = "/api/workspaces/{slug}/importers/{service}/{importer_id}/"


def create_project(workspace, user, name="Import Project", identifier="IMP"):
    project = Project.objects.create(name=name, identifier=identifier, workspace=workspace, created_by=user)
    ProjectMember.objects.create(project=project, workspace=workspace, member=user, role=20, is_active=True)
    State.objects.create(name="Backlog", project=project, workspace=workspace, group="backlog", default=True)
    return project


def jira_metadata(token="secret-token"):
    return {
        "cloud_hostname": "example.atlassian.net",
        "email": "admin@example.com",
        "api_token": token,
        "project_key": "IMP",
    }


def importer_payload(project, token="secret-token"):
    return {
        "metadata": jira_metadata(token),
        "config": {"epics_to_modules": False},
        "data": {"users": [], "invite_users": False},
        "project_id": str(project.id),
    }


class FakeJiraClient:
    def __init__(self, metadata):
        pass

    def get_project_summary(self):
        return {"issues": 1, "modules": 0, "labels": 1, "states": 1, "users": []}

    def iter_issues(self):
        yield {
            "key": "IMP-1",
            "fields": {
                "summary": "Imported work item",
                "description": {"content": [{"content": [{"text": "Imported <unsafe>"}]}]},
                "status": {"id": "todo", "name": "Todo"},
                "priority": {"name": "High"},
                "labels": ["backend"],
            },
        }


@pytest.mark.contract
class TestJiraImporterApp:
    @pytest.mark.django_db
    @patch("plane.app.views.importer.base.JiraClient", FakeJiraClient)
    def test_community_member_can_preview_jira_metadata_without_plan_gate(
        self, api_client, workspace, create_user
    ):
        Instance.objects.update(edition="PLANE_COMMUNITY")
        member_user = User.objects.create(email="jira-member@plane.so", username="jira-member")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        api_client.force_authenticate(user=member_user)

        response = api_client.post(JIRA_METADATA_URL.format(slug=workspace.slug), jira_metadata(), format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["issues"] == 1

    @pytest.mark.django_db
    def test_jira_preview_rejects_get_so_tokens_are_not_query_params(self, api_client, workspace, create_user):
        member_user = User.objects.create(email="jira-get@plane.so", username="jira-get")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        api_client.force_authenticate(user=member_user)

        response = api_client.get(JIRA_METADATA_URL.format(slug=workspace.slug), jira_metadata())

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    @pytest.mark.django_db
    @patch("plane.app.views.importer.base.jira_import_task.delay")
    @patch("plane.app.views.importer.base.JiraClient", FakeJiraClient)
    def test_create_jira_importer_redacts_token_and_enqueues_task(
        self, mock_delay, session_client, workspace, create_user
    ):
        project = create_project(workspace, create_user)

        response = session_client.post(
            JIRA_CREATE_URL.format(slug=workspace.slug), importer_payload(project), format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        importer = Importer.objects.get(id=response.data["id"])
        assert importer.status == "queued"
        assert importer.metadata == {
            "cloud_hostname": "example.atlassian.net",
            "email": "admin@example.com",
            "project_key": "IMP",
        }
        assert "secret-token" not in str(importer.metadata)
        assert APIToken.objects.filter(id=importer.token_id, is_service=True, workspace=workspace).exists()
        mock_delay.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.app.views.importer.base.jira_import_task.delay")
    @patch("plane.app.views.importer.base.JiraClient", FakeJiraClient)
    def test_cross_workspace_project_is_rejected(self, mock_delay, session_client, workspace, create_user):
        other_workspace = Workspace.objects.create(name="Other", slug="other", owner=create_user)
        other_project = create_project(other_workspace, create_user, name="Other", identifier="OTH")

        response = session_client.post(
            JIRA_CREATE_URL.format(slug=workspace.slug), importer_payload(other_project), format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Importer.objects.count() == 0
        mock_delay.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.app.views.importer.base.jira_import_task.delay")
    @patch("plane.app.views.importer.base.JiraClient", FakeJiraClient)
    def test_guest_cannot_create_importer(self, mock_delay, api_client, workspace, create_user):
        project = create_project(workspace, create_user)
        guest_user = User.objects.create(email="jira-guest@plane.so", username="jira-guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5, is_active=True)
        ProjectMember.objects.create(project=project, workspace=workspace, member=guest_user, role=5, is_active=True)
        api_client.force_authenticate(user=guest_user)

        response = api_client.post(
            JIRA_CREATE_URL.format(slug=workspace.slug), importer_payload(project), format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Importer.objects.count() == 0
        mock_delay.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.app.views.importer.base.jira_import_task.delay")
    @patch("plane.app.views.importer.base.JiraClient", FakeJiraClient)
    def test_delete_cancels_running_importer(self, _mock_delay, session_client, workspace, create_user):
        project = create_project(workspace, create_user)
        token = APIToken.objects.create(user=create_user, workspace=workspace, is_service=True)
        importer = Importer.objects.create(
            service="jira",
            status="processing",
            initiated_by=create_user,
            workspace=workspace,
            project=project,
            token=token,
        )

        response = session_client.delete(
            IMPORTER_DELETE_URL.format(slug=workspace.slug, service="jira", importer_id=importer.id)
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        importer.refresh_from_db()
        assert importer.status == "cancelled"

    @pytest.mark.django_db
    @patch("plane.bgtasks.jira_import_task.JiraClient", FakeJiraClient)
    def test_jira_import_task_is_idempotent_by_external_id(self, workspace, create_user):
        project = create_project(workspace, create_user)
        token = APIToken.objects.create(user=create_user, workspace=workspace, is_service=True)
        importer = Importer.objects.create(
            service="jira",
            status="queued",
            initiated_by=create_user,
            workspace=workspace,
            project=project,
            token=token,
        )

        jira_import_task(str(importer.id), jira_metadata())
        importer.status = "queued"
        importer.save(update_fields=["status"])
        jira_import_task(str(importer.id), jira_metadata())

        assert Issue.objects.filter(project=project, external_source="jira", external_id="IMP-1").count() == 1
        issue = Issue.objects.get(project=project, external_source="jira", external_id="IMP-1")
        assert issue.priority == "high"
        assert "&lt;unsafe&gt;" in issue.description_html
        importer.refresh_from_db()
        assert importer.status == "completed"
        assert importer.imported_data["updated"] == 1

    @pytest.mark.django_db
    def test_list_returns_all_importer_services(self, session_client, workspace, create_user):
        project = create_project(workspace, create_user)
        token = APIToken.objects.create(user=create_user, workspace=workspace, is_service=True)
        Importer.objects.create(
            service="jira",
            status="completed",
            initiated_by=create_user,
            workspace=workspace,
            project=project,
            token=token,
            metadata={"project_key": "IMP"},
        )
        Importer.objects.create(
            service="github",
            status="failed",
            initiated_by=create_user,
            workspace=workspace,
            project=project,
            token=token,
            metadata={"name": "example-repo"},
        )

        response = session_client.get(f"/api/workspaces/{workspace.slug}/importers/")

        assert response.status_code == status.HTTP_200_OK
        services = {item["service"] for item in response.data}
        assert services == {"jira", "github"}
        assert all("api_token" not in str(item.get("metadata", {})) for item in response.data)
