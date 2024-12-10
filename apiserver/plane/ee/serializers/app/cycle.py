from plane.ee.models import EntityUpdates, UpdateReaction
from plane.app.serializers import BaseSerializer

# Third party imports
from rest_framework import serializers


class UpdateReactionSerializer(BaseSerializer):
    class Meta:
        model = UpdateReaction
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "update",
            "actor",
        ]


class UpdatesSerializer(BaseSerializer):
    comments_count = serializers.IntegerField(read_only=True)
    update_reactions = UpdateReactionSerializer(many=True, read_only=True)

    class Meta:
        model = EntityUpdates
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "cycle",
            "issue",
            "status"
        ]

