from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.mark.contract
class TestIssueLayoutFiltering:
    @pytest.mark.django_db
    def test_service_gateway_issues_are_exclusive_to_calendar_layout(
        self, session_client, workspace, create_user
    ):
        project = Project.objects.create(
            name="Calendar filtering",
            identifier="CAL",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)
        state = State.objects.create(
            name="Todo",
            color="#000000",
            group="unstarted",
            default=True,
            project=project,
        )

        regular_issue = Issue.objects.create(
            name="Regular work item",
            workspace=workspace,
            project=project,
            state=state,
        )
        event_issue = Issue.objects.create(
            name="Service Gateway event",
            workspace=workspace,
            project=project,
            state=state,
            sg_event_id=1234,
        )
        coaching_card = Issue.objects.create(
            name="Coaching card",
            workspace=workspace,
            project=project,
            state=state,
            category="Coaching Card",
            coaching_card_data={"kind": "coaching_card"},
        )

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"

        with patch("plane.app.views.issue.base.recent_visited_task.delay"):
            calendar_response = session_client.get(url, {"layout": "calendar", "cursor": "100:0:0"})
            list_response = session_client.get(url, {"layout": "list", "cursor": "100:0:0"})
            coaching_board_response = session_client.get(
                url,
                {
                    "layout": "kanban",
                    "coaching_cards": "true",
                    "group_by": "state_id",
                    "cursor": "100:0:0",
                },
            )

        assert calendar_response.status_code == status.HTTP_200_OK
        assert {str(issue["id"]) for issue in calendar_response.data["results"]} == {str(event_issue.id)}
        assert calendar_response.data["total_count"] == 1

        assert list_response.status_code == status.HTTP_200_OK
        assert {str(issue["id"]) for issue in list_response.data["results"]} == {
            str(regular_issue.id),
            str(coaching_card.id),
        }
        assert list_response.data["total_count"] == 2

        assert coaching_board_response.status_code == status.HTTP_200_OK
        coaching_card_results = [
            issue
            for group in coaching_board_response.data["results"].values()
            for issue in group["results"]
        ]
        assert {str(issue["id"]) for issue in coaching_card_results} == {str(coaching_card.id)}
        assert coaching_card_results[0]["roster_player_id"] is None
        assert coaching_card_results[0]["coaching_card_data"] == {"kind": "coaching_card"}
        assert coaching_board_response.data["total_count"] == 1
