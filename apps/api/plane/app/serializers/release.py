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

# Django imports
from django.utils import timezone
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import (
    Release,
    ReleaseTag,
    ReleaseLabel,
    ReleaseLabelAssociation,
    ReleaseComment,
    ReleaseCommentReaction,
    ReleaseWorkItem,
    ReleaseActivity,
    ReleaseChangelog,
    ReleaseLink,
    ReleasePage,
    FileAsset,
    Description,
    Issue,
)
from plane.ee.serializers import DescriptionSerializer


class ReleaseSerializer(BaseSerializer):
    label_ids = serializers.SerializerMethodField(read_only=True)
    work_item_ids = serializers.SerializerMethodField(read_only=True)
    description = DescriptionSerializer(read_only=True)
    completed_work_item_count = serializers.SerializerMethodField(read_only=True)
    cancelled_work_item_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Release
        fields = "__all__"
        read_only_fields = ["workspace"]

    def get_label_ids(self, obj):
        if hasattr(obj, "release_label_associations"):
            return [assoc.label_id for assoc in obj.release_label_associations.all() if assoc.deleted_at is None]
        return []

    def get_work_item_ids(self, obj):
        if hasattr(obj, "release_work_items"):
            return [rwi.work_item_id for rwi in obj.release_work_items.all() if rwi.deleted_at is None]
        return []

    def get_completed_work_item_count(self, obj):
        if hasattr(obj, "completed_work_item"):
            return len(obj.completed_work_item)
        return 0

    def get_cancelled_work_item_count(self, obj):
        if hasattr(obj, "cancelled_work_item"):
            return len(obj.cancelled_work_item)
        return 0


