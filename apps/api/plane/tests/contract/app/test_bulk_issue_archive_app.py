import pytest
from rest_framework import status

from plane.app.views.issue.archive import BULK_ISSUE_OPERATION_BATCH_SIZE
from plane.db.models import Issue, Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.license.models import Instance


def bulk_archive_url(workspace_slug, project_id):
    return f"/api/workspaces/{workspace_slug}/projects/{project_id}/bulk-archive-issues/"


@pytest.fixture
def member_user(db):
    return User.objects.create(
        email="bulk-member@plane.so", username="bulk-member", first_name="Bulk", last_name="Member"
    )


@pytest.fixture
def guest_user(db):
    return User.objects.create(email="bulk-guest@plane.so", username="bulk-guest", first_name="Bulk", last_name="Guest")


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Bulk Project", identifier="BP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def completed_state(db, workspace, project):
    return State.objects.create(name="Done", project=project, workspace=workspace, group="completed")


@pytest.fixture
def backlog_state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog")


def create_issue(workspace, project, state, name="Issue", created_by=None):
    return Issue.objects.create(name=name, workspace=workspace, project=project, state=state, created_by=created_by)


@pytest.mark.contract
class TestBulkIssueArchive:
    @pytest.mark.django_db
    def test_admin_can_archive_completed_issues(self, session_client, workspace, project, completed_state, create_user):
        issue_1 = create_issue(workspace, project, completed_state, "Issue 1", create_user)
        issue_2 = create_issue(workspace, project, completed_state, "Issue 2", create_user)
        untouched = create_issue(workspace, project, completed_state, "Untouched", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id),
            {"issue_ids": [str(issue_1.id), str(issue_2.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated"] == 2
        assert response.data["failed"] == 0
        issue_1.refresh_from_db()
        issue_2.refresh_from_db()
        untouched.refresh_from_db()
        assert issue_1.archived_at is not None
        assert issue_2.archived_at is not None
        assert untouched.archived_at is None

    @pytest.mark.django_db
    def test_member_can_archive_without_plan_gate(
        self, api_client, workspace, project, completed_state, member_user, create_user
    ):
        Instance.objects.update(edition="PLANE_COMMUNITY")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)
        issue = create_issue(workspace, project, completed_state, "Issue", create_user)
        api_client.force_authenticate(user=member_user)

        response = api_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": [str(issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.archived_at is not None

    @pytest.mark.django_db
    def test_empty_selection_is_rejected(self, session_client, workspace, project):
        response = session_client.post(bulk_archive_url(workspace.slug, project.id), {"issue_ids": []}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_malformed_issue_id_is_rejected(self, session_client, workspace, project):
        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": ["not-a-uuid"]}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_duplicate_ids_are_deduplicated(self, session_client, workspace, project, completed_state, create_user):
        issue = create_issue(workspace, project, completed_state, "Issue", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id), str(issue.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated"] == 1

    @pytest.mark.django_db
    def test_missing_issue_rejects_request(self, session_client, workspace, project, completed_state, create_user):
        other_issue = create_issue(workspace, project, completed_state, "Other", create_user)
        missing_id = "00000000-0000-0000-0000-000000000001"

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": [missing_id]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        other_issue.refresh_from_db()
        assert other_issue.archived_at is None

    @pytest.mark.django_db
    def test_guest_cannot_archive(self, api_client, workspace, project, completed_state, guest_user, create_user):
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5, is_active=True)
        ProjectMember.objects.create(project=project, member=guest_user, role=5, is_active=True)
        issue = create_issue(workspace, project, completed_state, "Issue", create_user)
        api_client.force_authenticate(user=guest_user)

        response = api_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": [str(issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        issue.refresh_from_db()
        assert issue.archived_at is None

    @pytest.mark.django_db
    def test_cross_workspace_issue_is_not_modified(
        self, session_client, workspace, project, completed_state, create_user
    ):
        other_workspace = Workspace.objects.create(name="Other Workspace", slug="other-workspace", owner=create_user)
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=other_workspace, created_by=create_user
        )
        other_state = State.objects.create(
            name="Done", project=other_project, workspace=other_workspace, group="completed"
        )
        other_issue = create_issue(other_workspace, other_project, other_state, "Other", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": [str(other_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        other_issue.refresh_from_db()
        assert other_issue.archived_at is None

    @pytest.mark.django_db
    def test_cross_project_issue_is_not_modified(
        self, session_client, workspace, project, completed_state, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=workspace, created_by=create_user
        )
        other_state = State.objects.create(
            name="Done", project=other_project, workspace=workspace, group="completed"
        )
        other_issue = create_issue(workspace, other_project, other_state, "Other", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": [str(other_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        other_issue.refresh_from_db()
        assert other_issue.archived_at is None

    @pytest.mark.django_db
    def test_mixed_workspace_ids_are_atomic_per_request(
        self, session_client, workspace, project, completed_state, create_user
    ):
        valid_issue = create_issue(workspace, project, completed_state, "Valid", create_user)
        other_workspace = Workspace.objects.create(name="Other Workspace", slug="other-workspace", owner=create_user)
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=other_workspace, created_by=create_user
        )
        other_state = State.objects.create(
            name="Done", project=other_project, workspace=other_workspace, group="completed"
        )
        other_issue = create_issue(other_workspace, other_project, other_state, "Other", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id),
            {"issue_ids": [str(valid_issue.id), str(other_issue.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        valid_issue.refresh_from_db()
        other_issue.refresh_from_db()
        assert valid_issue.archived_at is None
        assert other_issue.archived_at is None

    @pytest.mark.django_db
    def test_invalid_state_group_rejects_all_updates(
        self, session_client, workspace, project, completed_state, backlog_state, create_user
    ):
        valid_issue = create_issue(workspace, project, completed_state, "Valid", create_user)
        invalid_issue = create_issue(workspace, project, backlog_state, "Invalid", create_user)

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id),
            {"issue_ids": [str(valid_issue.id), str(invalid_issue.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        valid_issue.refresh_from_db()
        invalid_issue.refresh_from_db()
        assert valid_issue.archived_at is None
        assert invalid_issue.archived_at is None

    @pytest.mark.django_db
    def test_batch_limit_is_enforced(self, session_client, workspace, project):
        issue_ids = [f"00000000-0000-0000-0000-{index:012d}" for index in range(BULK_ISSUE_OPERATION_BATCH_SIZE + 1)]

        response = session_client.post(
            bulk_archive_url(workspace.slug, project.id), {"issue_ids": issue_ids}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
