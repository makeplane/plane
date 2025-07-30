# Django imports
from django.utils import timezone
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

# Third Party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import CommentReactionSerializer
from plane.ee.serializers import BaseSerializer
from plane.db.models import (
    User,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueLabel,
    Label,
    IssueLink,
    FileAsset,
    IssueRelation,
    State,
    IssueType,
    IssueComment,
    IssueReaction,
    IssueSubscriber,
)
from plane.ee.models import EpicUserProperties, InitiativeEpic
from plane.app.serializers import (
    UserLiteSerializer,
    ProjectLiteSerializer,
    WorkspaceLiteSerializer,
    IssueFlatSerializer,
    DynamicBaseSerializer,
)


##TODO: Find a better way to write this serializer
## Find a better approach to save manytomany?
class EpicCreateSerializer(BaseSerializer):
    # ids
    state_id = serializers.PrimaryKeyRelatedField(
        source="state", queryset=State.objects.all(), required=False, allow_null=True
    )
    type_id = serializers.PrimaryKeyRelatedField(
        source="type", queryset=IssueType.objects.all(), required=False, allow_null=True
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Issue.objects.all(), required=False, allow_null=True
    )
    label_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    assignee_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    initiative_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )
    initiative_id_resp = serializers.SerializerMethodField(read_only=True)

    def get_initiative_id_resp(self, obj):
        if obj.initiative_epics.all():
            return [
                initiative.initiative_id for initiative in obj.initiative_epics.all()
            ]
        return []

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        assignee_ids = self.initial_data.get("assignee_ids")
        data["assignee_ids"] = assignee_ids if assignee_ids else []
        label_ids = self.initial_data.get("label_ids")
        data["label_ids"] = label_ids if label_ids else []
        return data

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")
        return data

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]

        epic_id = self.context["type_id"]
        # Create Issue
        issue = Issue.objects.create(
            **validated_data, project_id=project_id, type_id=epic_id
        )

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if assignees is not None and len(assignees):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return issue

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        initiative_ids = validated_data.pop("initiative_ids", None)

        # Related models
        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if initiative_ids is not None:
            InitiativeEpic.objects.filter(epic=instance).delete()
            InitiativeEpic.objects.bulk_create(
                [
                    InitiativeEpic(
                        epic_id=instance.id,
                        initiative_id=initiative_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for initiative_id in initiative_ids
                ],
                batch_size=10,
            )
        if assignees is not None:
            IssueAssignee.objects.filter(issue=instance).delete()
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            IssueLabel.objects.filter(issue=instance).delete()
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        # Time updation occues even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)


class EpicActivitySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = IssueActivity
        fields = "__all__"


class EpicRelationSerializer(BaseSerializer):
    id = serializers.UUIDField(source="related_issue.id", read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source="related_issue.project_id", read_only=True
    )
    sequence_id = serializers.IntegerField(
        source="related_issue.sequence_id", read_only=True
    )
    name = serializers.CharField(source="related_issue.name", read_only=True)
    relation_type = serializers.CharField(read_only=True)

    class Meta:
        model = IssueRelation
        fields = ["id", "project_id", "sequence_id", "relation_type", "name"]
        read_only_fields = ["workspace", "project"]


class RelatedIssueSerializer(BaseSerializer):
    id = serializers.UUIDField(source="issue.id", read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source="issue.project_id", read_only=True
    )
    sequence_id = serializers.IntegerField(source="issue.sequence_id", read_only=True)
    name = serializers.CharField(source="issue.name", read_only=True)
    relation_type = serializers.CharField(read_only=True)

    class Meta:
        model = IssueRelation
        fields = ["id", "project_id", "sequence_id", "relation_type", "name"]
        read_only_fields = ["workspace", "project"]


class EpicLinkSerializer(BaseSerializer):
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = IssueLink
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "issue",
        ]

    def to_internal_value(self, data):
        # Modify the URL before validation by appending http:// if missing
        url = data.get("url", "")
        if url and not url.startswith(("http://", "https://")):
            data["url"] = "http://" + url

        return super().to_internal_value(data)

    def validate_url(self, value):
        # Use Django's built-in URLValidator for validation
        url_validator = URLValidator()
        try:
            url_validator(value)
        except ValidationError:
            raise serializers.ValidationError({"error": "Invalid URL format."})

        return value

    # Validation if url already exists
    def create(self, validated_data):
        if IssueLink.objects.filter(
            url=validated_data.get("url"), issue_id=validated_data.get("issue_id")
        ).exists():
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )
        return IssueLink.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if (
            IssueLink.objects.filter(
                url=validated_data.get("url"), issue_id=instance.issue_id
            )
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )

        return super().update(instance, validated_data)


class EpicAttachmentSerializer(BaseSerializer):
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
            "issue",
        ]


class EpicSerializer(DynamicBaseSerializer):
    # ids
    cycle_id = serializers.PrimaryKeyRelatedField(read_only=True)
    module_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    # Many to many
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    assignee_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    # Count items
    sub_issues_count = serializers.IntegerField(read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)
    link_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "state_id",
            "sort_order",
            "completed_at",
            "estimate_point",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
            "project_id",
            "parent_id",
            "cycle_id",
            "module_ids",
            "label_ids",
            "assignee_ids",
            "sub_issues_count",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "attachment_count",
            "link_count",
            "is_draft",
            "archived_at",
            "type_id",
        ]
        read_only_fields = fields


class EpicDetailSerializer(EpicSerializer):
    description_html = serializers.CharField()
    is_subscribed = serializers.BooleanField(read_only=True)
    customer_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    customer_request_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
    initiative_ids = serializers.ListField(read_only=True)

    class Meta(EpicSerializer.Meta):
        fields = EpicSerializer.Meta.fields + [
            "description_html",
            "is_subscribed",
            "customer_ids",
            "customer_request_ids",
            "initiative_ids",
        ]
        read_only_fields = fields


class EpicCommentSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    comment_reactions = CommentReactionSerializer(read_only=True, many=True)
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = IssueComment
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class EpicTypeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = ["workspace", "project", "is_default", "deleted_at"]


class EpicUserPropertySerializer(BaseSerializer):
    class Meta:
        model = EpicUserProperties
        fields = "__all__"
        read_only_fields = ["user", "workspace", "project"]


class EpicReactionSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssueReaction
        fields = "__all__"
        read_only_fields = ["workspace", "project", "issue", "actor", "deleted_at"]


class EpicSubscriberSerializer(BaseSerializer):
    class Meta:
        model = IssueSubscriber
        fields = "__all__"
        read_only_fields = ["workspace", "project", "issue"]
