import uuid

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, RosterPlayer


class TestRosterBase:
    def get_roster_url(self, workspace_slug: str, project_id: uuid.UUID, player_id: uuid.UUID | None = None) -> str:
        base_url = f"/api/workspaces/{workspace_slug}/projects/{project_id}/roster/"
        if player_id:
            return f"{base_url}{player_id}/"
        return base_url

    def get_roster_import_url(self, workspace_slug: str, project_id: uuid.UUID) -> str:
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/roster/import/"


@pytest.mark.contract
class TestRosterAPI(TestRosterBase):
    @pytest.mark.django_db
    def test_create_player_successfully(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.post(
            self.get_roster_url(workspace.slug, project.id),
            {
                "player_name": "J. Brandon",
                "jersey_number": "17",
                "position": "QB",
                "status": "active",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert RosterPlayer.objects.filter(project=project, player_name="J. Brandon").exists()
        assert response.json()["program_id"] == str(project.id)

    @pytest.mark.django_db
    def test_fetch_roster_by_program(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        other_project = Project.objects.create(name="Other Project", identifier="OP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        RosterPlayer.objects.create(project=project, player_name="A Player", jersey_number="10", status="active")
        RosterPlayer.objects.create(project=other_project, player_name="B Player", jersey_number="11", status="active")

        response = session_client.get(self.get_roster_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["player_name"] == "A Player"

    @pytest.mark.django_db
    def test_update_player_successfully(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        player = RosterPlayer.objects.create(project=project, player_name="A Player", jersey_number="10", status="active")

        response = session_client.patch(
            self.get_roster_url(workspace.slug, project.id, player.id),
            {"status": "injured", "notes": "Week-to-week"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        player.refresh_from_db()
        assert player.status == "injured"
        assert player.notes == "Week-to-week"

    @pytest.mark.django_db
    def test_delete_player_successfully(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        player = RosterPlayer.objects.create(project=project, player_name="A Player", jersey_number="10", status="active")

        response = session_client.delete(self.get_roster_url(workspace.slug, project.id, player.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True
        assert not RosterPlayer.objects.filter(pk=player.id).exists()

    @pytest.mark.django_db
    def test_duplicate_jersey_number_validation(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        RosterPlayer.objects.create(project=project, player_name="A Player", jersey_number="10", status="active")

        response = session_client.post(
            self.get_roster_url(workspace.slug, project.id),
            {"player_name": "B Player", "jersey_number": "10", "status": "active"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "jersey_number" in response.json()

    @pytest.mark.django_db
    def test_cannot_access_player_from_another_program(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        other_project = Project.objects.create(name="Other Project", identifier="OP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        player = RosterPlayer.objects.create(project=other_project, player_name="Hidden Player", jersey_number="99")

        response = session_client.get(self.get_roster_url(workspace.slug, project.id, player.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_empty_roster_response(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.get(self.get_roster_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.django_db
    def test_invalid_status_validation(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.post(
            self.get_roster_url(workspace.slug, project.id),
            {"player_name": "A Player", "status": "unknown-status"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "status" in response.json()

    @pytest.mark.django_db
    def test_import_roster_successfully(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.post(
            self.get_roster_import_url(workspace.slug, project.id),
            {
                "players": [
                    {"player_name": "J. Brandon", "jersey_number": "17", "position": "QB", "status": "active"},
                    {"player_name": "A. Broome", "jersey_number": "20", "position": "RB", "status": "injured"},
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["success"] is True
        assert response.json()["imported_count"] == 2
        assert RosterPlayer.objects.filter(project=project).count() == 2

    @pytest.mark.django_db
    def test_import_roster_rejects_duplicate_jersey_numbers(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Roster Project", identifier="RP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.post(
            self.get_roster_import_url(workspace.slug, project.id),
            {
                "players": [
                    {"player_name": "J. Brandon", "jersey_number": "17", "position": "QB", "status": "active"},
                    {"player_name": "T. Castellanos", "jersey_number": "17", "position": "QB", "status": "active"},
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "players" in response.json()
        assert RosterPlayer.objects.filter(project=project).count() == 0
