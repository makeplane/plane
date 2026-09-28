# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow admin serializers — spec §17.1, §17.2.

Mirror the §17.1/§17.2 endpoint shapes. Read-side serializers expose
the canonical shape; write-side serializers add validation for
unique-name + draft-only edits + flow invariants. Every write
through these serializers is permission-gated in the view layer
(§18.1).
"""

# Python imports
from typing import Optional

# Third Party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import (
    IssueType,
    ProjectMember,
    State,
    Workflow,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
    WorkflowTypeAssignment,
)
from plane.db.models.workflow import (
    WorkflowFlowActorType,
    WorkflowFlowType,
)


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class WorkflowLiteSerializer(BaseSerializer):
    """Compact workflow representation for list endpoints."""

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class WorkflowStateReadSerializer(BaseSerializer):
    state_id = serializers.UUIDField(source="state_id", read_only=True)
    state_name = serializers.CharField(source="state.name", read_only=True)
    state_group = serializers.CharField(source="state.group", read_only=True)

    class Meta:
        model = WorkflowState
        fields = [
            "id",
            "state_id",
            "state_name",
            "state_group",
            "sequence",
            "allow_new_work_items",
        ]
        read_only_fields = fields


class WorkflowFlowReadSerializer(BaseSerializer):
    source_state_id = serializers.UUIDField(source="source_state.state_id", read_only=True)
    source_state_name = serializers.CharField(source="source_state.state.name", read_only=True)
    target_state_id = serializers.UUIDField(source="target_state.state_id", read_only=True)
    target_state_name = serializers.CharField(source="target_state.state.name", read_only=True)
    reject_state_id = serializers.UUIDField(
        source="reject_state.state_id", read_only=True, default=None
    )
    # spec §17.2, §23.2 — every flow must expose its actor roster so the
    # transition editor and the runtime can both see who is allowed to
    # drive this flow without a second round-trip.
    actors = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowFlow
        fields = [
            "id",
            "flow_type",
            "source_state_id",
            "source_state_name",
            "target_state_id",
            "target_state_name",
            "reject_state_id",
            "sequence",
            "is_active",
            "actors",
        ]
        read_only_fields = fields

    def get_actors(self, obj):
        # Prefetched on the view side where possible; fall back to a
        # direct lookup so callers never see a 500 if they forget to
        # prefetch.
        actors_qs = getattr(obj, "_prefetched_actors", None)
        if actors_qs is None:
            actors_qs = obj.actors.all()
        return WorkflowFlowActorReadSerializer(actors_qs, many=True).data


class WorkflowFlowActorReadSerializer(BaseSerializer):
    class Meta:
        model = WorkflowFlowActor
        fields = [
            "id",
            "actor_type",
            "config",
            "sequence",
        ]
        read_only_fields = fields


class WorkflowRevisionReadSerializer(BaseSerializer):
    states = WorkflowStateReadSerializer(many=True, read_only=True)
    flows = WorkflowFlowReadSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowRevision
        fields = [
            "id",
            "workflow",
            "version",
            "status",
            "published_at",
            "published_by",
            "created_at",
            "updated_at",
            "states",
            "flows",
        ]
        read_only_fields = fields


class WorkflowReadSerializer(BaseSerializer):
    revisions = WorkflowRevisionReadSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "revisions",
        ]
        read_only_fields = fields


class WorkflowTypeAssignmentReadSerializer(BaseSerializer):
    issue_type_name = serializers.CharField(source="issue_type.name", read_only=True)
    workflow_name = serializers.CharField(source="workflow.name", read_only=True)

    class Meta:
        model = WorkflowTypeAssignment
        fields = [
            "id",
            "workflow",
            "workflow_name",
            "issue_type",
            "issue_type_name",
            "created_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class WorkflowCreateSerializer(BaseSerializer):
    """§17.1 — workflow CRUD.

    Only the ``name`` / ``description`` / ``is_active`` flags are
    writable here. ``is_default`` is reserved for the bootstrap
    service (§25 Phase 2) — exposing it here would let admins
    create a second default workflow and break the §7.1 partial
    unique constraint at the application layer.
    """

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_name(self, value: str) -> str:
        project_id = self.context.get("project_id")
        if not project_id:
            return value
        qs = Workflow.objects.filter(project_id=project_id, name=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A workflow with this name already exists in the project."
            )
        return value


class WorkflowUpdateSerializer(WorkflowCreateSerializer):
    """§17.1 — PATCH serializer for a workflow.

    ``is_default`` is intentionally not writable here. The bootstrap
    service is the sole owner of that flag (§7.1 partial-unique); the
    view layer returns ``WorkflowDefaultImmutable`` (409) when a PATCH
    attempts to flip it, but we also drop it from the writable fields
    so the validator cannot silently coerce a stray ``"is_default": true``
    through. See RD-487 / §34.
    """

    class Meta(WorkflowCreateSerializer.Meta):
        fields = WorkflowCreateSerializer.Meta.fields


class WorkflowDraftSerializer(BaseSerializer):
    """§17.1 — POST /workflows/:id/draft/.

    Creates a new draft revision (version = latest + 1) for a
    workflow. Workflows without a published revision get ``version=1``
    as the draft.
    """

    class Meta:
        model = WorkflowRevision
        fields = []


class WorkflowRevisionPublishSerializer(BaseSerializer):
    """§17.1, §24 — POST /workflows/:id/publish/.

    Validates the draft against §7.5 invariants + §24 publish rules
    before flipping status to ``published``.
    """

    class Meta:
        model = WorkflowRevision
        fields = []


class WorkflowStateWriteSerializer(BaseSerializer):
    """§17.2 — POST /workflow-revisions/:id/states/."""

    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        write_only=True,
    )

    class Meta:
        model = WorkflowState
        fields = [
            "id",
            "state_id",
            "sequence",
            "allow_new_work_items",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        revision = self.context.get("revision")
        if revision is None:
            raise serializers.ValidationError("Revision context missing.")
        if revision.status != WorkflowRevisionStatus.DRAFT:
            raise serializers.ValidationError(
                "Only draft revisions can be edited."
            )
        state = attrs["state_id"]
        if state.project_id != revision.project_id:
            raise serializers.ValidationError(
                "State must belong to the revision's project."
            )
        if WorkflowState.objects.filter(
            revision=revision, state=state
        ).exists():
            raise serializers.ValidationError(
                "State is already included in this revision."
            )
        attrs["state"] = state
        attrs["revision"] = revision
        return attrs


class WorkflowStateUpdateSerializer(WorkflowStateWriteSerializer):
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
    )

    class Meta(WorkflowStateWriteSerializer.Meta):
        fields = [
            "id",
            "state_id",
            "sequence",
            "allow_new_work_items",
        ]
        read_only_fields = ["id"]


class WorkflowFlowWriteSerializer(BaseSerializer):
    """§17.2 — POST /workflow-revisions/:id/flows/."""

    source_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(),
        write_only=True,
    )
    target_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(),
        write_only=True,
    )
    reject_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = WorkflowFlow
        fields = [
            "id",
            "source_state_id",
            "target_state_id",
            "reject_state_id",
            "flow_type",
            "sequence",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        revision = self.context.get("revision")
        if revision is None:
            raise serializers.ValidationError("Revision context missing.")
        if revision.status != WorkflowRevisionStatus.DRAFT:
            raise serializers.ValidationError(
                "Only draft revisions can be edited."
            )
        source = attrs["source_state_id"]
        target = attrs["target_state_id"]
        reject = attrs.get("reject_state_id")
        flow_type = attrs.get("flow_type", WorkflowFlowType.TRANSITION)

        if source.revision_id != revision.id or target.revision_id != revision.id:
            raise serializers.ValidationError(
                "Source/target states must belong to this revision."
            )
        if reject is not None and reject.revision_id != revision.id:
            raise serializers.ValidationError(
                "Reject state must belong to this revision."
            )
        if source.id == target.id:
            raise serializers.ValidationError(
                "Source and target states must differ."
            )
        if flow_type == WorkflowFlowType.TRANSITION and reject is not None:
            raise serializers.ValidationError(
                "Transition flows cannot declare a reject_state."
            )
        if flow_type == WorkflowFlowType.APPROVAL and reject is None:
            raise serializers.ValidationError(
                "Approval flows must declare a reject_state."
            )

        attrs["revision"] = revision
        attrs["source_state"] = source
        attrs["target_state"] = target
        attrs["reject_state"] = reject
        attrs.pop("source_state_id", None)
        attrs.pop("target_state_id", None)
        attrs.pop("reject_state_id", None)
        return attrs


class WorkflowFlowUpdateSerializer(WorkflowFlowWriteSerializer):
    source_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(), required=False
    )
    target_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(), required=False
    )
    reject_state_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowState.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta(WorkflowFlowWriteSerializer.Meta):
        fields = WorkflowFlowWriteSerializer.Meta.fields


class WorkflowFlowActorWriteSerializer(BaseSerializer):
    """§17.2 — actor CRUD."""

    class Meta:
        model = WorkflowFlowActor
        fields = [
            "id",
            "actor_type",
            "config",
            "sequence",
        ]
        read_only_fields = ["id"]

    def validate_actor_type(self, value: str) -> str:
        if value not in dict(WorkflowFlowActorType.choices):
            raise serializers.ValidationError(f"Unknown actor_type: {value}")
        return value

    def validate(self, attrs):
        flow = self.context.get("flow")
        if flow is None:
            raise serializers.ValidationError("Flow context missing.")
        revision = flow.revision
        if revision.status != WorkflowRevisionStatus.DRAFT:
            raise serializers.ValidationError(
                "Only draft revisions can be edited."
            )
        return attrs


class WorkflowTypeAssignmentWriteSerializer(BaseSerializer):
    """§7.3 — workflow per ``(project, issue_type)``."""

    workflow_id = serializers.PrimaryKeyRelatedField(
        queryset=Workflow.objects.all(),
        write_only=True,
    )
    issue_type_id = serializers.PrimaryKeyRelatedField(
        queryset=IssueType.objects.all(),
        write_only=True,
    )

    class Meta:
        model = WorkflowTypeAssignment
        fields = [
            "id",
            "workflow_id",
            "issue_type_id",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        project_id = self.context.get("project_id")
        if not project_id:
            raise serializers.ValidationError("Project context missing.")
        workflow = attrs["workflow_id"]
        issue_type = attrs["issue_type_id"]
        if workflow.project_id != project_id:
            raise serializers.ValidationError(
                "Workflow must belong to the same project."
            )
        if issue_type.workspace_id != workflow.workspace_id:
            raise serializers.ValidationError(
                "Issue type must belong to the workflow's workspace."
            )
        attrs["workflow"] = workflow
        attrs["issue_type"] = issue_type
        attrs["project_id"] = project_id
        attrs.pop("workflow_id", None)
        attrs.pop("issue_type_id", None)
        return attrs
