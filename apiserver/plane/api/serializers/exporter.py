# Module imports
from .base import BaseSerializer
from plane.db.models import ExporterHistory
from .user import UserSerializer


class ExporterHistorySerializer(BaseSerializer):
    initiated_by_detail = UserSerializer(
        source="initiated_by",
        fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
    )

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
            "initiated_by",
            "initiated_by_detail",
            "token",
            "created_by",
            "updated_by",
        ]
        read_only_fields = fields
