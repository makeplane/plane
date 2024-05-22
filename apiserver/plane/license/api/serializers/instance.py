# Module imports
from plane.license.models import Instance
from plane.app.serializers import BaseSerializer
from plane.app.serializers import UserAdminLiteSerializer


class InstanceSerializer(BaseSerializer):

    class Meta:
        model = Instance
        exclude = [
            "license_key",
            "api_key",
            "version",
        ]
        read_only_fields = [
            "id",
            "instance_id",
            "email",
            "last_checked_at",
            "is_setup_done",
        ]
