from rest_framework import serializers

from plane.ee.models import (
    RecurringWorkitemTask,
    RecurringWorkItemTaskActivity,
    RecurringWorkitemTaskLog,
)
from plane.app.serializers.base import BaseSerializer
from plane.ee.serializers import WorkitemTemplateSerializer
from plane.utils.timezone_converter import convert_to_utc


class RecurringWorkItemTaskLogSerializer(BaseSerializer):
    class Meta:
        model = RecurringWorkitemTaskLog
        fields = "__all__"
        read_only_fields = ["workspace", "project", "created_at", "updated_at"]


class RecurringWorkItemTaskActivitySerializer(BaseSerializer):
    recurring_workitem_task_log = RecurringWorkItemTaskLogSerializer(read_only=True)

    class Meta:
        model = RecurringWorkItemTaskActivity
        fields = "__all__"
        read_only_fields = ["workspace", "project", "created_at", "updated_at"]


class RecurringWorkItemSerializer(BaseSerializer):

    workitem_blueprint = WorkitemTemplateSerializer(read_only=True)

    class Meta:
        model = RecurringWorkitemTask
        fields = [
            "id",
            "workitem_blueprint",
            "start_at",
            "end_at",
            "interval_type",
            "enabled",
            "schedule_description",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "workspace",
            "project",
        ]
        read_only_fields = [
            "enabled",
            "periodic_task",
            "project",
            "workspace",
            "schedule_description",
        ]

    def validate(self, data):
        """Validate and process input data"""
        self._convert_timezone_for_start_at(data)
        return data

    def _convert_timezone_for_start_at(self, data):
        """Handle start_at timezone conversion"""
        if not data.get("start_at"):
            return

        project_id = self._get_project_id()
        if not project_id:
            raise serializers.ValidationError(
                "Project ID is required for timezone conversion"
            )

        # Convert start_at to UTC using the project's timezone
        data["start_at"] = convert_to_utc(
            date=str(data.get("start_at").date()),
            project_id=project_id,
            is_start_date=True,
        )

    def _get_project_id(self):
        """Get project ID from context or instance"""
        return self.context.get("project_id") or (
            self.instance and self.instance.project_id
        )
