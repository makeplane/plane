# Module imports
from plane.license.models import Instance
from plane.app.serializers import BaseSerializer
from plane.app.serializers import UserAdminLiteSerializer


class InstanceSerializer(BaseSerializer):

    class Meta:
        model = Instance
        fields = "__all__"
        read_only_fields = [
            "id",
            "instance_id",
            "license_key",
            "api_key",
            "version",
            "email",
            "last_checked_at",
            "is_setup_done",
        ]
