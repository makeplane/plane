# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    CustomerProperty,
    CustomerPropertyOption,
    Customer,
    CustomerRequest,
    CustomerRequestIssue
)
from plane.db.models import (
    FileAsset
)

# Third party imports
from rest_framework import serializers

class CustomerSerializer(BaseSerializer):
    customer_request_count = serializers.IntegerField(read_only=True)
    logo_url = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ["workspace", "deleted_at"]

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
    issue_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    attachment_count=serializers.IntegerField(read_only=True)
    
    class Meta:
        model = CustomerRequest
        fields = ["id", "name", "description", "description_html", "link",  "issue_ids", "attachment_count"]
        read_only_fields = ["customer", "workspace", "deleted_at"]

    def create(self, validated_data):
        issue_ids = validated_data.pop("issue_ids", None)
        customer_id=validated_data.pop("customer_id", None)
        workspace_id=validated_data.pop("workspace_id", None)

        customer_request = CustomerRequest.objects.create(**validated_data, customer_id=customer_id, workspace_id=workspace_id)

        if issue_ids is not None:
             CustomerRequestIssue.objects.bulk_create(
                [
                    CustomerRequestIssue(
                        customer_request=customer_request,
                        issue_id=issue_id,
                        customer_id=customer_id,
                        workspace_id=workspace_id
                    )
                    for issue_id in issue_ids
                ],
                batch_size=10
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