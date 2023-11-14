# Module imports
from plane.license.models import Instance
from plane.api.serializers import BaseSerializer
from plane.api.serializers import UserAdminLiteSerializer


class InstanceSerializer(BaseSerializer):
    owner_details = UserAdminLiteSerializer(source="owner", read_only=True)

    class Meta:
        model = Instance
        fields = "__all__"
        read_only_fields = [
            "id",
            "owner",
            "instance_id",
            "license_key",
            "api_key",
            "version",
            "email",
            "last_checked_at",
        ]
