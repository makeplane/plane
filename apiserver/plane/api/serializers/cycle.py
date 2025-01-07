# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Cycle, CycleIssue
from plane.utils.timezone_converter import convert_to_utc


class CycleSerializer(BaseSerializer):
    total_issues = serializers.IntegerField(read_only=True)
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)
    total_estimates = serializers.FloatField(read_only=True)
    completed_estimates = serializers.FloatField(read_only=True)
    started_estimates = serializers.FloatField(read_only=True)

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("end_date", None) is not None
            and data.get("start_date", None) > data.get("end_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed end date")

        if (
            data.get("start_date", None) is not None
            and data.get("end_date", None) is not None
        ):
            project_id = self.initial_data.get("project_id") or self.instance.project_id
            is_start_date_end_date_equal = (
                True
                if str(data.get("start_date")) == str(data.get("end_date"))
                else False
            )
            data["start_date"] = convert_to_utc(
                date=str(data.get("start_date").date()),
                project_id=project_id,
                is_start_date=True,
            )
            data["end_date"] = convert_to_utc(
                date=str(data.get("end_date", None).date()),
                project_id=project_id,
                is_start_date_end_date_equal=is_start_date_end_date_equal,
            )
        return data

    class Meta:
        model = Cycle
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "workspace",
            "project",
            "owned_by",
            "deleted_at",
        ]


class CycleIssueSerializer(BaseSerializer):
    sub_issues_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CycleIssue
        fields = "__all__"
        read_only_fields = ["workspace", "project", "cycle"]


class CycleLiteSerializer(BaseSerializer):
    class Meta:
        model = Cycle
        fields = "__all__"
