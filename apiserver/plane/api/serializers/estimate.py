# Module imports
from .base import BaseSerializer

from plane.db.models import Estimate, EstimatePoint


class EstimateSerializer(BaseSerializer):
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

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = [
            "points",
            "name",
            "description",
        ]
