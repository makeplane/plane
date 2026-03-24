# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from rest_framework import serializers

from plane.app.serializers import BaseSerializer
from plane.db.models import (
    Release,
    ReleaseTag,
    ReleaseLabel,
    ReleaseComment,
    ReleaseLink,
    ReleaseWorkItem,
    Description,
)
from plane.ee.serializers import DescriptionSerializer


class ReleaseSerializer(BaseSerializer):
    description_html = serializers.CharField(required=False, write_only=True, allow_blank=True)
    description_json = serializers.JSONField(required=False, write_only=True)
    description = DescriptionSerializer(read_only=True)

    class Meta:
        model = Release
        fields = "__all__"
        read_only_fields = ["workspace"]

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]

        description_html = validated_data.pop("description_html", "<p></p>")
        description_json = validated_data.pop("description_json", {})

        description = Description.objects.create(
            workspace_id=workspace_id,
            description_html=description_html,
            description_json=description_json,
        )

        release = Release.objects.create(**validated_data, description=description)

        return release

    def update(self, instance, validated_data):
        description_html = validated_data.pop("description_html", None)
        description_json = validated_data.pop("description_json", None)

        if instance.description_id and description_html is not None:
            Description.objects.filter(id=instance.description_id).update(
                description_html=description_html,
                description_json=description_json if description_json is not None else {},
            )

        return super().update(instance, validated_data)


class ReleaseTagSerializer(BaseSerializer):
    class Meta:
        model = ReleaseTag
        fields = "__all__"
        read_only_fields = ["workspace"]

    def validate_version(self, version):
        tag_id = self.instance.id if self.instance else None
        workspace_id = self.context["workspace_id"]

        qs = ReleaseTag.objects.filter(version=version, workspace_id=workspace_id, deleted_at__isnull=True)

        if tag_id:
            qs = qs.exclude(id=tag_id)

        if qs.exists():
            raise serializers.ValidationError(detail="RELEASE_TAG_VERSION_ALREADY_EXISTS")

        return version

    def create(self, validated_data):
        validated_data["workspace_id"] = self.context["workspace_id"]
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["workspace_id"] = self.context["workspace_id"]
        return super().update(instance, validated_data)


class ReleaseLabelSerializer(BaseSerializer):
    class Meta:
        model = ReleaseLabel
        fields = ["id", "name", "color", "sort_order", "workspace"]
        read_only_fields = [
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_name(self, name):
        label_id = self.instance.id if self.instance else None
        workspace_id = self.context["workspace_id"]

        qs = ReleaseLabel.objects.filter(name=name, workspace_id=workspace_id, deleted_at__isnull=True)

        if label_id:
            qs = qs.exclude(id=label_id)

        if qs.exists():
            raise serializers.ValidationError(detail="RELEASE_LABEL_NAME_ALREADY_EXISTS")

        return name

    def create(self, validated_data):
        validated_data["workspace_id"] = self.context["workspace_id"]
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["workspace_id"] = self.context["workspace_id"]
        return super().update(instance, validated_data)


class ReleaseCommentSerializer(BaseSerializer):
    comment_html = serializers.CharField(required=False, write_only=True, allow_blank=True)
    comment = DescriptionSerializer(read_only=True)

    class Meta:
        model = ReleaseComment
        fields = "__all__"
        read_only_fields = ["workspace", "release"]

    def create(self, validated_data):
        comment_html = validated_data.pop("comment_html", "<p></p>")

        workspace_id = validated_data.pop("workspace_id", None)
        comment = Description.objects.create(workspace_id=workspace_id, description_html=comment_html)

        release_comment = ReleaseComment.objects.create(**validated_data, workspace_id=workspace_id, comment=comment)

        return release_comment

    def update(self, instance, validated_data):
        comment_html = validated_data.pop("comment_html", "<p></p>")

        if instance.comment_id:
            Description.objects.filter(id=instance.comment_id).update(description_html=comment_html)

        return super().update(instance, validated_data)


class ReleaseLinkSerializer(BaseSerializer):
    class Meta:
        model = ReleaseLink
        fields = "__all__"
        read_only_fields = ["workspace", "release"]


class ReleaseWorkItemSerializer(BaseSerializer):
    class Meta:
        model = ReleaseWorkItem
        fields = "__all__"
        read_only_fields = ["workspace", "release"]
