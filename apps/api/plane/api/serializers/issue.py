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
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

#  Third party imports
from lxml import html
from rest_framework import serializers

# Module imports
from plane.db.models import (
    Issue,
    IssueType,
    IssueActivity,
    IssueAssignee,
    IssueRelation,
    FileAsset,
    IssueComment,
    IssueLabel,
    IssueLink,
    Label,
    ProjectMember,
    State,
    User,
    EstimatePoint,
    IssueVote,
)
from plane.utils.content_validator import (
    validate_html_content,
    validate_binary_data,
)
from plane.ee.models import WorkspaceFeature
from .base import BaseSerializer
from .cycle import CycleLiteSerializer, CycleSerializer
from .module import ModuleLiteSerializer, ModuleSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer
from .issue_type import IssueTypeAPISerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.issue_type_hierarchy import validate_type_hierarchy


class IssueSerializer(BaseSerializer):
    """
    Comprehensive work item serializer with full relationship management.

    Handles complete work item lifecycle including assignees, labels, validation,
    and related model updates. Supports dynamic field expansion and HTML content
    processing.
    """

    assignees = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.values_list("id", flat=True)),
        write_only=True,
        required=False,
    )

    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.values_list("id", flat=True)),
        write_only=True,
        required=False,
    )
    type_id = serializers.PrimaryKeyRelatedField(
        source="type", queryset=IssueType.objects.all(), required=False, allow_null=True
    )
    parent = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Issue
        read_only_fields = ["id", "workspace", "project", "updated_by", "updated_at"]
        exclude = ["description_json"]

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")

        try:
            if data.get("description_html", None) is not None:
                parsed = html.fromstring(data["description_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["description_html"] = parsed_str

        except Exception:
            raise serializers.ValidationError("Invalid HTML passed")

        # Validate description content for security
        if data.get("description_html"):
            is_valid, error_msg, sanitized_html = validate_html_content(data["description_html"])
            if not is_valid:
                raise serializers.ValidationError({"error": "html content is not valid"})
            # Update the data with sanitized HTML if available
            if sanitized_html is not None:
                data["description_html"] = sanitized_html

        if data.get("description_binary"):
            is_valid, error_msg = validate_binary_data(data["description_binary"])
            if not is_valid:
                raise serializers.ValidationError({"description_binary": "Invalid binary data"})

        # Validate assignees are from project
        if data.get("assignees", []):
            existing_project_member_ids = list(
                ProjectMember.objects.filter(
                    project_id=self.context.get("project_id"),
                    role__gte=15,
                ).values_list("member_id", flat=True)
            )

            # Fetch assignees that are not part of the project
            invalid_assignee_ids = set(data.get("assignees")) - set(existing_project_member_ids)

            if invalid_assignee_ids:
                raise serializers.ValidationError({"assignees": {"invalid_member_ids": invalid_assignee_ids}})

        # Validate labels are from project
        if data.get("labels", []):
            data["labels"] = Label.objects.filter(
                project_id=self.context.get("project_id"), id__in=data["labels"]
            ).values_list("id", flat=True)

        # Check state is from the project only else raise validation error
        if (
            data.get("state")
            and not State.objects.filter(project_id=self.context.get("project_id"), pk=data.get("state").id).exists()
        ):
            raise serializers.ValidationError("State is not valid please pass a valid state_id")

        workspace_feature = WorkspaceFeature.objects.filter(
            workspace__slug=self.context.get("slug"),
        ).first()

        hierarchy_enabled = workspace_feature.is_workitem_hierarchy_enabled if workspace_feature else False
        is_workitem_hierarchy_enabled = (
            check_workspace_feature_flag(
                feature_key=FeatureFlag.WORKITEM_TYPE_HIERARCHY,
                user_id=self.context.get("user_id"),
                slug=self.context.get("slug"),
            )
            and hierarchy_enabled
        )

        # Check parent issue is from workspace as it can be cross workspace
        if data.get("type") and self.instance is not None:
            parent_level = (
                self.instance.parent.type.level if self.instance.parent and self.instance.parent.type else None
            )
            child_level = Issue.objects.filter(parent=self.instance).select_related("type").first()
            child_level = child_level.type.level if child_level and child_level.type else None

            # Validate type hierarchy with parent
            # Validate type hierarchy with parent
            is_valid, error_msg = validate_type_hierarchy(parent_level, data["type"].level)
            if not is_valid:
                raise serializers.ValidationError({"type": error_msg}, code="invalid_type_hierarchy")

            # If the issue type is being updated, also validate the type hierarchy with its children
            is_valid, error_msg = validate_type_hierarchy(data["type"].level, child_level)
            if not is_valid:
                raise serializers.ValidationError({"type": error_msg}, code="invalid_type_hierarchy")
        # Check parent issue is from workspace as it can be cross workspace
        if data.get("parent"):
            parent_issue = (
                Issue.objects.filter(
                    workspace__slug=self.context.get("slug"),
                    pk=data.get("parent").id,
                )
                .select_related("type")
                .first()
            )

            if not parent_issue:
                raise serializers.ValidationError(
                    {"parent": "Parent is not a valid issue_id, please pass a valid issue_id"}, code="invalid_parent_id"
                )

            # Check workitem hierarchy
            if is_workitem_hierarchy_enabled:
                # Validate type hierarchy with parent
                child_type = data.get("type") if data.get("type") else self.instance.type
                if not child_type:
                    child_type = (
                        IssueType.objects.filter(
                            workspace__slug=self.context.get("slug"),
                        )
                        .order_by("level")
                        .first()
                    )

                child_level = child_type.level if child_type else 0
                parent_level = parent_issue.type.level if parent_issue.type_id and parent_issue.type else 0

                is_valid, error_msg = validate_type_hierarchy(parent_level, child_level)
                if not is_valid:
                    raise serializers.ValidationError({"type": error_msg}, code="invalid_type_hierarchy")

        if (
            data.get("estimate_point")
            and not EstimatePoint.objects.filter(
                workspace_id=self.context.get("workspace_id"),
                project_id=self.context.get("project_id"),
                pk=data.get("estimate_point").id,
            ).exists()
        ):
            raise serializers.ValidationError("Estimate point is not valid please pass a valid estimate_point_id")

        return data

    def create(self, validated_data):
        assignees = validated_data.pop("assignees", None)
        labels = validated_data.pop("labels", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        default_assignee_id = self.context["default_assignee_id"]

        issue_type = validated_data.pop("type", None)

        if not issue_type:
            # Get default issue type
            issue_type = IssueType.objects.filter(project_issue_types__project_id=project_id, is_default=True).first()
            issue_type = issue_type

        issue = Issue.objects.create(**validated_data, project_id=project_id, type=issue_type)

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if assignees is not None and len(assignees):
            try:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=assignee_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for assignee_id in assignees
                    ],
                    batch_size=10,
                )
            except IntegrityError:
                pass
        else:
            try:
                # Then assign it to default assignee, if it is a valid assignee
                if (
                    default_assignee_id is not None
                    and ProjectMember.objects.filter(
                        member_id=default_assignee_id,
                        project_id=project_id,
                        role__gte=15,
                        is_active=True,
                    ).exists()
                ):
                    IssueAssignee.objects.create(
                        assignee_id=default_assignee_id,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
            except IntegrityError:
                pass

        if labels is not None and len(labels):
            try:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label_id in labels
                    ],
                    batch_size=10,
                )
            except IntegrityError:
                pass

        return issue

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignees", None)
        labels = validated_data.pop("labels", None)

        # Related models
        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if assignees is not None:
            # Get the current assignees
            current_assignees = IssueAssignee.objects.filter(issue=instance).values_list("assignee_id", flat=True)

            # Get the assignees to add
            assignees_to_add = list(set(assignees) - set(current_assignees))

            # Get the assignees to remove
            assignees_to_remove = list(set(current_assignees) - set(assignees))

            # Delete the assignees to remove
            IssueAssignee.objects.filter(issue=instance, assignee_id__in=assignees_to_remove).delete()

            try:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=assignee_id,
                            issue=instance,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for assignee_id in assignees_to_add
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if labels is not None:
            # Get the current labels
            current_labels = IssueLabel.objects.filter(issue=instance).values_list("label_id", flat=True)

            # Get the labels to add
            labels_to_add = list(set(labels) - set(current_labels))

            # Get the labels to remove
            labels_to_remove = list(set(current_labels) - set(labels))

            # Delete the labels to remove
            IssueLabel.objects.filter(issue=instance, label_id__in=labels_to_remove).delete()

            # Create the labels to add
            try:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label_id,
                            issue=instance,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label_id in labels_to_add
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if validated_data:
            return super().update(instance, validated_data)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if "assignees" in self.fields:
            if "assignees" in self.expand:
                from .user import UserLiteSerializer

                data["assignees"] = UserLiteSerializer(
                    User.objects.filter(
                        pk__in=IssueAssignee.objects.filter(issue=instance).values_list("assignee_id", flat=True)
                    ),
                    many=True,
                ).data
            else:
                data["assignees"] = [
                    str(assignee)
                    for assignee in IssueAssignee.objects.filter(issue=instance).values_list("assignee_id", flat=True)
                ]
        if "labels" in self.fields:
            if "labels" in self.expand:
                data["labels"] = LabelSerializer(
                    Label.objects.filter(
                        pk__in=IssueLabel.objects.filter(issue=instance).values_list("label_id", flat=True)
                    ),
                    many=True,
                ).data
            else:
                data["labels"] = [
                    str(label) for label in IssueLabel.objects.filter(issue=instance).values_list("label_id", flat=True)
                ]

        if "type" in self.fields:
            if "type" in self.expand:
                data["type"] = IssueTypeAPISerializer(instance.type).data

        return data