class ReleaseWriteSerializer(ReleaseSerializer):
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    work_item_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    description_html = serializers.CharField(required=False, write_only=True, allow_blank=True)
    description_json = serializers.JSONField(required=False, write_only=True)

    def validate_name(self, name):
        workspace_id = self.context.get("workspace_id", None)

        if workspace_id:
            if Release.objects.filter(name=name).exists():
                raise serializers.ValidationError(detail="RELEASE_NAME_ALREADY_EXISTS")

        return name

    class Meta(ReleaseSerializer.Meta):
        pass

    def create(self, validated_data):
        labels = validated_data.pop("label_ids", None)
        work_items = validated_data.pop("work_item_ids", None)
        workspace_id = self.context["workspace_id"]
        description_html = validated_data.pop("description_html", "<p></p>")
        description_json = validated_data.pop("description_json", {})

        description = Description.objects.create(
            workspace_id=workspace_id,
            description_html=description_html,
            description_json=description_json,
        )

        release = Release.objects.create(**validated_data, workspace_id=workspace_id, description=description)

        created_by_id = release.created_by_id
        updated_by_id = release.updated_by_id

        if labels is not None:
            valid_label_ids = ReleaseLabel.objects.filter(workspace_id=workspace_id, id__in=labels).values_list(
                "id", flat=True
            )

            if valid_label_ids and len(valid_label_ids):
                ReleaseLabelAssociation.objects.bulk_create(
                    [
                        ReleaseLabelAssociation(
                            workspace_id=workspace_id,
                            release=release,
                            label_id=str(label_id),
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label_id in valid_label_ids
                    ],
                    batch_size=10,
                )

        if work_items is not None:
            valid_work_item_ids = Issue.objects.filter(workspace_id=workspace_id, id__in=work_items).values_list(
                "id", flat=True
            )

            if valid_work_item_ids and len(valid_work_item_ids):
                ReleaseWorkItem.objects.bulk_create(
                    [
                        ReleaseWorkItem(
                            workspace_id=workspace_id,
                            release=release,
                            work_item_id=str(work_item_id),
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for work_item_id in valid_work_item_ids
                    ],
                    batch_size=10,
                )

        return release

    def update(self, instance, validated_data):
        labels = validated_data.pop("label_ids", None)
        work_items = validated_data.pop("work_item_ids", None)
        description_html = validated_data.pop("description_html", None)
        description_json = validated_data.pop("description_json", None)

        if instance.description_id and description_html is not None:
            Description.objects.filter(id=instance.description_id).update(
                description_html=description_html,
                description_json=description_json if description_json is not None else {},
            )

        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if labels is not None:
            valid_label_ids = ReleaseLabel.objects.filter(workspace_id=workspace_id, id__in=labels).values_list(
                "id", flat=True
            )

            # delete labels that are not part of the payload
            ReleaseLabelAssociation.objects.filter(release=instance).exclude(label_id__in=valid_label_ids).delete()

            existing_labels = ReleaseLabelAssociation.objects.filter(
                release_id=instance.id, label_id__in=valid_label_ids
            ).values_list("label_id", flat=True)

            new_labels = set(valid_label_ids) - set(existing_labels)

            if new_labels:
                ReleaseLabelAssociation.objects.bulk_create(
                    [
                        ReleaseLabelAssociation(
                            label_id=label,
                            workspace_id=workspace_id,
                            release=instance,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label in new_labels
                    ],
                    batch_size=10,
                )

        if work_items is not None:
            valid_work_item_ids = Issue.objects.filter(workspace_id=workspace_id, id__in=work_items).values_list(
                "id", flat=True
            )

            ReleaseWorkItem.objects.filter(release=instance).exclude(work_item_id__in=valid_work_item_ids).delete()

            existing_work_items = ReleaseWorkItem.objects.filter(
                release_id=instance.id, work_item_id__in=valid_work_item_ids
            ).values_list("work_item_id", flat=True)

            new_work_items = set(valid_work_item_ids) - set(existing_work_items)

            if new_work_items:
                ReleaseWorkItem.objects.bulk_create(
                    [
                        ReleaseWorkItem(
                            work_item_id=work_item,
                            workspace_id=workspace_id,
                            release=instance,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for work_item in new_work_items
                    ],
                    batch_size=10,
                )

        instance.updated_at = timezone.now()
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


class ReleaseCommentSerializer(BaseSerializer):
    comment_reactions = serializers.SerializerMethodField(read_only=True)
    comment_html = serializers.CharField(required=False, write_only=True, allow_blank=True)
    comment = DescriptionSerializer(read_only=True)

    class Meta:
        model = ReleaseComment
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "release",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def get_comment_reactions(self, obj):
        return ReleaseCommentReactionSerializer(obj.release_comment_reactions.all(), many=True).data

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

        instance.updated_at = timezone.now()

        return super().update(instance, validated_data)


class ReleaseCommentReactionSerializer(BaseSerializer):
    class Meta:
        model = ReleaseCommentReaction
        fields = ["id", "reaction", "created_by"]
        read_only_fields = ["workspace", "release_comment", "created_by", "deleted_at"]


class ReleaseWorkItemSerializer(BaseSerializer):
    class Meta:
        model = ReleaseWorkItem
        fields = "__all__"
        read_only_fields = ["workspace", "release"]


class ReleaseActivitySerializer(BaseSerializer):
    class Meta:
        model = ReleaseActivity
        fields = "__all__"
        read_only_fields = ["release"]


class ReleaseChangelogSerializer(BaseSerializer):
    class Meta:
        model = ReleaseChangelog
        fields = "__all__"
        read_only_fields = ["workspace", "release"]


class ReleaseAttachmentSerializer(BaseSerializer):
    asset_url = serializers.CharField(read_only=True)

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
        ]


class ReleaseLinkSerializer(BaseSerializer):
    class Meta:
        model = ReleaseLink
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "release",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def validate_url(self, value):
        validate_url = URLValidator()
        try:
            validate_url(value)
        except ValidationError:
            raise serializers.ValidationError("Invalid URL format.")

        if not value.startswith(("http://", "https://")):
            raise serializers.ValidationError("Invalid URL scheme.")
        return value

    def create(self, validated_data):
        if ReleaseLink.objects.filter(
            url=validated_data.get("url"),
            release_id=validated_data.get("release_id"),
        ).exists():
            raise serializers.ValidationError({"error": "URL already exists for this Release"})
        return ReleaseLink.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if (
            ReleaseLink.objects.filter(url=validated_data.get("url"), release_id=instance.release_id)
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError({"error": "URL already exists for this Release"})
        return super().update(instance, validated_data)


class ReleasePageSerializer(BaseSerializer):
    class Meta:
        model = ReleasePage
        fields = "__all__"
        read_only_fields = ["workspace", "release"]
