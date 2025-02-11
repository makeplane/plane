from plane.ee.models.workspace import WorkspaceConnection, WorkspaceEntityConnection
from plane.db.models import Workspace, Project, Issue

from plane.api.serializers.base import BaseSerializer
from rest_framework import serializers


class WorkspaceEntityConnectionAPISerializer(BaseSerializer):
    workspace_id = serializers.PrimaryKeyRelatedField(
        source="workspace",  # Maps to the `workspace` ForeignKey field
        queryset=Workspace.objects.all(),
    )
    workspace_connection_id = serializers.PrimaryKeyRelatedField(
        source="workspace_connection",  # Maps to the `workspace_entity_connection` ForeignKey field
        queryset=WorkspaceConnection.objects.all(),
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source="project",  # Maps to the `project` ForeignKey field
        queryset=Project.objects.all(),
        required=False,
    )
    issue_id = serializers.PrimaryKeyRelatedField(
        source="issue",  # Maps to the `issue` ForeignKey field
        queryset=Issue.objects.all(),
        required=False,
    )
    workspace_slug = serializers.CharField(source="workspace.slug", read_only=True)

    class Meta:
        model = WorkspaceEntityConnection
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "workspace_connection",
            "project",
            "issue",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
