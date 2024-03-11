# Module imports
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.app.serializers import BaseSerializer
from plane.app.serializers import UserAdminLiteSerializer
from plane.license.utils.encryption import decrypt_data


class InstanceSerializer(BaseSerializer):
    primary_owner_details = UserAdminLiteSerializer(
        source="primary_owner", read_only=True
    )

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Decrypt secrets value
        if instance.is_encrypted and instance.value is not None:
            data["value"] = decrypt_data(instance.value)

        return data
