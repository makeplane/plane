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

# Third party imports
from rest_framework import serializers
from typing import Dict, Any

# Module imports
from plane.app.serializers import IssueSerializer
from plane.app.serializers.base import BaseSerializer
from plane.db.models import Issue, State, ProjectIssueType, StateGroup


class IssueImportSerializer(BaseSerializer):
    """
    Import serializer for creating issues from CSV data.

    Accepts simple direct fields and resolves state from state_group.

    Context (required):
        - project_id: UUID of the project

    Context (optional, for bulk optimization):
        Use build_context(project_id) to pre-fetch all required data:
        - state_map: Dict mapping state_group -> State instance
        - default_state: Default State instance
        - issue_types: List of IssueType instances
        - default_issue_type: Default IssueType instance
    """

    state_group = serializers.ChoiceField(
        choices=StateGroup.choices,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="State group to resolve state from: backlog, unstarted, started, completed, cancelled",
    )

    # Explicitly define fields to handle blank CSV values
    description_html = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Issue description in HTML format",
    )
    priority = serializers.ChoiceField(
        choices=Issue.PRIORITY_CHOICES,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Issue priority",
    )
    start_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Issue start date (YYYY-MM-DD format)",
    )
    target_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Issue target/due date (YYYY-MM-DD format)",
    )

    class Meta:
        model = Issue
        fields = [
            "name",
            "description_html",
            "priority",
            "start_date",
            "target_date",
            "state_group",
        ]

    @staticmethod
    def build_context(project_id) -> Dict[str, Any]:
        """
        Pre-fetch all required data for bulk import optimization.

        Call this once before processing multiple rows to avoid N+1 queries.

        Args:
            project_id: The project UUID

        Returns:
            Dict containing:
            - state_map: {state_group: State} mapping
            - default_state: The project's default State
            - issue_types: List of IssueType instances for the project
            - default_issue_type: The default IssueType for the project
        """
        # Fetch and map states by group
        states = State.objects.filter(project_id=project_id).order_by("group", "sequence")
        state_map = {}
        default_state = None

        for state in states:
            # Take first state per group (lowest sequence)
            if state.group not in state_map:
                state_map[state.group] = state
            # Track default state
            if state.default:
                default_state = state

        # Fetch project issue types with related issue type data
        project_issue_types = (
            ProjectIssueType.objects.filter(project_id=project_id).select_related("issue_type").order_by("level")
        )

        # Extract issue types and find default
        issue_types = []
        default_issue_type = None

        for pit in project_issue_types:
            if pit.issue_type and pit.issue_type.is_active:
                issue_types.append(pit.issue_type)
                if pit.is_default:
                    default_issue_type = pit.issue_type

        # Fallback to first issue type if no default found
        if not default_issue_type and issue_types:
            default_issue_type = issue_types[0]

        return {
            "state_map": state_map,
            "default_state": default_state,
            "issue_types": issue_types,
            "default_issue_type": default_issue_type,
        }

    def to_internal_value(self, data):
        # Normalize empty or whitespace-only date values to None
        start_date = data.get("start_date")
        if not start_date or (isinstance(start_date, str) and start_date.strip() == ""):
            data["start_date"] = None

        target_date = data.get("target_date")
        if not target_date or (isinstance(target_date, str) and target_date.strip() == ""):
            data["target_date"] = None

        return super(IssueImportSerializer, self).to_internal_value(data)

    def validate_description_html(self, value):
        """Convert blank/empty descriptions to default paragraph."""
        if not value or value.strip() == "":
            return "<p></p>"
        return value

    def validate_priority(self, value):
        """Convert blank priority to 'none'."""
        if not value or value == "":
            return "none"
        return value

    def _resolve_state(self, state_group):
        """
        Resolve state from state_group using cached map or query.

        Args:
            state_group: The state group name (backlog, unstarted, etc.)

        Returns:
            State instance or None
        """
        if self.context.get("state_map") is None:
            self.context.update(self.build_context(self.context["project_id"]))

        state_map = self.context.get("state_map")
        default_state = self.context.get("default_state")

        if not state_group:
            return default_state
        return state_map.get(state_group)

    def validate(self, attrs):
        """Validate date constraints."""
        start_date = attrs.get("start_date")
        target_date = attrs.get("target_date")

        if start_date and target_date and start_date > target_date:
            raise serializers.ValidationError({"target_date": "Target date cannot be earlier than start date."})

        return attrs

    def create(self, validated_data):
        """
        Create an Issue instance from validated data.

        Resolves state from state_group, assigns default issue type if available,
        and marks external_source as csv.
        """
        project_id = self.context["project_id"]

        # Extract state_group (not a model field)
        state_group = validated_data.pop("state_group", None)

        # Resolve state from state_group
        state = self._resolve_state(state_group)

        # Get default issue type from context if available
        default_issue_type = self.context.get("default_issue_type")
        type_id = default_issue_type.id if default_issue_type else None

        # Create issue manually to handle created_by_id
        issue = Issue(
            **validated_data,
            project_id=project_id,
            state=state,
            type_id=type_id,
            external_source="csv",
        )
        issue.save(created_by_id=self.context.get("created_by_id"))

        return issue


