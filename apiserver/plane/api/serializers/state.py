# Module imports
from .base import BaseSerializer
from plane.db.models import State


class StateSerializer(BaseSerializer):
    def validate(self, data):
        # If the default is being provided then make all other states default False
        if data.get("default", False):
            State.objects.filter(
                project_id=self.context.get("project_id")
            ).update(default=False)
        return data

    class Meta:
        model = State
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "deleted_at",
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
