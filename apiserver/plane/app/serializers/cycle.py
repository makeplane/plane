# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueStateSerializer
from plane.db.models import (
    Cycle,
    CycleIssue,
    CycleFavorite,
    CycleUserProperties,
)

class CycleWriteSerializer(BaseSerializer):
    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("end_date", None) is not None
            and data.get("start_date", None) > data.get("end_date", None)
        ):
            raise serializers.ValidationError(
                "Start date cannot exceed end date"
            )
        return data

    class Meta:
        model = Cycle
        fields = "__all__"


class CycleSerializer(BaseSerializer):
    #  workspace and project ids
    workspace_id = serializers.PrimaryKeyRelatedField(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(read_only=True)
    owned_by_id = serializers.PrimaryKeyRelatedField(read_only=True)
    # favorite
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    # state group wise distribution
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)
    #TODO: Remove once confirmed  # estimates
    # total_estimates = serializers.IntegerField(read_only=True)
    # completed_estimates = serializers.IntegerField(read_only=True)
    # started_estimates = serializers.IntegerField(read_only=True)
    # method fields
    assignees = serializers.SerializerMethodField(read_only=True)

    # active | draft | upcoming | completed
    status = serializers.CharField(read_only=True)

    def get_assignees(self, obj):
        # Get all the members
        members = [
                {
                    "id": assignee.id,
                    "display_name": assignee.display_name,
                    "avatar": assignee.avatar,
                }
            for issue_cycle in obj.issue_cycle.prefetch_related(
                "issue__assignees"
            ).all()
            for assignee in issue_cycle.issue.assignees.all()
        ]
        # Convert the set back to a list of dictionaries
        unique_list = [dict(item) for item in {frozenset(item.items()) for item in members}]

        return unique_list

    class Meta:
        model = Cycle
        fields = [
            # necessary fields
            "id",
            "workspace_id",
            "project_id",
            # model fields
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
            # "total_estimates",
            # "completed_estimates",
            # "started_estimates",
            "assignees",
            "status",
        ]
        read_only_fields = fields


class CycleIssueSerializer(BaseSerializer):
    issue_detail = IssueStateSerializer(read_only=True, source="issue")
    sub_issues_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CycleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "cycle",
        ]


class CycleFavoriteSerializer(BaseSerializer):
    cycle_detail = CycleSerializer(source="cycle", read_only=True)

    class Meta:
        model = CycleFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]


class CycleUserPropertiesSerializer(BaseSerializer):
    class Meta:
        model = CycleUserProperties
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "cycle" "user",
        ]
