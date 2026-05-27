"""Serializers for the workspace credential / connection / entity-
connection endpoints. Field shapes mirror EE TypeScript types so silo
can decode responses unchanged.

Token columns are write-only on output so they don't leak via list
endpoints. silo POSTs them in; reads use the id and rely on the
server-side row.
"""

from rest_framework import serializers

from plane.api.serializers.base import BaseSerializer
from plane.db.models import Issue, Project

from .models import (
    WorkspaceConnection,
    WorkspaceCredential,
    WorkspaceEntityConnection,
    WorkspaceUserConnection,
)


_TOKEN_FIELDS = (
    "source_access_token",
    "source_refresh_token",
    "target_access_token",
    "target_refresh_token",
)


class WorkspaceCredentialSerializer(BaseSerializer):
    workspace_id = serializers.UUIDField(read_only=True, source="workspace.id")
    user_id = serializers.UUIDField(read_only=True, source="user.id")

    class Meta:
        model = WorkspaceCredential
        # Explicit list — workspace/user are injected by the view from
        # URL slug + request.user, never accepted from input.
        fields = (
            "id",
            "workspace_id",
            "user_id",
            "source",
            "source_identifier",
            "source_authorization_type",
            "source_auth_email",
            "source_access_token",
            "source_refresh_token",
            "source_hostname",
            "target_identifier",
            "target_authorization_type",
            "target_access_token",
            "target_refresh_token",
            "target_hostname",
            "is_pat",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "user_id", "created_at", "updated_at")
        extra_kwargs = {f: {"write_only": True, "required": False} for f in _TOKEN_FIELDS}


class WorkspaceConnectionSerializer(BaseSerializer):
    workspace_id = serializers.UUIDField(read_only=True, source="workspace.id")
    workspace_slug = serializers.CharField(read_only=True, source="workspace.slug")
    credential_id = serializers.PrimaryKeyRelatedField(
        source="credential",
        queryset=WorkspaceCredential.objects.all(),
    )

    class Meta:
        model = WorkspaceConnection
        fields = (
            "id",
            "workspace_id",
            "workspace_slug",
            "credential_id",
            "connection_type",
            "connection_id",
            "connection_slug",
            "connection_data",
            "target_hostname",
            "source_hostname",
            "scopes",
            "config",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "workspace_slug", "created_at", "updated_at")


class WorkspaceUserConnectionSerializer(BaseSerializer):
    workspace_id = serializers.UUIDField(read_only=True, source="workspace.id")
    workspace_slug = serializers.CharField(read_only=True, source="workspace.slug")
    user_id = serializers.UUIDField(read_only=True, source="user.id")
    credential_id = serializers.PrimaryKeyRelatedField(
        source="credential",
        queryset=WorkspaceCredential.objects.all(),
    )

    class Meta:
        model = WorkspaceUserConnection
        fields = (
            "id",
            "workspace_id",
            "workspace_slug",
            "user_id",
            "credential_id",
            "connection_type",
            "connection_id",
            "connection_slug",
            "connection_data",
            "target_hostname",
            "source_hostname",
            "scopes",
            "config",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "workspace_id",
            "workspace_slug",
            "user_id",
            "created_at",
            "updated_at",
        )


class WorkspaceEntityConnectionSerializer(BaseSerializer):
    workspace_id = serializers.UUIDField(read_only=True, source="workspace.id")
    workspace_slug = serializers.CharField(read_only=True, source="workspace.slug")
    workspace_connection_id = serializers.PrimaryKeyRelatedField(
        source="workspace_connection",
        queryset=WorkspaceConnection.objects.all(),
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source="project", queryset=Project.objects.all(), required=False, allow_null=True
    )
    issue_id = serializers.PrimaryKeyRelatedField(
        source="issue", queryset=Issue.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = WorkspaceEntityConnection
        fields = (
            "id",
            "workspace_id",
            "workspace_slug",
            "workspace_connection_id",
            "project_id",
            "issue_id",
            "type",
            "entity_type",
            "entity_id",
            "entity_slug",
            "entity_data",
            "config",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "workspace_slug", "created_at", "updated_at")