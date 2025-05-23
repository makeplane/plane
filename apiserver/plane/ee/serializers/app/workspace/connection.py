from plane.ee.models.workspace import WorkspaceConnection

from plane.api.serializers.base import BaseSerializer


class WorkspaceConnectionSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceConnection
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]