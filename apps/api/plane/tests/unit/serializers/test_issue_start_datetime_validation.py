from datetime import datetime, date

import pytest
from freezegun import freeze_time
from django.utils import timezone

from plane.api.serializers.issue import IssueSerializer as APIIssueSerializer
from plane.app.serializers.issue import IssueCreateSerializer as AppIssueSerializer
from plane.db.models import Issue, Project, User, Workspace


ERROR_MESSAGE = "Event date and time cannot be earlier than the current time."


@pytest.mark.unit
class TestIssueStartDateTimeValidation:
    @staticmethod
    def _create_project():
        user = User.objects.create(email="event-owner@example.com", first_name="Event", last_name="Owner")
        workspace = Workspace.objects.create(name="Test Workspace", slug="event-workspace", owner=user)
        project = Project.objects.create(
            name="Test Project",
            identifier="TST",
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
    @freeze_time("2026-03-23 04:30:00")
    def test_create_rejects_past_start_datetime(self, db, serializer_class):
        workspace, project = self._create_project()

        with timezone.override("Asia/Kolkata"):
            serializer = serializer_class(
                data={
                    "name": "Past Event",
                    "start_date": "2026-03-23",
                    "start_time": "2026-03-23T03:45:00Z",
                },
                context=self._get_context(workspace, project),
            )

            assert not serializer.is_valid()
            assert serializer.errors["start_time"][0] == ERROR_MESSAGE

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    @freeze_time("2026-03-23 04:30:00")
    def test_create_allows_future_start_datetime(self, db, serializer_class):
        workspace, project = self._create_project()

        with timezone.override("Asia/Kolkata"):
            serializer = serializer_class(
                data={
                    "name": "Future Event",
                    "start_date": "2026-03-23",
                    "start_time": "2026-03-23T05:00:00Z",
                },
                context=self._get_context(workspace, project),
            )

            assert serializer.is_valid(), serializer.errors

    @pytest.mark.parametrize("serializer_class", [APIIssueSerializer, AppIssueSerializer])
    @freeze_time("2026-03-23 04:30:00")
    def test_partial_update_without_datetime_change_is_allowed(self, db, serializer_class):
        workspace, project = self._create_project()
        issue = Issue.objects.create(
            name="Existing Event",
            project=project,
            start_date=date(2026, 3, 23),
            start_time=datetime.fromisoformat("2026-03-23T03:45:00+00:00"),
        )

        with timezone.override("Asia/Kolkata"):
            serializer = serializer_class(
                instance=issue,
                data={"name": "Renamed Event"},
                partial=True,
                context=self._get_context(workspace, project),
            )

            assert serializer.is_valid(), serializer.errors
