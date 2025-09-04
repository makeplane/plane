from plane.app.serializers.base import BaseSerializer
from plane.ee.models import IntakeSetting


class IntakeSettingSerializer(BaseSerializer):
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
