# Module imports
from .base import BaseSerializer

from plane.db.models import Estimate, EstimatePoint
from plane.api.serializers import WorkSpaceSerializer, ProjectSerializer


class EstimateSerializer(BaseSerializer):
    workspace_detail = WorkSpaceSerializer(source="workspace", read_only=True)
    project_detail = ProjectSerializer(read_only=True, source="project")

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]


class EstimatePointSerializer(BaseSerializer):
    class Meta:
        model = EstimatePoint
        fields = "__all__"
        read_only_fields = [
            "estimate",
            "workspace",
            "project",
        ]