class IssueExportSerializer(IssueSerializer):
    """
    Export-optimized serializer that extends IssueSerializer with human-readable fields.

    Converts UUIDs to readable values for CSV/JSON export.
    """

    identifier = serializers.SerializerMethodField()
    project_name = serializers.CharField(source="project.name", read_only=True, default="")
    project_identifier = serializers.CharField(source="project.identifier", read_only=True, default="")
    state_name = serializers.CharField(source="state.name", read_only=True, default="")
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default="")
    description = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField()
    labels = serializers.SerializerMethodField()
    cycle_name = serializers.SerializerMethodField()
    cycle_start_date = serializers.SerializerMethodField()
    cycle_end_date = serializers.SerializerMethodField()
    module_name = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    estimate = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    relations = serializers.SerializerMethodField()
    subscribers = serializers.SerializerMethodField()

    class Meta(IssueSerializer.Meta):
        fields = [
            "project_name",
            "project_identifier",
            "parent",
            "identifier",
            "name",
            "state_name",
            "priority",
            "assignees",
            "description",
            "subscribers",
            "created_by_name",
            "start_date",
            "target_date",
            "completed_at",
            "created_at",
            "updated_at",
            "archived_at",
            "estimate",
            "labels",
            "cycle_name",
            "cycle_start_date",
            "cycle_end_date",
            "module_name",
            "links",
            "relations",
            "comments",
            "sub_issues_count",
            "link_count",
            "attachment_count",
        ]

    def get_identifier(self, obj):
        return f"{obj.project.identifier}-{obj.sequence_id}"

    def get_assignees(self, obj):
        return [u.full_name for u in obj.assignees.all() if u.is_active]

    def get_subscribers(self, obj):
        """Return list of subscriber names."""
        return [sub.subscriber.full_name for sub in obj.issue_subscribers.all() if sub.subscriber]

    def get_parent(self, obj):
        if not obj.parent:
            return ""
        return f"{obj.parent.project.identifier}-{obj.parent.sequence_id}"

    def get_labels(self, obj):
        return [il.label.name for il in obj.label_issue.all() if il.deleted_at is None]

    def get_cycle_name(self, obj):
        """Return the cycle name (one-to-one relationship)."""
        cycle_issue = obj.issue_cycle.first()
        return cycle_issue.cycle.name if cycle_issue and cycle_issue.cycle else ""

    def get_cycle_start_date(self, obj):
        """Return the cycle start date."""
        cycle_issue = obj.issue_cycle.first()
        if cycle_issue and cycle_issue.cycle and cycle_issue.cycle.start_date:
            return cycle_issue.cycle.start_date.strftime("%Y-%m-%d")
        return ""

    def get_cycle_end_date(self, obj):
        """Return the cycle end date."""
        cycle_issue = obj.issue_cycle.first()
        if cycle_issue and cycle_issue.cycle and cycle_issue.cycle.end_date:
            return cycle_issue.cycle.end_date.strftime("%Y-%m-%d")
        return ""

    def get_module_name(self, obj):
        """Return the module name (one-to-one relationship)."""
        module_issue = obj.issue_module.first()
        return module_issue.module.name if module_issue and module_issue.module else ""

    def get_estimate(self, obj):
        """Return estimate point value."""
        if obj.estimate_point:
            return obj.estimate_point.value if hasattr(obj.estimate_point, "value") else str(obj.estimate_point)
        return ""

    def get_links(self, obj):
        """Return list of issue links with titles."""
        return [
            {
                "url": link.url,
                "title": link.title if link.title else link.url,
            }
            for link in obj.issue_link.all()
        ]

    def get_relations(self, obj):
        """
        Return list of related issues (outgoing only).

        For exports, we only capture relations once from the source issue.
        This avoids duplicate entries and reduces to a single prefetch query.
        """
        return [
            {
                "type": rel.relation_type,
                "related_issue": f"{rel.related_issue.project.identifier}-{rel.related_issue.sequence_id}",
            }
            for rel in obj.issue_relation.all()
            if rel.related_issue
        ]

    def get_comments(self, obj):
        """Return list of comments with author and timestamp."""
        return [
            {
                "comment": comment.comment_stripped if hasattr(comment, "comment_stripped") else comment.comment_html,
                "created_by": comment.actor.full_name if comment.actor else "",
                "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M:%S") if comment.created_at else "",
            }
            for comment in obj.issue_comments.all()
        ]

    def get_description(self, obj):
        if obj.description_stripped:
            return obj.description_stripped
        return ""
