from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, RosterPlayer, State


def _clip(clip_id="clip-1"):
    return {
        "key": f"playlist-1:{clip_id}",
        "id": clip_id,
        "title": "Shot attempt",
        "thumbnail": "frame.jpg",
        "duration_seconds": 4.5,
        "timecode": "00:10-00:14.5",
        "team": "Home",
        "detail": "Three point",
        "result": "Made",
        "secondary_detail": "Left wing",
        "group": "Quarter 1",
    }


@pytest.mark.contract
class TestCoachingCardIssues:
    @pytest.mark.django_db
    def test_creates_one_existing_issue_per_player_and_replays_idempotently(
        self, session_client, workspace, create_user
    ):
        project = Project.objects.create(
            name="Basketball",
            identifier="BALL",
            workspace=workspace,
            sport="Basketball",
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        event_state = State.objects.create(
            name="Scheduled",
            color="#333333",
            group="unstarted",
            default=True,
            project=project,
        )
        source_issue = Issue.objects.create(
            name="Home vs Visitors",
            project=project,
            state=event_state,
            sg_event_id=441,
        )
        players = [
            RosterPlayer.objects.create(
                project=project,
                player_name="Jordan Ellis",
                jersey_number="12",
                position="Guard",
            ),
            RosterPlayer.objects.create(
                project=project,
                player_name="Taylor Reed",
                jersey_number="23",
                position="Forward",
            ),
        ]
        request_id = str(uuid4())
        payload = {
            "request_id": request_id,
            "source_issue_id": str(source_issue.id),
            "player_ids": [str(player.id) for player in players],
            "feedback": "Keep the shooting elbow aligned.",
            "progress_status": "Practice Player",
            "sport_label": "Basketball",
            "playlists": [{"id": "playlist-1", "name": "Shot selection", "clips": [_clip()]}],
        }
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/create-coaching-cards/"

        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["created_count"] == 2
        cards = list(Issue.objects.filter(project=project, category="Coaching Card").order_by("sequence_id"))
        assert len(cards) == 2
        assert {card.roster_player_id for card in cards} == {player.id for player in players}
        assert all(card.state.name == "New" for card in cards)
        assert all(card.parent_id == source_issue.id for card in cards)
        assert all(card.sg_event_id is None for card in cards)
        assert cards[0].coaching_card_data["request_id"] == request_id
        assert cards[0].coaching_card_data["playlists"][0]["clips"][0]["result"] == "Made"

        replay = session_client.post(url, payload, format="json")

        assert replay.status_code == status.HTTP_200_OK
        assert replay.json()["created_count"] == 0
        assert replay.json()["idempotent_replay"] is True
        assert Issue.objects.filter(project=project, category="Coaching Card").count() == 2

    @pytest.mark.django_db
    def test_rejects_roster_players_from_another_project(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Basketball", identifier="BALL", workspace=workspace, sport="Basketball")
        other_project = Project.objects.create(
            name="Football",
            identifier="FOOT",
            workspace=workspace,
            sport="Football",
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        state = State.objects.create(
            name="Scheduled",
            color="#333333",
            group="unstarted",
            default=True,
            project=project,
        )
        source_issue = Issue.objects.create(name="Game", project=project, state=state, sg_event_id=442)
        other_player = RosterPlayer.objects.create(project=other_project, player_name="Other Player")
        payload = {
            "request_id": str(uuid4()),
            "source_issue_id": str(source_issue.id),
            "player_ids": [str(other_player.id)],
            "feedback": "Feedback",
            "progress_status": "New Player",
            "sport_label": "Basketball",
            "playlists": [{"id": "playlist-1", "name": "Plays", "clips": [_clip()]}],
        }

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/create-coaching-cards/",
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "player_ids" in response.json()
        assert not Issue.objects.filter(project=project, category="Coaching Card").exists()
