from django.utils import timezone
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

# Module imports
from plane.db.models import FileAsset
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    Initiative,
    InitiativeProject,
    InitiativeActivity,
    InitiativeLabel,
    InitiativeLink,
    InitiativeComment,
    InitiativeReaction,
    InitiativeCommentReaction,
    InitiativeEpic,
)

# Third party imports
from rest_framework import serializers


class InitiativeReactionSerializer(BaseSerializer):
    class Meta:
        model = InitiativeReaction
        fields = ["id", "reaction", "actor"]
        read_only_fields = ["workspace", "initiative", "actor", "deleted_at"]


class InitiativeCommentReactionSerializer(BaseSerializer):
    class Meta:
        model = InitiativeCommentReaction
        fields = ["id", "reaction", "actor"]
        read_only_fields = ["workspace", "initiative", "comment", "actor", "deleted_at"]


class InitiativeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    epic_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    reactions = InitiativeCommentReactionSerializer(
        read_only=True, many=True, source="initiative_reactions"
    )

    class Meta:
        model = Initiative
        fields = "__all__"
        read_only_fields = ["workspace"]

    def create(self, validated_data):
        projects = validated_data.pop("project_ids", None)
        epics = validated_data.pop("epic_ids", None)
        labels = validated_data.pop("label_ids", None)
        workspace_id = self.context["workspace_id"]
        lead = self.context["lead"]

        # Create initiative
        initiative = Initiative.objects.create(
            **validated_data, workspace_id=workspace_id, lead_id=lead
        )

        created_by_id = initiative.created_by_id
        updated_by_id = initiative.updated_by_id

        if projects is not None and len(projects):
            InitiativeProject.objects.bulk_create(
                [
                    InitiativeProject(
                        project_id=project_id,
                        initiative=initiative,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for project_id in projects
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            InitiativeLabel.objects.bulk_create(
                [
                    InitiativeLabel(
                        label=label,
                        initiative=initiative,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if epics is not None and len(epics):
            InitiativeEpic.objects.bulk_create(
                [
                    InitiativeEpic(
                        epic_id=epic_id,
                        initiative=initiative,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for epic_id in epics
                ],
                batch_size=10,
            )

        return initiative

    def update(self, instance, validated_data):
        projects = validated_data.pop("project_ids", None)
        labels = validated_data.pop("label_ids", None)
        epics = validated_data.pop("epic_ids", None)

        # Related models
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if projects is not None:
            InitiativeProject.objects.filter(initiative=instance).delete()
            InitiativeProject.objects.bulk_create(
                [
                    InitiativeProject(
                        initiative=instance,
                        project_id=project,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for project in projects
                ],
                batch_size=10,
            )

        if labels is not None:
            InitiativeLabel.objects.filter(initiative=instance).delete()
            InitiativeLabel.objects.bulk_create(
                [
                    InitiativeLabel(
                        label=label,
                        initiative=instance,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if epics is not None:
            InitiativeEpic.objects.filter(initiative=instance).delete()
            InitiativeEpic.objects.bulk_create(
                [
                    InitiativeEpic(
                        epic_id=epic,
                        initiative=instance,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for epic in epics
                ],
                batch_size=10,
            )

        # Time updation occurs even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)


class InitiativeProjectSerializer(BaseSerializer):
    class Meta:
        model = InitiativeProject
        fields = "__all__"
        read_only_fields = ["initiative", "project"]


class InitiativeLabelSerializer(BaseSerializer):
    class Meta:
        model = InitiativeLabel
        fields = "__all__"
        read_only_fields = ["initiative", "label"]


class InitiativeLinkSerializer(BaseSerializer):
    class Meta:
        model = InitiativeLink
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "initiative",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def validate_url(self, value):
        # Check URL format
        validate_url = URLValidator()
        try:
            validate_url(value)
        except ValidationError:
            raise serializers.ValidationError("Invalid URL format.")

        # Check URL scheme
        if not value.startswith(("http://", "https://")):
            raise serializers.ValidationError("Invalid URL scheme.")

        return value

    # Validation if url already exists
    def create(self, validated_data):
        if InitiativeLink.objects.filter(
            url=validated_data.get("url"),
            initiative_id=validated_data.get("initiative_id"),
        ).exists():
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )
        return InitiativeLink.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if (
            InitiativeLink.objects.filter(
                url=validated_data.get("url"), initiative_id=instance.initiative_id
            )
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )

        return super().update(instance, validated_data)


class InitiativeCommentSerializer(BaseSerializer):
    comment_reactions = InitiativeCommentReactionSerializer(
        read_only=True, many=True, source="initiative_reactions"
    )
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = InitiativeComment
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "initiative",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class InitiativeAttachmentSerializer(BaseSerializer):
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
            "project",
            "initiative",
        ]


class IssueReactionSerializer(BaseSerializer):
    # actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = InitiativeReaction
        fields = "__all__"
        read_only_fields = ["workspace", "initiative", "actor", "deleted_at"]


class InitiativeActivitySerializer(BaseSerializer):
    class Meta:
        model = InitiativeActivity
        exclude = ["created_by", "updated_by"]
        read_only_fields = ["initiative", "label"]


class InitiativeEpicSerializer(BaseSerializer):
    class Meta:
        model = InitiativeEpic
        fields = ["id", "initiative", "epic", "workspace", "sort_order"]
        read_only_fields = [
            "workspace",
            "created_at",
            "update_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "initiative",
        ]
