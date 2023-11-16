# Module imports
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.api.serializers import BaseSerializer
from plane.api.serializers import UserAdminLiteSerializer


class InstanceSerializer(BaseSerializer):
    primary_owner_details = UserAdminLiteSerializer(source="primary_owner", read_only=True)

    class Meta:
        model = Instance
        fields = "__all__"
        read_only_fields = [
            "id",
            "primary_owner",
            "primary_email",
            "instance_id",
            "license_key",
            "api_key",
            "version",
            "email",
            "last_checked_at",
        ]


class InstanceAdminSerializer(BaseSerializer):
    user_detail = UserAdminLiteSerializer(source="user", read_only=True)

    class Meta:
        model = InstanceAdmin
        fields = "__all__"
        read_only_fields = [
            "id",
            "instance",
            "user",
        ]

class InstanceConfigurationSerializer(BaseSerializer):

    class Meta:
        model = InstanceConfiguration
        fields = "__all__"
