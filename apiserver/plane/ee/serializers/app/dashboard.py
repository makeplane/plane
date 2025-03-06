# Module imports
from plane.ee.models import (
    Widget,
    Dashboard,
    DashboardProject,
    DashboardQuickFilter,
    DashboardWidget,
)
from plane.ee.serializers import BaseSerializer

# Django imports
from django.utils import timezone
from rest_framework import serializers


class DashboardSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = Dashboard
        fields = "__all__"
        read_only_fields = ["workspace", "owned_by"]

    def create(self, validated_data):
        projects = validated_data.pop("project_ids", None)

        workspace_id = self.context["workspace_id"]
        owned_by_id = self.context["owned_by_id"]

        # Create dashboard
        dashboard = Dashboard.objects.create(
            **validated_data, workspace_id=workspace_id, owned_by_id=owned_by_id
        )

        created_by_id = dashboard.created_by_id
        updated_by_id = dashboard.updated_by_id

        if projects is not None and len(projects):
            DashboardProject.objects.bulk_create(
                [
                    DashboardProject(
                        dashboard_id=dashboard.id,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for project_id in projects
                ],
                batch_size=10,
            )

        return dashboard

    def update(self, instance, validated_data):
        projects = validated_data.pop("project_ids", None)

        # Related models
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if projects is not None:
            DashboardProject.objects.filter(dashboard=instance).delete()
            DashboardProject.objects.bulk_create(
                [
                    DashboardProject(
                        dashboard=instance,
                        project_id=project,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for project in projects
                ],
                batch_size=10,
            )

        # Time updation occurs even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)


class DashboardQuickFilterSerializer(BaseSerializer):
    class Meta:
        model = DashboardQuickFilter
        fields = "__all__"
        read_only_fields = ["workspace", "dashboard", "deleted_at"]


class WidgetSerializer(BaseSerializer):
    x_axis_coord = serializers.IntegerField(required=False)
    y_axis_coord = serializers.IntegerField(required=False)
    height = serializers.IntegerField(required=False)
    width = serializers.IntegerField(required=False)
    filters = serializers.JSONField(required=False)

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]
        dashboard_id = self.context["dashboard_id"]
        x_axis_coord = validated_data.pop("x_axis_coord", 0)
        y_axis_coord = validated_data.pop("y_axis_coord", 0)
        height = validated_data.pop("height", 1)
        width = validated_data.pop("width", 1)
        filters = validated_data.pop("filters", {})
        widget = Widget.objects.create(**validated_data, workspace_id=workspace_id)

        DashboardWidget.objects.create(
            dashboard_id=dashboard_id,
            widget_id=widget.id,
            workspace_id=workspace_id,
            x_axis_coord=x_axis_coord,
            y_axis_coord=y_axis_coord,
            height=height,
            width=width,
            filters=filters,
        )
        return widget

    def update(self, instance, validated_data):
        dashboard_id = self.context["dashboard_id"]

        update_data = {}
        for field in ["filters", "x_axis_coord", "y_axis_coord", "height", "width"]:
            if field in self.initial_data:
                update_data[field] = self.initial_data[field]

        # Only update DashboardWidget if there are fields to update
        if update_data:
            DashboardWidget.objects.filter(
                widget=instance, dashboard_id=dashboard_id
            ).update(**update_data)

        # Time updation occues even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)

    class Meta:
        model = Widget
        fields = "__all__"
        read_only_fields = ["workspace", "dashboard", "created_at", "updated_at"]
