# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import ImportJob, ImportReport


class ImportJobSerializer(BaseSerializer):
    class Meta:
        model = ImportJob
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class ImportReportSerializer(BaseSerializer):
    class Meta:
        model = ImportReport
        fields = "__all__"
