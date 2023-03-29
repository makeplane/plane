# Module imports
from .base import BaseSerializer
from .workspace import WorkspaceLiteSerializer
from .project import ProjectLiteSerializer

from plane.db.models import State


class StateSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

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
