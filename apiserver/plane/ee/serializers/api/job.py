# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import ImportJob, ImportReport
from plane.db.models import User, Project, Workspace

# Seriaizers
from rest_framework import serializers


class ImportReportAPISerializer(BaseSerializer):
    class Meta:
        model = ImportReport
        fields = "__all__"


class ImportJobAPISerializer(BaseSerializer):
    workspace_slug = serializers.CharField(source="workspace.slug", read_only=True)
    report = ImportReportAPISerializer(read_only=True)
    initiator_email = serializers.CharField(source="initiator.email", read_only=True)

    # Representation Values
    workspace_id = serializers.PrimaryKeyRelatedField(
        source="workspace", queryset=Workspace.objects.all()
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source="project", queryset=Project.objects.all()
    )
    initiator_id = serializers.PrimaryKeyRelatedField(
        source="initiator", queryset=User.objects.all()
    )
    report_id = serializers.PrimaryKeyRelatedField(
        source="report", queryset=ImportReport.objects.all()
    )

    class Meta:
        model = ImportJob
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "initiator",
            "report",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
