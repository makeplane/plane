import pytest

from plane.api.serializers.issue import IssueSerializer as APIIssueSerializer
from plane.app.serializers.issue import IssueCreateSerializer as AppIssueSerializer
from plane.db.models import Project, User, Workspace


@pytest.mark.unit
class TestIssueInheritsProjectSport:
    @staticmethod
    def _create_project(sport: str | None = "Cricket"):
        user = User.objects.create(email="sport-owner@example.com", first_name="Sport", last_name="Owner")
        workspace = Workspace.objects.create(name="Sport Workspace", slug="sport-workspace", owner=user)
        project = Project.objects.create(
            name="Sport Project",
            identifier="SPRT",
            workspace=workspace,
            sport=sport,
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
    def test_create_uses_project_sport(self, db, serializer_class):
        workspace, project = self._create_project("Cricket")
        serializer = serializer_class(
            data={
                "name": "Inherited Sport Issue",
                "sport": "Football",
            },
            context=self._get_context(workspace, project),
        )

        assert serializer.is_valid(), serializer.errors

        issue = serializer.save()

        assert issue.sport == "Cricket"

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    def test_create_preserves_explicit_sport_when_project_has_none(self, db, serializer_class):
        workspace, project = self._create_project(None)
        serializer = serializer_class(
            data={
                "name": "Fallback Sport Issue",
                "sport": "Football",
            },
            context=self._get_context(workspace, project),
        )

        assert serializer.is_valid(), serializer.errors

        issue = serializer.save()

        assert issue.sport == "Football"
