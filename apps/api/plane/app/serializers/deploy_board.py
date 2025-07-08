# Module imports
from .base import BaseSerializer
from plane.app.serializers.project import ProjectLiteSerializer
from plane.app.serializers.workspace import WorkspaceLiteSerializer
from plane.db.models import DeployBoard


class DeployBoardSerializer(BaseSerializer):
    project_details = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = DeployBoard
        fields = "__all__"
        read_only_fields = ["workspace", "project", "anchor"]
