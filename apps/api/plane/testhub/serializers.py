# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.testhub.models import CatalogSnapshot, ProjectTestRepo, TesthubAssetOverlay, TesthubJob, TesthubSession


class ProjectTestRepoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTestRepo
        fields = (
            "id",
            "project",
            "workspace",
            "repo_url",
            "branch",
            "workdir",
            "last_sync_sha",
            "last_sync_at",
            "last_sync_status",
            "last_sync_error",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "project",
            "workspace",
            "last_sync_sha",
            "last_sync_at",
            "last_sync_status",
            "last_sync_error",
            "created_at",
            "updated_at",
        )


class CatalogSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = CatalogSnapshot
        fields = ("id", "project", "sha", "payload", "created_at")
        read_only_fields = fields


class TesthubJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TesthubJob
        fields = (
            "id",
            "project",
            "kind",
            "status",
            "params",
            "argv",
            "confirmed",
            "exit_code",
            "stdout",
            "stderr",
            "started_at",
            "finished_at",
            "requested_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class TesthubAssetOverlaySerializer(serializers.ModelSerializer):
    class Meta:
        model = TesthubAssetOverlay
        fields = (
            "id",
            "project",
            "workspace",
            "asset_ref",
            "kind",
            "payload",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class TesthubSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TesthubSession
        fields = (
            "id",
            "project",
            "workspace",
            "name",
            "status",
            "feature_source_module",
            "feature_sha",
            "environment_id",
            "selection",
            "summary",
            "job",
            "requested_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
