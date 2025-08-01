# Module imports
from plane.license.models import Instance
from plane.app.serializers import BaseSerializer


class InstanceSerializer(BaseSerializer):
    class Meta:
        model = Instance
        fields = "__all__"
        read_only_fields = ["id", "email", "last_checked_at", "is_setup_done"]
        exclude = [
            "created_by",
            "deleted_at",
            "created_at",
            "last_checked_at",
            "updated_at",
            "updated_by",
        ]
