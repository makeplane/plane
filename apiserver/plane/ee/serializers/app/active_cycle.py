# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer, ProjectLiteSerializer

from plane.db.models import Cycle


class WorkspaceActiveCycleSerializer(BaseSerializer):
    # favorite
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)

    # active | draft | upcoming | completed
    status = serializers.CharField(read_only=True)

    # project details
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = Cycle
        fields = [
            # necessary fields
            "id",
            "workspace_id",
            "project_id",
            # model fields
            "name",
            "description",
            "start_date",
            "end_date",
            "owned_by_id",
            "view_props",
            "sort_order",
            "external_source",
            "external_id",
            "progress_snapshot",
            "version",
            # meta fields
            "is_favorite",
            "total_issues",
            "status",
            "project_detail",
        ]
        read_only_fields = fields
