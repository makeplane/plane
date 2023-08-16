# Module imports
from .base import BaseSerializer
from .user import UserSerializer
from .project import ProjectLiteSerializer
from .workspace import WorkSpaceSerializer
from plane.db.models import Importer


class ImporterSerializer(BaseSerializer):
    initiated_by_detail = UserSerializer(
        source="initiated_by",
        fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
    )
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    workspace_detail = WorkSpaceSerializer(source="workspace", read_only=True)

    class Meta:
        model = Importer
        fields = "__all__"
