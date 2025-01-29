from plane.ee.models.workspace import WorkspaceCredential

from plane.api.serializers.base import BaseSerializer


class WorkspaceCredentialAPISerializer(BaseSerializer):
    class Meta:
        model = WorkspaceCredential
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]