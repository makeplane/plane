# Module imports
from .base import BaseSerializer
from .user import UserSerializer
from .project import ProjectSerializer
from .workspace import WorkSpaceSerializer
from plane.db.models import Importer


class ImporterSerializer(BaseSerializer):
    initiated_by_detail = UserSerializer(source="initiated_by",read_only=True)
    project_detail = ProjectSerializer(source="project", fields=("id","name","cover_image","icon_prop","emoji","description"), read_only=True)
    workspace_detail = WorkSpaceSerializer(source="workspace", read_only=True)

    class Meta:
        model = Importer
        fields = "__all__"
