# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party frameworks
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueIntakeSerializer, LabelLiteSerializer, IssueDetailSerializer
from .project import ProjectLiteSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer
from plane.db.models import Intake, IntakeIssue, Issue, StateGroup, State


class IntakeSerializer(BaseSerializer):
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    pending_issue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Intake
        fields = "__all__"
        read_only_fields = ["project", "workspace"]


class IntakeIssueSerializer(BaseSerializer):
    issue = IssueIntakeSerializer(read_only=True)

    class Meta:
        model = IntakeIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "source",
            "issue",
            "created_by",
        ]
        read_only_fields = ["project", "workspace"]

    def validate(self, attrs):
        """
        Validate that if status is being changed to accepted (1),
        the project has a default state to transition to.
        """

        # Check if status is being updated to accepted
        if attrs.get("status") == 1:
            intake_issue = self.instance
            issue = intake_issue.issue

            # Check if issue is in TRIAGE state
            if issue.state and issue.state.group == StateGroup.TRIAGE.value:
                # Verify default state exists before allowing the update
                default_state = State.objects.filter(
                    workspace=intake_issue.workspace, project=intake_issue.project, default=True
                ).first()

                if not default_state:
                    raise serializers.ValidationError(
                        {"status": "Cannot accept intake issue: No default state found for the project"}
                    )

        return attrs

    def update(self, instance, validated_data):
        # Update the intake issue
        instance = super().update(instance, validated_data)

        # If status is accepted (1), transition the issue state from TRIAGE to default
        if validated_data.get("status") == 1:
            issue = instance.issue
            if issue.state and issue.state.group == StateGroup.TRIAGE.value:
                # Get the default project state
                default_state = State.objects.filter(
                    workspace=instance.workspace, project=instance.project, default=True
                ).first()
                if default_state:
                    self._route_intake_transition(issue=issue, target_state=default_state)

        return instance

    def _route_intake_transition(self, *, issue, target_state):
        """Route the intake-accept state move through ``TransitionService``.

        Falls back to the legacy ``issue.save()`` path when workflows
        are off (the default) so this change is invisible on legacy
        projects (§17.4 compatibility).
        """
        try:
            from plane.services.workflow.errors import WorkflowError
            from plane.services.workflow.flags import workflows_active
            from plane.services.workflow.transitions import TransitionService
        except ImportError:
            WorkflowError = Exception
            TransitionService = None
            workflows_active = None

        if TransitionService is None or workflows_active is None:
            issue.state = target_state
            issue.save()
            return

        if not workflows_active(project=issue.project):
            issue.state = target_state
            issue.save()
            return

        try:
            TransitionService.transition(
                issue_id=issue.id,
                target_state_id=str(target_state.id),
                actor=None,
                actor_id=str(self.instance.created_by_id) if self.instance.created_by_id else None,
                origin="intake",
                system_bypass=True,
                bypass_reason="intake accept: triage -> default",
            )
        except WorkflowError:
            # Re-raise — the intake accept is a real transition and
            # must surface workflow failures to the caller.
            raise
        issue.refresh_from_db()

    def to_representation(self, instance):
        # Pass the annotated fields to the Issue instance if they exist
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids
        return super().to_representation(instance)


class IntakeIssueDetailSerializer(BaseSerializer):
    issue = IssueDetailSerializer(read_only=True)
    duplicate_issue_detail = IssueIntakeSerializer(read_only=True, source="duplicate_to")

    class Meta:
        model = IntakeIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "duplicate_issue_detail",
            "source",
            "issue",
        ]
        read_only_fields = ["project", "workspace"]

    def to_representation(self, instance):
        # Pass the annotated fields to the Issue instance if they exist
        if hasattr(instance, "assignee_ids"):
            instance.issue.assignee_ids = instance.assignee_ids
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids

        return super().to_representation(instance)


class IntakeIssueLiteSerializer(BaseSerializer):
    class Meta:
        model = IntakeIssue
        fields = ["id", "status", "duplicate_to", "snoozed_till", "source"]
        read_only_fields = fields


class IssueStateIntakeSerializer(BaseSerializer):
    state_detail = StateLiteSerializer(read_only=True, source="state")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    label_details = LabelLiteSerializer(read_only=True, source="labels", many=True)
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    sub_issues_count = serializers.IntegerField(read_only=True)
    issue_intake = IntakeIssueLiteSerializer(read_only=True, many=True)

    class Meta:
        model = Issue
        fields = "__all__"
