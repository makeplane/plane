# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer, ProjectLiteSerializer

from plane.db.models import (
    Cycle,
)


class WorkspaceActiveCycleSerializer(BaseSerializer):
    # favorite
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    # state group wise distribution
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)

    backlog_estimate_points = serializers.FloatField(read_only=True)
    unstarted_estimate_points = serializers.FloatField(read_only=True)
    started_estimate_points = serializers.FloatField(read_only=True)
    cancelled_estimate_points = serializers.FloatField(read_only=True)
    total_estimate_points = serializers.FloatField(read_only=True)

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
            # meta fields
            "is_favorite",
            "total_issues",
            "cancelled_issues",
            "completed_issues",
            "started_issues",
            "unstarted_issues",
            "backlog_issues",
            "status",
            "project_detail",
            "backlog_estimate_points",
            "unstarted_estimate_points",
            "started_estimate_points",
            "cancelled_estimate_points",
            "total_estimate_points",
        ]
        read_only_fields = fields
