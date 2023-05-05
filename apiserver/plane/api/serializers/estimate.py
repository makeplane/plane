# Module imports
from .base import BaseSerializer

from plane.db.models import Estimate, EstimatePoint
from plane.api.serializers import WorkspaceLiteSerializer, ProjectLiteSerializer


class EstimateSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

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


class EstimateReadSerializer(BaseSerializer):
    points = EstimatePointSerializer(read_only=True, many=True)
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = [
            "points",
            "name",
            "description",
        ]
