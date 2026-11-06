# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for releases, release labels/tags/changelogs, milestones and initiatives.

Response shapes follow plane-sdk 0.3.1 (plane.models.releases, .milestones, .initiatives).
Every serializer that writes takes the target workspace as context["workspace"].
"""

from django.utils.html import strip_tags
from rest_framework import serializers

from plane.db.models import Issue, User
from plane.nexus.models import (
    Initiative,
    Milestone,
    MilestoneWorkItem,
    Release,
    ReleaseChangelog,
    ReleaseLabel,
    ReleaseTag,
)
from plane.utils.content_validator import validate_html_content


def clean_html(value):
    """Sanitize rich text the way Plane does; raise a field error when it cannot."""
    if not value:
        return value
    is_valid, error, cleaned = validate_html_content(value)
    if not is_valid:
        raise serializers.ValidationError(error or "HTML content is not valid.")
    return cleaned if cleaned is not None else value


def stripped(html: str | None) -> str:
    return strip_tags(html or "").strip()


class _WorkspaceScoped(serializers.ModelSerializer):
    """Limits related-object choices to the workspace in context["workspace"]."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        workspace = self.context.get("workspace")
        if workspace is None:
            return
        if "lead" in self.fields:
            self.fields["lead"].queryset = User.objects.filter(
                member_workspace__workspace=workspace, member_workspace__is_active=True
            )
        if "tag" in self.fields:
            self.fields["tag"].queryset = ReleaseTag.objects.filter(workspace=workspace)


class _RichText(serializers.ModelSerializer):
    def validate_description_html(self, value):
        return clean_html(value)

    def validate(self, attrs):
        if "description_html" in attrs:
            attrs["description_stripped"] = stripped(attrs["description_html"])
        return attrs


# ---------------------------------------------------------------- releases


class ReleaseTagSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    commit_hash = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    git_tag = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)

    class Meta:
        model = ReleaseTag
        fields = [
            "id",
            "version",
            "description",
            "commit_hash",
            "git_tag",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at", "created_by", "updated_by"]

    def validate_version(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("version cannot be empty.")
        clash = ReleaseTag.objects.filter(workspace=self.context["workspace"], version=value)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError(f"A release tag with version {value!r} already exists.")
        return value

    def validate(self, attrs):
        # The columns are NOT NULL; null means "clear".
        for field in ("description", "commit_hash", "git_tag"):
            if field in attrs and attrs[field] is None:
                attrs[field] = ""
        return attrs


class ReleaseLabelSerializer(serializers.ModelSerializer):
    color = serializers.CharField(required=False, allow_blank=True, max_length=255)

    class Meta:
        model = ReleaseLabel
        fields = ["id", "name", "color", "sort_order", "workspace", "created_at", "updated_at"]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("name cannot be empty.")
        clash = ReleaseLabel.objects.filter(workspace=self.context["workspace"], name=value)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError(f"A release label named {value!r} already exists.")
        return value


class ReleaseSerializer(_WorkspaceScoped, _RichText):
    description = serializers.SerializerMethodField()
    is_latest = serializers.SerializerMethodField()
    label_ids = serializers.SerializerMethodField()
    description_html = serializers.CharField(required=False, allow_blank=True, write_only=True)
    description_json = serializers.JSONField(required=False, write_only=True)
    lead = serializers.PrimaryKeyRelatedField(queryset=User.objects.none(), required=False, allow_null=True)
    tag = serializers.PrimaryKeyRelatedField(queryset=ReleaseTag.objects.none(), required=False, allow_null=True)

    class Meta:
        model = Release
        fields = [
            "id",
            "name",
            "description",
            "description_html",
            "description_json",
            "status",
            "target_date",
            "release_date",
            "lead",
            "tag",
            "is_latest",
            "is_prerelease",
            "label_ids",
            "external_source",
            "external_id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at", "created_by", "updated_by"]

    def get_description(self, obj):
        return {
            "description_html": obj.description_html,
            "description_json": obj.description_json,
            "description_stripped": obj.description_stripped,
        }

    def get_is_latest(self, obj):
        return str(obj.pk) == str(self.context.get("latest_release_id"))

    def get_label_ids(self, obj):
        return [str(link.label_id) for link in obj.label_links.all()]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("name cannot be empty.")
        return value


class ReleaseChangelogSerializer(_RichText):
    changelog = serializers.SerializerMethodField()
    description_html = serializers.CharField(required=False, allow_blank=True, write_only=True)
    description_json = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = ReleaseChangelog
        fields = [
            "id",
            "changelog",
            "description_html",
            "description_json",
            "release",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "release", "workspace", "created_at", "updated_at", "created_by", "updated_by"]

    def get_changelog(self, obj):
        return {
            "description_html": obj.description_html,
            "description_json": obj.description_json,
            "description_stripped": obj.description_stripped,
        }


class ReleaseWorkItemSerializer(serializers.ModelSerializer):
    """A work item linked to a release (plane-sdk ReleaseWorkItem)."""

    project_identifier = serializers.CharField(source="project.identifier", read_only=True)

    class Meta:
        model = Issue
        fields = ["id", "name", "project_id", "project_identifier", "sequence_id", "state_id", "priority"]
        read_only_fields = fields


# ---------------------------------------------------------------- milestones


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = [
            "id",
            "title",
            "target_date",
            "external_source",
            "external_id",
            "project",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "project", "workspace", "created_at", "updated_at", "created_by", "updated_by"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("title cannot be empty.")
        return value


class MilestoneWorkItemSerializer(serializers.ModelSerializer):
    """One milestone ↔ work item link (plane-sdk MilestoneWorkItem); id is the link's."""

    name = serializers.CharField(source="issue.name", read_only=True)
    sequence_id = serializers.IntegerField(source="issue.sequence_id", read_only=True)
    state_id = serializers.UUIDField(source="issue.state_id", read_only=True)
    priority = serializers.CharField(source="issue.priority", read_only=True)

    class Meta:
        model = MilestoneWorkItem
        fields = ["id", "issue", "milestone", "project", "name", "sequence_id", "state_id", "priority", "created_at"]
        read_only_fields = fields


# ---------------------------------------------------------------- initiatives


class InitiativeSerializer(_WorkspaceScoped, _RichText):
    description = serializers.CharField(source="description_stripped", read_only=True)
    description_stripped = serializers.CharField(read_only=True)
    description_html = serializers.CharField(required=False, allow_blank=True)
    description_binary = serializers.SerializerMethodField()
    lead = serializers.PrimaryKeyRelatedField(queryset=User.objects.none(), required=False, allow_null=True)
    logo_props = serializers.JSONField(required=False)

    class Meta:
        model = Initiative
        fields = [
            "id",
            "name",
            "description",
            "description_html",
            "description_stripped",
            "description_binary",
            "start_date",
            "end_date",
            "logo_props",
            "state",
            "lead",
            "workspace",
            "created_at",
            "updated_at",
            "deleted_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at", "deleted_at", "created_by", "updated_by"]

    def get_description_binary(self, obj):
        return None

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("name cannot be empty.")
        return value

    def validate_logo_props(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("logo_props must be an object.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and start > end:
            raise serializers.ValidationError({"end_date": "end_date cannot be before start_date."})
        return attrs
