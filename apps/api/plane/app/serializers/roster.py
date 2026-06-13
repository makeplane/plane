# Python imports
from typing import Any

# Django imports
from django.db import transaction

# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import RosterPlayer, RosterPlayerStatus


class RosterPlayerSerializer(BaseSerializer):
    program_id = serializers.UUIDField(source="project_id", read_only=True)

    class Meta:
        model = RosterPlayer
        fields = [
            "id",
            "program_id",
            "player_name",
            "jersey_number",
            "position",
            "height",
            "weight",
            "class_year",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "program_id", "created_at", "updated_at"]

    def validate_status(self, value):
        if not value:
            return RosterPlayerStatus.ACTIVE
        return value

    def validate_player_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Player name is required.")
        return value.strip()

    def validate_jersey_number(self, value):
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate(self, attrs):
        project = self.context["project"]
        jersey_number = attrs.get("jersey_number")
        if jersey_number:
            queryset = RosterPlayer.objects.filter(project=project, jersey_number=jersey_number)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"jersey_number": "Jersey number must be unique within this program."}
                )
        return attrs

    def create(self, validated_data):
        project = self.context["project"]
        return RosterPlayer.objects.create(project=project, **validated_data)


class RosterPlayerImportSerializer(serializers.Serializer):
    players = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def _get_first_error_message(self, errors: Any) -> str:
        if isinstance(errors, dict):
            first_error = next(iter(errors.values()), "Please provide valid detail.")
            return self._get_first_error_message(first_error)
        if isinstance(errors, list):
            first_error = errors[0] if errors else "Please provide valid detail."
            return self._get_first_error_message(first_error)
        return str(errors)

    def validate_players(self, players):
        if not players:
            raise serializers.ValidationError("At least one player is required.")

        project = self.context["project"]
        validated_rows = []
        row_errors = []
        imported_jersey_numbers = {}

        for row_number, payload in enumerate(players, start=1):
            serializer = RosterPlayerSerializer(data=payload, context=self.context)
            if not serializer.is_valid():
                row_errors.append(f"Row {row_number}: {self._get_first_error_message(serializer.errors)}")
                continue

            validated_row = dict(serializer.validated_data)
            jersey_number = validated_row.get("jersey_number")

            if jersey_number:
                duplicate_row = imported_jersey_numbers.get(jersey_number)
                if duplicate_row:
                    row_errors.append(
                        f"Row {row_number}: Jersey number {jersey_number} is duplicated in the import file."
                    )
                    continue
                imported_jersey_numbers[jersey_number] = row_number

            validated_rows.append((row_number, validated_row))

        existing_jersey_numbers = set(
            RosterPlayer.objects.filter(
                project=project,
                jersey_number__in=list(imported_jersey_numbers.keys()),
            ).values_list("jersey_number", flat=True)
        )

        for row_number, validated_row in validated_rows:
            jersey_number = validated_row.get("jersey_number")
            if jersey_number and jersey_number in existing_jersey_numbers:
                row_errors.append(
                    f"Row {row_number}: Jersey number {jersey_number} already exists in this program."
                )

        if row_errors:
            raise serializers.ValidationError(row_errors)

        return [validated_row for _, validated_row in validated_rows]

    def create(self, validated_data):
        project = self.context["project"]
        players = []

        with transaction.atomic():
            for player_data in validated_data["players"]:
                players.append(RosterPlayer.objects.create(project=project, **player_data))

        return players
