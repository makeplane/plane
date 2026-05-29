# Module imports
from .base import BaseSerializer

from plane.db.models import Estimate, EstimatePoint

from rest_framework import serializers


class EstimateSerializer(BaseSerializer):
    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = ["workspace", "project"]


class EstimatePointSerializer(BaseSerializer):
    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Estimate points are required")
        value = data.get("value")
        if value and len(value) > 20:
            raise serializers.ValidationError("Value can't be more than 20 characters")
        return data

    class Meta:
        model = EstimatePoint
        fields = "__all__"
        read_only_fields = ["estimate", "workspace", "project"]


class EstimateReadSerializer(BaseSerializer):
    points = EstimatePointSerializer(read_only=True, many=True)

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = ["points", "name", "description"]


class WorkspaceEstimateSerializer(BaseSerializer):
    points = EstimatePointSerializer(read_only=True, many=True)

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = ["points", "name", "description"]
