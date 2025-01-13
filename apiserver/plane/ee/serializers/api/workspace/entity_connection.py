from plane.ee.models.workspace import WorkspaceEntityConnection

from plane.api.serializers.base import BaseSerializer


class WorkspaceEntityConnectionAPISerializer(BaseSerializer):
    class Meta:
        model = WorkspaceEntityConnection
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]