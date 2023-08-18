# Module imports
from .base import BaseSerializer
from .workspace import WorkSpaceSerializer
from .project import ProjectSerializer

from plane.db.models import State


class StateSerializer(BaseSerializer):
    workspace_detail = WorkSpaceSerializer(
        source="workspace",
        fields=("id", "name", "slug"),
        read_only=True,
    ) 
    project_detail = ProjectSerializer(source="project", fields=("id", "name", "cover_image", "icon_prop", "emoji", "description"), read_only=True)

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
