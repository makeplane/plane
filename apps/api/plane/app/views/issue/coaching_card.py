from html import escape

from django.db import transaction
from django.db.models import Min
from rest_framework import serializers, status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Issue, Project, RosterPlayer, State
from plane.utils.coaching_card import COACHING_CARD_CATEGORY, COACHING_CARD_KIND

from .. import BaseAPIView


class CoachingCardClipSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=512)
    id = serializers.CharField(max_length=255)
    title = serializers.CharField(max_length=255)
    thumbnail = serializers.CharField(max_length=2048, allow_blank=True, allow_null=True, required=False)
    duration_seconds = serializers.FloatField(min_value=0, allow_null=True, required=False)
    timecode = serializers.CharField(max_length=100, allow_blank=True, required=False)
    team = serializers.CharField(max_length=100, allow_blank=True, required=False)
    detail = serializers.CharField(max_length=255, allow_blank=True, required=False)
    result = serializers.CharField(max_length=255, allow_blank=True, required=False)
    secondary_detail = serializers.CharField(max_length=255, allow_blank=True, required=False)
    group = serializers.CharField(max_length=255, allow_blank=True, required=False)


class CoachingCardPlaylistSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    clips = CoachingCardClipSerializer(many=True, allow_empty=False, max_length=500)


class CoachingCardBulkCreateSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()
    source_issue_id = serializers.UUIDField()
    player_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        max_length=50,
    )
    feedback = serializers.CharField(max_length=5000, allow_blank=True, required=False, default="")
    progress_status = serializers.ChoiceField(choices=("New Player", "Practice Player", "In-Progress", "Improvement"))
    sport_label = serializers.CharField(max_length=100, allow_blank=True, required=False, default="")
    playlists = CoachingCardPlaylistSerializer(many=True, allow_empty=False, max_length=25)

    def validate_player_ids(self, player_ids):
        if len(player_ids) != len(set(player_ids)):
            raise serializers.ValidationError("Each player can only receive one card per request.")
        return player_ids


def _get_or_create_new_state(project):
    state = State.objects.filter(project=project, name__iexact="New").first()
    if state:
        return state

    first_sequence = (
        State.objects.filter(project=project, is_triage=False).aggregate(first=Min("sequence"))["first"] or 15000
    )
    state = State.objects.create(
        project=project,
        name="New",
        color="#60646C",
        group="backlog",
        default=False,
    )
    state.sequence = first_sequence - 15000
    State.objects.filter(pk=state.pk).update(sequence=state.sequence)
    return state


def _card_response(card):
    return {
        "id": card.id,
        "name": card.name,
        "sequence_id": card.sequence_id,
        "project_id": card.project_id,
        "state_id": card.state_id,
        "parent_id": card.parent_id,
        "category": card.category,
        "roster_player_id": card.roster_player_id,
        "coaching_card_data": card.coaching_card_data,
    }


class CoachingCardBulkCreateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @transaction.atomic
    def post(self, request, slug, project_id):
        serializer = CoachingCardBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        project = Project.objects.select_for_update().get(pk=project_id, workspace__slug=slug)
        request_id = str(payload["request_id"])
        existing_cards = list(
            Issue.issue_objects.filter(
                project=project,
                category=COACHING_CARD_CATEGORY,
                coaching_card_data__request_id=request_id,
            ).order_by("sequence_id")
        )
        if existing_cards:
            return Response(
                {
                    "created_count": 0,
                    "idempotent_replay": True,
                    "cards": [_card_response(card) for card in existing_cards],
                },
                status=status.HTTP_200_OK,
            )

        source_issue = Issue.issue_objects.filter(project=project, pk=payload["source_issue_id"]).first()
        if source_issue is None:
            return Response(
                {"source_issue_id": ["The source event does not exist in this program."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        players_by_id = {
            player.id: player for player in RosterPlayer.objects.filter(project=project, id__in=payload["player_ids"])
        }
        missing_player_ids = [player_id for player_id in payload["player_ids"] if player_id not in players_by_id]
        if missing_player_ids:
            return Response(
                {"player_ids": ["One or more selected players do not belong to this program."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state = _get_or_create_new_state(project)
        playlists = payload["playlists"]
        first_clip = playlists[0]["clips"][0]
        clip_count = sum(len(playlist["clips"]) for playlist in playlists)
        feedback = payload["feedback"].strip()
        description_html = f"<p>{escape(feedback)}</p>" if feedback else "<p></p>"
        cards = []

        for player_id in payload["player_ids"]:
            player = players_by_id[player_id]
            jersey_number = (player.jersey_number or "").strip().lstrip("#")
            player_label = f"#{jersey_number} {player.player_name}" if jersey_number else player.player_name
            card_name = f"Coaching card - {player_label} - {first_clip['title']}"[:255]
            player_snapshot = {
                "id": str(player.id),
                "name": player.player_name,
                "jersey_number": player.jersey_number or "",
                "position": player.position or "",
            }
            card_data = {
                "schema_version": 1,
                "kind": COACHING_CARD_KIND,
                "request_id": request_id,
                "source_issue": {
                    "id": str(source_issue.id),
                    "name": source_issue.name,
                    "sequence_id": source_issue.sequence_id,
                    "sg_event_id": source_issue.sg_event_id,
                },
                "player": player_snapshot,
                "sport": payload["sport_label"] or project.sport or source_issue.sport or "",
                "feedback": feedback,
                "progress_status": payload["progress_status"],
                "playlists": playlists,
                "summary": {
                    "playlist_count": len(playlists),
                    "clip_count": clip_count,
                    "primary_thumbnail": first_clip.get("thumbnail"),
                    "primary_clip_title": first_clip["title"],
                },
            }
            cards.append(
                Issue.objects.create(
                    project=project,
                    parent=source_issue,
                    state=state,
                    name=card_name,
                    description_html=description_html,
                    category=COACHING_CARD_CATEGORY,
                    roster_player=player,
                    coaching_card_data=card_data,
                )
            )

        return Response(
            {
                "created_count": len(cards),
                "idempotent_replay": False,
                "cards": [_card_response(card) for card in cards],
            },
            status=status.HTTP_201_CREATED,
        )
