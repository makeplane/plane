# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    CustomerProperty,
    CustomerPropertyOption,
    Customer,
    CustomerRequest,
    CustomerRequestIssue,
)
from plane.db.models import FileAsset

# Third party imports
from rest_framework import serializers


class CustomerSerializer(BaseSerializer):
    customer_request_count = serializers.IntegerField(read_only=True)
    logo_url = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ["workspace", "deleted_at"]

    def validate_name(self, value):
        """
        Validate that customer name is unique within the workspace.
        """
        if hasattr(self, "context") and "workspace_id" in self.context:
            workspace_id = self.context["workspace_id"]

            # Check if this is an update (instance exists) or create
            if self.instance:
                # Update case - exclude current instance from check
                if (
                    Customer.objects.filter(
                        workspace_id=workspace_id, name=value, deleted_at__isnull=True
                    )
                    .exclude(id=self.instance.id)
                    .exists()
                ):
                    raise serializers.ValidationError(
                        "Customer with this name already exists in workspace"
                    )
            else:
                # Create case - check if name exists
                if Customer.objects.filter(
                    workspace_id=workspace_id, name=value, deleted_at__isnull=True
                ).exists():
                    raise serializers.ValidationError(
                        "Customer with this name already exists in workspace"
                    )

        return value


class CustomerPropertySerializer(BaseSerializer):
    class Meta:
        model = CustomerProperty
        fields = "__all__"
        read_only_fields = ["name", "workspace", "deleted_at"]


class CustomerPropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = CustomerPropertyOption
        fields = "__all__"
        read_only_fields = ["property", "workspace", "deleted_at"]


class CustomerRequestSerializer(BaseSerializer):
    work_item_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    attachment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CustomerRequest
        fields = [
            "id",
            "name",
            "description",
            "description_html",
            "link",
            "work_item_ids",
            "attachment_count",
            "created_at",
        ]
        read_only_fields = ["customer", "workspace", "deleted_at"]

    def create(self, validated_data):
        work_item_ids = validated_data.pop("work_item_ids", None)
        customer_id = validated_data.pop("customer_id", None)
        workspace_id = validated_data.pop("workspace_id", None)

        customer_request = CustomerRequest.objects.create(
            **validated_data, customer_id=customer_id, workspace_id=workspace_id
        )

        if work_item_ids is not None:
            CustomerRequestIssue.objects.bulk_create(
                [
                    CustomerRequestIssue(
                        customer_request=customer_request,
                        issue_id=work_item_id,
                        customer_id=customer_id,
                        workspace_id=workspace_id,
                    )
                    for work_item_id in work_item_ids
                ],
                batch_size=10,
            )

        return customer_request


class CustomerRequestAttachmentV2Serializer(BaseSerializer):
    asset_url = serializers.CharField(read_only=True)

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "customer_request",
        ]
