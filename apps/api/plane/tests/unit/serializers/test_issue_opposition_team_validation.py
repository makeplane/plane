import pytest

from plane.api.serializers.issue import IssueSerializer as APIIssueSerializer
from plane.app.serializers.issue import IssueCreateSerializer as AppIssueSerializer
from plane.db.models import Project, User, Workspace


@pytest.mark.unit
class TestIssueOppositionTeamValidation:
    @staticmethod
    def _create_project():
        user = User.objects.create(email="opposition-owner@example.com", first_name="Opposition", last_name="Owner")
        workspace = Workspace.objects.create(name="Opposition Workspace", slug="opposition-workspace", owner=user)
        project = Project.objects.create(
            name="Opposition Project",
            identifier="OPP",
            workspace=workspace,
            created_by=user,
            updated_by=user,
        )
        return workspace, project

    @staticmethod
    def _get_context(workspace, project):
        return {
            "workspace_id": workspace.id,
            "project_id": project.id,
            "default_assignee_id": None,
        }

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    def test_accepts_object_payload(self, db, serializer_class):
        workspace, project = self._create_project()
        serializer = serializer_class(
            data={
                "name": "Issue With Opposition",
                "opposition_team": {"name": "Nissan Stadium", "logo": "opposition-teams/nissan.png"},
            },
            context=self._get_context(workspace, project),
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["opposition_team"] == {
            "name": "Nissan Stadium",
            "logo": "opposition-teams/nissan.png",
        }

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    def test_accepts_legacy_json_string_payload(self, db, serializer_class):
        workspace, project = self._create_project()
        serializer = serializer_class(
            data={
                "name": "Issue With Legacy Opposition",
                "opposition_team": '{"name":"Nissan Stadium","logo":"opposition-teams/nissan.png","address":"ignored"}',
            },
            context=self._get_context(workspace, project),
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["opposition_team"] == {
            "name": "Nissan Stadium",
            "logo": "opposition-teams/nissan.png",
        }

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    def test_rejects_payload_without_name(self, db, serializer_class):
        workspace, project = self._create_project()
        serializer = serializer_class(
            data={
                "name": "Issue With Invalid Opposition",
                "opposition_team": {"logo": "opposition-teams/nissan.png"},
            },
            context=self._get_context(workspace, project),
        )

        assert not serializer.is_valid()
        assert serializer.errors["opposition_team"][0] == "Opposition team name is required."
