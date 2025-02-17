from plane.ee.models.workspace import WorkspaceCredential
from plane.db.models import Workspace, User
from plane.api.serializers.base import BaseSerializer
from rest_framework import serializers


class WorkspaceCredentialAPISerializer(BaseSerializer):

    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all()
    )

    workspace_id = serializers.PrimaryKeyRelatedField(
        source="workspace", queryset=Workspace.objects.all()
    )


    class Meta:
        model = WorkspaceCredential
        fields = "__all__"
        read_only_fields = [
            "user",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
