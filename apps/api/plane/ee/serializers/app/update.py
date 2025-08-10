from plane.ee.models import EntityUpdates, UpdateReaction
from plane.app.serializers import BaseSerializer

# Third party imports
from rest_framework import serializers


class UpdateReactionSerializer(BaseSerializer):
    class Meta:
        model = UpdateReaction
        fields = "__all__"
        read_only_fields = ["workspace", "project", "update", "actor", "deleted_at"]


class UpdatesSerializer(BaseSerializer):
    comments_count = serializers.IntegerField(read_only=True)
    update_reactions = UpdateReactionSerializer(many=True, read_only=True)
    status = serializers.CharField(required=False)
    project_name = serializers.CharField(
        source="project.name", read_only=True, default=""
    )
    epic_name = serializers.CharField(source="epic.name", read_only=True, default="")
    epic_sequence_id = serializers.CharField(
        source="epic.sequence_id", read_only=True, default=""
    )
    project_identifier = serializers.CharField(
        source="project.identifier", read_only=True, default=""
    )

    class Meta:
        model = EntityUpdates
        fields = "__all__"
        read_only_fields = ["workspace", "project", "cycle", "issue", "entity_type"]
