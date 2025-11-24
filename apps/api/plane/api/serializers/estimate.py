# Module imports
from plane.db.models import EstimatePoint
from .base import BaseSerializer


class EstimatePointSerializer(BaseSerializer):
    """
    Serializer for project estimation points and story point values.

    Handles numeric estimation data for work item sizing and sprint planning,
    providing standardized point values for project velocity calculations.
    """

    class Meta:
        model = EstimatePoint
        fields = ["id", "value"]
        read_only_fields = fields
