# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django imports
from django.utils import timezone
from lxml import html
from django.db import IntegrityError
from django.db.models import Q

#  Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import (
    BotTypeEnum,
    Issue,
    IssueType,
    IssueActivity,
    IssueAssignee,
    FileAsset,
    IssueComment,
    IssueLabel,
    IssueLink,
    IssueRelation,
    Label,
    ProjectMember,
    State,
    User,
    EstimatePoint,
)
from plane.bgtasks.notification_task import extract_comment_mentions
from plane.utils.content_validator import (
    validate_html_content,
    validate_binary_data,
)

from .base import BaseSerializer
from .cycle import CycleLiteSerializer, CycleSerializer
from .module import ModuleLiteSerializer, ModuleSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator


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

    class Meta:
        model = Issue
        read_only_fields = ["id", "workspace", "project", "updated_by", "updated_at", "completed_at"]
        exclude = ["description_json", "description_stripped"]

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
            valid_assignee_ids = set(
                ProjectMember.objects.filter(
                    project_id=self.context.get("project_id"),
                    is_active=True,
                    role__gte=15,
                    member_id__in=data["assignees"],
                ).values_list("member_id", flat=True)
            )
            invalid_assignee_ids = set(data["assignees"]) - valid_assignee_ids
            if invalid_assignee_ids:
                raise serializers.ValidationError(
                    f"Assignees {list(invalid_assignee_ids)} are not active members of this project"
                )
            data["assignees"] = list(valid_assignee_ids)

        # Validate labels are from project
        if data.get("labels", []):
            valid_label_ids = set(
                Label.objects.filter(
                    project_id=self.context.get("project_id"), id__in=data["labels"]
                ).values_list("id", flat=True)
            )
            invalid_label_ids = set(data["labels"]) - valid_label_ids
            if invalid_label_ids:
                raise serializers.ValidationError(f"Labels {list(invalid_label_ids)} do not belong to this project")
            data["labels"] = list(valid_label_ids)

        # Check state is from the project only else raise validation error
        if (
            data.get("state")
            and not State.objects.filter(project_id=self.context.get("project_id"), pk=data.get("state").id).exists()
        ):
            raise serializers.ValidationError("State is not valid please pass a valid state_id")

        # Check parent issue is from workspace as it can be cross workspace
        if (
            data.get("parent")
            and not Issue.objects.filter(
                workspace_id=self.context.get("workspace_id"),
                project_id=self.context.get("project_id"),
                pk=data.get("parent").id,
            ).exists()
        ):
            raise serializers.ValidationError("Parent is not valid issue_id please pass a valid issue_id")

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
            IssueAssignee.objects.filter(issue=instance).delete()
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
                        for assignee_id in assignees
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if labels is not None:
            IssueLabel.objects.filter(issue=instance).delete()
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
                        for label_id in labels
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        # Time updation occues even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)

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


class IssueRelationRefSerializer(serializers.Serializer):
    """Project-scoped reference to a related work item."""

    project_id = serializers.UUIDField(help_text="Project containing the related work item")
    issue_id = serializers.UUIDField(help_text="ID of the related work item")


