# Module imports
from .base import BaseSerializer
from plane.db.models import ExporterHistory

class ExporterHistorySerializer(BaseSerializer):

    class Meta:
        model = ExporterHistory
        fields = [
            "id",
            "created_at",
            "updated_at",
            "project",
            "provider",
            "status",
            "url",
            "token",
            "created_by",
            "updated_by"
        ]
