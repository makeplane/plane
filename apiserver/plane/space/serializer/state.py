# Module imports
from .base import BaseSerializer
from plane.db.models import (
    State,
)


class StateSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]


class StateLiteSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = [
            "id",
            "name",
            "color",
            "group",
        ]
        read_only_fields = fields