class IssueRelationResponseSerializer(serializers.Serializer):
    """
    Serializer for issue relations response showing grouped relation types.

    Each list contains project_id and issue_id pairs so clients can resolve
    cross-project relations.
    """

    blocking = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items blocking this issue",
    )
    blocked_by = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items this issue is blocked by",
    )
    duplicate = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Duplicate work items",
    )
    relates_to = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Related work items",
    )
    start_after = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items that start after this issue",
    )
    start_before = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items that start before this issue",
    )
    finish_after = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items that finish after this issue",
    )
    finish_before = serializers.ListField(
        child=IssueRelationRefSerializer(),
        help_text="Work items that finish before this issue",
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
    project_id = serializers.UUIDField(source="related_issue.project_id", read_only=True)
    sequence_id = serializers.IntegerField(source="related_issue.sequence_id", read_only=True)
    name = serializers.CharField(source="related_issue.name", read_only=True)
    relation_type = serializers.CharField(read_only=True)
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


# The editor represents an in-text user mention as a ``<mention-component>`` node
# tagged with ``entity_name="user_mention"``. The reference/notification pipeline
# (see ``plane.bgtasks.notification_task.extract_comment_mentions``) parses
# ``comment_html`` for exactly these tags, so rendering the same markup server-side
# is what makes an API-supplied mention behave like one typed in the web app.
USER_MENTION_ENTITY_NAME = "user_mention"


def render_user_mention(user_id) -> str:
    """Render the internal editor markup for a single user mention.

    Mirrors the ``<mention-component>`` node produced by the web editor. The
    ``id`` attribute is a per-node identifier (the editor uses a random UUID);
    ``entity_identifier`` carries the mentioned user's id and ``entity_name`` is
    fixed to ``user_mention`` so the notification pipeline recognises it.
    """
    return (
        f'<mention-component id="{uuid.uuid4()}" '
        f'entity_identifier="{user_id}" '
        f'entity_name="{USER_MENTION_ENTITY_NAME}"></mention-component>'
    )


def append_user_mentions(comment_html, user_ids) -> str:
    """Append user mention markup to a comment's HTML body.

    The mentions are added as a trailing paragraph so the markup round-trips
    through the editor's block-based document model.
    """
    mention_markup = " ".join(render_user_mention(user_id) for user_id in user_ids)
    return f"{comment_html or ''}<p>{mention_markup}</p>"


class IssueCommentCreateSerializer(BaseSerializer):
    """
    Serializer for creating work item comments.

    Handles comment creation with JSON and HTML content support,
    access control, and external integration tracking. Accepts an optional
    ``mentions`` list of user ids; the corresponding mention markup is rendered
    into ``comment_html`` server-side so mentioned users are notified without the
    caller having to hand-craft ``<mention-component>`` tags.
    """

    # The `values_list("id", flat=True)` queryset makes each PrimaryKeyRelatedField
    # child resolve to the user's UUID (not a User instance). validate() below relies
    # on this: it filters ProjectMember with `member_id__in=<uuids>` and tests
    # `user_id in valid_member_ids` (a set of UUIDs). Do NOT change this to a queryset
    # of User instances — those comparisons would break. This mirrors the `assignees`
    # and `labels` fields on IssueSerializer.
    mentions = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.values_list("id", flat=True)),
        write_only=True,
        required=False,
        # Bound the input so a single comment cannot render an unbounded amount of
        # mention markup / drive an unbounded member_id__in query. 100 comfortably
        # covers any realistic mention set while preventing abuse.
        max_length=100,
        help_text=(
            "List of user ids to mention in the comment (max 100). Each id must belong to an "
            "existing user (unknown ids are rejected). Only active project members that are "
            "human users or service accounts (bot_type=SERVICE) can be mentioned; other bots "
            "(e.g. workspace-seed) are ignored. The server renders the mention markup into "
            "comment_html and notifies the mentioned users."
        ),
    )

    class Meta:
        model = IssueComment
        fields = [
            "comment_json",
            "comment_html",
            "access",
            "external_source",
            "external_id",
            "mentions",
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

    def validate(self, data):
        # Render server-side mention markup for the supplied user ids. Unknown user
        # ids are already rejected by the field above; here we keep only active
        # project members that can receive a mention and ignore the rest, mirroring
        # assignee/label handling and the notification pipeline's own member filter
        # (bgtasks.notification_task).
        #
        # Mentionable = human users OR service accounts (bot_type=SERVICE); service
        # accounts are first-class actors that external systems react to via webhooks.
        # Other bots (e.g. workspace-seed) are excluded — they have no notification
        # preference and are not addressable teammates. The Q(...) is passed as the
        # leading positional filter arg per Django's requirement.
        mention_user_ids = data.pop("mentions", None)
        if mention_user_ids:
            valid_member_ids = set(
                ProjectMember.objects.filter(
                    Q(member__is_bot=False) | Q(member__bot_type=BotTypeEnum.SERVICE),
                    project_id=self.context.get("project_id"),
                    is_active=True,
                    member_id__in=mention_user_ids,
                ).values_list("member_id", flat=True)
            )

            # Preserve caller order and de-duplicate the mentioned users.
            ordered_mentions = []
            seen = set()
            for user_id in mention_user_ids:
                if user_id in valid_member_ids and user_id not in seen:
                    seen.add(user_id)
                    ordered_mentions.append(user_id)

            if ordered_mentions:
                base_html = data.get("comment_html")
                if base_html is None and self.instance is not None:
                    base_html = self.instance.comment_html
                base_html = base_html or ""
                # Skip users already mentioned in the body so repeated updates stay
                # idempotent instead of accumulating duplicate mention markup. The body
                # is parsed for real <mention-component> nodes — using the same parser
                # the notification pipeline uses — rather than substring-matching the
                # id, which would false-positive on an id that merely appears as text
                # or in some other attribute and silently drop the mention.
                already_mentioned = set(extract_comment_mentions(base_html))
                new_mentions = [user_id for user_id in ordered_mentions if str(user_id) not in already_mentioned]
                if new_mentions:
                    data["comment_html"] = append_user_mentions(base_html, new_mentions)

        # Sanitize the (possibly mention-augmented) HTML with the same rules the
        # internal app applies, so external clients cannot store unsafe or invalid
        # markup. This runs after mention rendering; the whitelisted
        # <mention-component> markup survives sanitization.
        if data.get("comment_html"):
            is_valid, error_msg, sanitized_html = validate_html_content(data["comment_html"])
            if not is_valid:
                raise serializers.ValidationError({"comment_html": "HTML content is not valid"})
            if sanitized_html is not None:
                data["comment_html"] = sanitized_html

        return data


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
        exclude = ["comment_stripped", "comment_json"]

    def validate(self, data):
        if "comment_html" in data and data["comment_html"]:
            is_valid, error_msg, sanitized_html = validate_html_content(data["comment_html"])
            if not is_valid:
                raise serializers.ValidationError({"comment_html": "HTML content is not valid"})
            if sanitized_html is not None:
                data["comment_html"] = sanitized_html
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
    description = serializers.JSONField(source="description_json", read_only=True)

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
            "completed_at",
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


class IssueSearchSerializer(serializers.Serializer):
    """
    Serializer for work item search result data formatting.

    Provides standardized search result structure including work item identifiers,
    project context, and workspace information for search API responses.
    """

    id = serializers.CharField(required=True, help_text="Issue ID")
    name = serializers.CharField(required=True, help_text="Issue name")
    sequence_id = serializers.CharField(required=True, help_text="Issue sequence ID")
    project__identifier = serializers.CharField(required=True, help_text="Project identifier")
    project_id = serializers.CharField(required=True, help_text="Project ID")
    workspace__slug = serializers.CharField(required=True, help_text="Workspace slug")
