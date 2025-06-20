# Module imports
from plane.db.models import EstimatePoint
from .base import BaseSerializer


class EstimatePointSerializer(BaseSerializer):
    class Meta:
        model = EstimatePoint
        fields = ["id", "value"]
        read_only_fields = fields
