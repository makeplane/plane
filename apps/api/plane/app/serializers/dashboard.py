# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import Dashboard, DashboardWidget


class DashboardWidgetSerializer(BaseSerializer):
    class Meta:
        model = DashboardWidget
        fields = [
            "id",
            "name",
            "chart_type",
            "chart_model",
            "x_axis_property",
            "y_axis_metric",
            "group_by",
            "config",
            "filters",
            "x_axis_coord",
            "y_axis_coord",
            "width",
            "height",
            "dashboard",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
            "dashboard",
        ]


class DashboardSerializer(BaseSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = [
            "id",
            "name",
            "description",
            "projects",
            "filters",
            "logo_props",
            "access",
            "workspace",
            "widgets",
            "archived_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
        ]

