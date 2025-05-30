from plane.ee.models.workspace import WorkspaceCredential

from plane.app.serializers.base import BaseSerializer


class WorkspaceCredentialSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceCredential
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]