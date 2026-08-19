# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.gitsync.git_url import GitUrlError, validate_branch, validate_https_repo_url
from plane.gitsync.models import ModuleBinding, ProjectGitRemote
from plane.gitsync.registry import is_known_module
from plane.gitsync.workdir import WorkdirError, assert_allowed_workdir, default_mount_workdir, reserved_clone_workdir


class ProjectGitRemoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectGitRemote
        fields = (
            "id",
            "project",
            "workspace",
            "name",
            "kind",
            "workdir",
            "host_path",
            "repo_url",
            "branch",
            "credential_ref",
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

    def validate(self, attrs):
        kind = attrs.get("kind") or getattr(self.instance, "kind", ProjectGitRemote.Kind.LOCAL_MOUNT)
        if kind == ProjectGitRemote.Kind.LOCAL_MOUNT:
            workdir = attrs.get("workdir") or getattr(self.instance, "workdir", "") or default_mount_workdir()
            try:
                attrs["workdir"] = assert_allowed_workdir(workdir)
            except WorkdirError as exc:
                raise serializers.ValidationError({"workdir": str(exc)}) from exc
        elif kind == ProjectGitRemote.Kind.GIT_URL:
            repo_url = (attrs.get("repo_url") if "repo_url" in attrs else getattr(self.instance, "repo_url", "")) or ""
            branch = (attrs.get("branch") if "branch" in attrs else getattr(self.instance, "branch", "")) or ""
            try:
                attrs["repo_url"] = validate_https_repo_url(str(repo_url))
                attrs["branch"] = validate_branch(str(branch))
            except GitUrlError as exc:
                raise serializers.ValidationError({exc.field: str(exc)}) from exc
            credential_ref = (
                attrs.get("credential_ref") if "credential_ref" in attrs else getattr(self.instance, "credential_ref", "")
            )
            if str(credential_ref or "").strip():
                raise serializers.ValidationError(
                    {"credential_ref": "Private remotes are not supported yet. Use a public HTTPS URL."}
                )
            attrs["credential_ref"] = ""
        else:
            raise serializers.ValidationError({"kind": "Unknown data source type."})
        return attrs


def assign_git_url_workdir(remote: ProjectGitRemote) -> None:
    if remote.kind != ProjectGitRemote.Kind.GIT_URL:
        return
    remote.workdir = reserved_clone_workdir(remote.project_id, remote.id)
    remote.save(update_fields=["workdir", "updated_at"])


class ModuleBindingSerializer(serializers.ModelSerializer):
    remote = ProjectGitRemoteSerializer(read_only=True)
    remote_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ModuleBinding
        fields = (
            "id",
            "project",
            "workspace",
            "module_key",
            "remote",
            "remote_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "project", "workspace", "remote", "created_at", "updated_at")

    def validate_module_key(self, value: str) -> str:
        if not is_known_module(value):
            raise serializers.ValidationError("Unknown module.")
        return value
