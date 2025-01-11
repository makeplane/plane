# Module imports
from .base import BaseSerializer
from plane.db.models import DeprecatedDashboard, DeprecatedWidget

# Third party frameworks
from rest_framework import serializers


class DashboardSerializer(BaseSerializer):
    class Meta:
        model = DeprecatedDashboard
        fields = "__all__"


class WidgetSerializer(BaseSerializer):
    is_visible = serializers.BooleanField(read_only=True)
    widget_filters = serializers.JSONField(read_only=True)

    class Meta:
        model = DeprecatedWidget
        fields = ["id", "key", "is_visible", "widget_filters"]
