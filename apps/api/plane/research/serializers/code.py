# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import CodeArtifact, ProjectCodeRepository


class ProjectCodeRepositorySerializer(serializers.ModelSerializer):
    has_credential = serializers.SerializerMethodField()

    class Meta:
        model = ProjectCodeRepository
        fields = [
            "id",
            "workspace",
            "project",
            "provider",
            "repository_url",
            "repository_slug",
            "default_branch",
            "visibility",
            "status",
            "credential_ref",
            "has_credential",
            "last_synced_commit",
            "last_sync_at",
            "sync_error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "status",
            "last_synced_commit",
            "last_sync_at",
            "sync_error",
            "created_at",
            "updated_at",
        ]

    def get_has_credential(self, obj):
        """Credentials are never echoed; only their presence is reported."""
        return bool(obj.credential_ref)


class CodeArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeArtifact
        fields = [
            "id",
            "repository",
            "ref_type",
            "ref_value",
            "commit_message",
            "author_name",
            "committed_at",
            "snapshot_asset",
            "linked_experiment",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "repository", "created_at", "updated_at"]