class IssueLiteSerializer(BaseSerializer):
    """
    Lightweight work item serializer for minimal data transfer.

    Provides essential work item identifiers optimized for list views,
    references, and performance-critical operations.
    """

    class Meta:
        model = Issue
        fields = ["id", "sequence_id", "project_id"]
        read_only_fields = fields


class LabelCreateUpdateSerializer(BaseSerializer):
    """
    Serializer for creating and updating work item labels.

    Manages label metadata including colors, descriptions, hierarchy,
    and sorting for work item categorization and filtering.
    """

    class Meta:
        model = Label
        fields = [
            "name",
            "color",
            "description",
            "external_source",
            "external_id",
            "parent",
            "sort_order",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class LabelSerializer(BaseSerializer):
    """
    Full serializer for work item labels with complete metadata.

    Provides comprehensive label information including hierarchical relationships,
    visual properties, and organizational data for work item tagging.
    """

    class Meta:
        model = Label
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class IssueLinkCreateSerializer(BaseSerializer):
    """
    Serializer for creating work item external links with validation.

    Handles URL validation, format checking, and duplicate prevention
    for attaching external resources to work items.
    """

    class Meta:
        model = IssueLink
        fields = ["title", "url", "issue_id"]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
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
        if IssueLink.objects.filter(url=validated_data.get("url"), issue_id=validated_data.get("issue_id")).exists():
            raise serializers.ValidationError({"error": "URL already exists for this Issue"})
        return IssueLink.objects.create(**validated_data)


class IssueLinkUpdateSerializer(IssueLinkCreateSerializer):
    """
    Serializer for updating work item external links.

    Extends link creation with update-specific validation to prevent
    URL conflicts and maintain link integrity during modifications.
    """

    class Meta(IssueLinkCreateSerializer.Meta):
        model = IssueLink
        fields = IssueLinkCreateSerializer.Meta.fields + [
            "issue_id",
        ]
        read_only_fields = IssueLinkCreateSerializer.Meta.read_only_fields

    def update(self, instance, validated_data):
        if (
            IssueLink.objects.filter(url=validated_data.get("url"), issue_id=instance.issue_id)
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError({"error": "URL already exists for this Issue"})

        return super().update(instance, validated_data)


class IssueLinkSerializer(BaseSerializer):
    """
    Full serializer for work item external links.

    Provides complete link information including metadata and timestamps
    for managing external resource associations with work items.
    """

    class Meta:
        model = IssueLink
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueAttachmentSerializer(BaseSerializer):
    """
    Serializer for work item file attachments.

    Manages file asset associations with work items including metadata,
    storage information, and access control for document management.
    """

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "updated_by",
            "updated_at",
        ]


class IssueCommentCreateSerializer(BaseSerializer):
    """
    Serializer for creating work item comments.

    Handles comment creation with JSON and HTML content support,
    access control, and external integration tracking.
    """

    class Meta:
        model = IssueComment
        fields = [
            "comment_json",
            "comment_html",
            "access",
            "external_source",
            "external_id",
            "parent",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "actor",
            "comment_stripped",
            "edited_at",
        ]


class IssueCommentSerializer(BaseSerializer):
    """
    Full serializer for work item comments with membership context.

    Provides complete comment data including member status, content formatting,
    and edit tracking for collaborative work item discussions.
    """

    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = IssueComment
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        exclude = ["comment_json"]

    def validate(self, data):
        try:
            if data.get("comment_html", None) is not None:
                parsed = html.fromstring(data["comment_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["comment_html"] = parsed_str

        except Exception:
            raise serializers.ValidationError("Invalid HTML passed")
        return data


class IssueActivitySerializer(BaseSerializer):
    """
    Serializer for work item activity and change history.

    Tracks and represents work item modifications, state changes,
    and user interactions for audit trails and activity feeds.
    """

    class Meta:
        model = IssueActivity
        exclude = ["created_by", "updated_by"]


class CycleIssueSerializer(BaseSerializer):
    """
    Serializer for work items within cycles.

    Provides cycle context for work items including cycle metadata
    and timing information for sprint and iteration management.
    """

    cycle = CycleSerializer(read_only=True)

    class Meta:
        fields = ["cycle"]


class ModuleIssueSerializer(BaseSerializer):
    """
    Serializer for work items within modules.

    Provides module context for work items including module metadata
    and organizational information for feature-based work grouping.
    """

    module = ModuleSerializer(read_only=True)

    class Meta:
        fields = ["module"]


class LabelLiteSerializer(BaseSerializer):
    """
    Lightweight label serializer for minimal data transfer.

    Provides essential label information with visual properties,
    optimized for UI display and performance-critical operations.
    """

    class Meta:
        model = Label
        fields = ["id", "name", "color"]


class IssueExpandSerializer(BaseSerializer):
    """
    Extended work item serializer with full relationship expansion.

    Provides work items with expanded related data including cycles, modules,
    labels, assignees, and states for comprehensive data representation.
    """

    cycle = CycleLiteSerializer(source="issue_cycle.cycle", read_only=True)
    module = ModuleLiteSerializer(source="issue_module.module", read_only=True)

    labels = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    state = StateLiteSerializer(read_only=True)
    description = serializers.JSONField(source="description_json", required=False, allow_null=True)

    def get_labels(self, obj):
        expand = self.context.get("expand", [])
        if "labels" in expand:
            # Use prefetched data
            return LabelLiteSerializer([il.label for il in obj.label_issue.all()], many=True).data
        return [il.label_id for il in obj.label_issue.all()]

    def get_assignees(self, obj):
        expand = self.context.get("expand", [])
        if "assignees" in expand:
            return UserLiteSerializer([ia.assignee for ia in obj.issue_assignee.all()], many=True).data
        return [ia.assignee_id for ia in obj.issue_assignee.all()]

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueAttachmentUploadSerializer(serializers.Serializer):
    """
    Serializer for work item attachment upload request validation.

    Handles file upload metadata validation including size, type, and external
    integration tracking for secure work item document attachment workflows.
    """

    name = serializers.CharField(help_text="Original filename of the asset")
    type = serializers.CharField(required=False, help_text="MIME type of the file")
    size = serializers.IntegerField(help_text="File size in bytes")
    external_id = serializers.CharField(
        required=False,
        help_text="External identifier for the asset (for integration tracking)",
    )
    external_source = serializers.CharField(
        required=False, help_text="External source system (for integration tracking)"
    )


class IssueSearchItemSerializer(serializers.Serializer):
    """
    Individual issue component for search results.

    Provides standardized search result structure including work item identifiers,
    project context, and workspace information for search API responses.
    """

    id = serializers.CharField(required=True, help_text="Issue ID")
    name = serializers.CharField(required=True, help_text="Issue name")
    sequence_id = serializers.CharField(required=True, help_text="Issue sequence ID")
    project__identifier = serializers.CharField(required=True, help_text="Project identifier")
    project_id = serializers.CharField(required=True, help_text="Project ID")
    workspace__slug = serializers.CharField(required=True, help_text="Workspace slug")


class IssueSearchSerializer(serializers.Serializer):
    """
    Search results for work items.

    Provides list of issues with their identifiers, names, and project context.
    """

    issues = IssueSearchItemSerializer(many=True)


class IssueRelationResponseSerializer(serializers.Serializer):
    """
    Serializer for issue relations response showing grouped relation types.

    Returns issue IDs organized by relation type for efficient client-side processing.
    """

    blocking = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that are blocking this issue",
    )
    blocked_by = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that this issue is blocked by",
    )
    duplicate = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that are duplicates of this issue",
    )
    relates_to = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that relate to this issue",
    )
    start_after = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that start after this issue",
    )
    start_before = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that start before this issue",
    )
    finish_after = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that finish after this issue",
    )
    finish_before = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of issue IDs that finish before this issue",
    )


class IssueRelationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating issue relations.

    Creates issue relations with the specified relation type and issues.
    Validates relation types and ensures proper issue ID format.
    """

    RELATION_TYPE_CHOICES = [
        ("blocking", "Blocking"),
        ("blocked_by", "Blocked By"),
        ("duplicate", "Duplicate"),
        ("relates_to", "Relates To"),
        ("start_before", "Start Before"),
        ("start_after", "Start After"),
        ("finish_before", "Finish Before"),
        ("finish_after", "Finish After"),
    ]

    relation_type = serializers.ChoiceField(
        choices=RELATION_TYPE_CHOICES,
        required=True,
        help_text="Type of relationship between work items",
    )
    issues = serializers.ListField(
        child=serializers.UUIDField(),
        required=True,
        min_length=1,
        help_text="Array of work item IDs to create relations with",
    )

    def validate_issues(self, value):
        """Validate that issues list is not empty and contains valid UUIDs."""
        if not value:
            raise serializers.ValidationError("At least one issue ID is required.")
        return value


class IssueRelationRemoveSerializer(serializers.Serializer):
    """
    Serializer for removing issue relations.

    Removes existing relationships between work items by specifying
    the related issue ID.
    """

    related_issue = serializers.UUIDField(
        required=True, help_text="ID of the related work item to remove relation with"
    )


class IssueRelationSerializer(BaseSerializer):
    """
    Serializer for issue relationships showing related issue details.

    Provides comprehensive information about related issues including
    project context, sequence ID, and relationship type.
    """

    id = serializers.UUIDField(source="related_issue.id", read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(source="related_issue.project_id", read_only=True)
    sequence_id = serializers.IntegerField(source="related_issue.sequence_id", read_only=True)
    name = serializers.CharField(source="related_issue.name", read_only=True)
    type_id = serializers.UUIDField(source="related_issue.type.id", read_only=True)
    relation_type = serializers.CharField(read_only=True)
    is_epic = serializers.BooleanField(source="related_issue.type.is_epic", read_only=True)
    state_id = serializers.UUIDField(source="related_issue.state.id", read_only=True)
    priority = serializers.CharField(source="related_issue.priority", read_only=True)

    class Meta:
        model = IssueRelation
        fields = [
            "id",
            "project_id",
            "sequence_id",
            "relation_type",
            "name",
            "type_id",
            "is_epic",
            "state_id",
            "priority",
            "created_by",
            "created_at",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class RelatedIssueSerializer(BaseSerializer):
    """
    Serializer for reverse issue relationships showing issue details.

    Provides comprehensive information about the source issue in a relationship
    including project context, sequence ID, and relationship type.
    """

    id = serializers.UUIDField(source="issue.id", read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(source="issue.project_id", read_only=True)
    sequence_id = serializers.IntegerField(source="issue.sequence_id", read_only=True)
    name = serializers.CharField(source="issue.name", read_only=True)
    type_id = serializers.UUIDField(source="issue.type.id", read_only=True)
    relation_type = serializers.CharField(read_only=True)
    is_epic = serializers.BooleanField(source="issue.type.is_epic", read_only=True)
    state_id = serializers.UUIDField(source="issue.state.id", read_only=True)
    priority = serializers.CharField(source="issue.priority", read_only=True)

    class Meta:
        model = IssueRelation
        fields = [
            "id",
            "project_id",
            "sequence_id",
            "relation_type",
            "name",
            "type_id",
            "is_epic",
            "state_id",
            "priority",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class IssueDetailSerializer(IssueSerializer):
    """
    Comprehensive work item serializer with full relationship management.

    Handles complete work item lifecycle including assignees, labels, validation,
    and related model updates. Supports dynamic field expansion and HTML content processing.
    """

    assignees = UserLiteSerializer(many=True)

    labels = LabelSerializer(many=True)

    type_id = serializers.PrimaryKeyRelatedField(
        source="type", queryset=IssueType.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Issue
        read_only_fields = ["id", "workspace", "project", "updated_by", "updated_at"]
        exclude = ["description_json"]


class IssueVoteSerializer(BaseSerializer):
    def validate(self, attrs):
        vote_value = attrs.get("vote")
        if vote_value not in (-1, 1):
            raise serializers.ValidationError("Vote must be 1 (upvote) or -1 (downvote).")
        return attrs

    def create(self, validated_data):
        issue_id = self.context.get("issue_id")
        project_id = self.context.get("project_id")
        user = self.context.get("user")
        vote_value = validated_data.get("vote", 1)
        issue_vote = IssueVote.log_issue_vote(
            issue_id=issue_id,
            user=user,
            project_id=project_id,
            vote_value=vote_value,
        )
        return issue_vote

    class Meta:
        model = IssueVote
        fields = (
            "id",
            "issue",
            "vote",
            "project",
            "actor",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "issue",
            "project",
            "actor",
            "created_at",
            "updated_at",
        )
