# Module imports
from .base import BaseSerializer

from plane.db.models import Estimate, EstimatePoint
from plane.api.serializers import WorkSpaceSerializer, ProjectSerializer


class EstimateSerializer(BaseSerializer):
    workspace_detail = WorkSpaceSerializer(
        source="workspace",
        fields=("id", "name", "slug"),
        read_only=True,
    ) 
    project_detail = ProjectSerializer(read_only=True, source="project", fields=("id","name","cover_image","icon_prop","emoji","description"))

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
    workspace_detail = WorkSpaceSerializer(
        source="workspace",
        fields=("id", "name", "slug"),
        read_only=True,
    ) 
    project_detail = ProjectSerializer(source="project", fields=("id","name","cover_image","icon_prop","emoji","description"), read_only=True)

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = [
            "points",
            "name",
            "description",
        ]
