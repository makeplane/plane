from plane.app.serializers.base import BaseSerializer
from plane.ee.models import IntakeSetting

from rest_framework import serializers


class IntakeSettingSerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = IntakeSetting
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "created_by",
        ]
