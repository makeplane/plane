# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .project import ProjectLiteSerializer
from .workspace import WorkspaceLiteSerializer
from plane.db.models import Importer


class ImporterSerializer(BaseSerializer):
    initiated_by_detail = UserLiteSerializer(
        source="initiated_by", read_only=True
    )
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    workspace_detail = WorkspaceLiteSerializer(
        source="workspace", read_only=True
    )

    class Meta:
        model = Importer
        fields = "__all__"
