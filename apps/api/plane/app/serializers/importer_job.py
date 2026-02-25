# [FA-CUSTOM] Serializer for ImportJob model
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import ImportJob


class ImportJobSerializer(BaseSerializer):
    initiated_by_detail = UserLiteSerializer(
        source="initiated_by", read_only=True
    )

    class Meta:
        model = ImportJob
        fields = [
            "id",
            "token",
            "file_name",
            "file_format",
            "total_rows",
            "detected_preset",
            "status",
            "column_mapping",
            "status_mapping",
            "assignee_mapping",
            "imported_count",
            "skipped_count",
            "error_count",
            "progress",
            "error_log",
            "detected_columns",
            "unique_statuses",
            "unique_assignees",
            "preview_rows",
            "initiated_by",
            "initiated_by_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "token",
            "status",
            "imported_count",
            "skipped_count",
            "error_count",
            "progress",
            "error_log",
            "created_at",
            "updated_at",
        ]
