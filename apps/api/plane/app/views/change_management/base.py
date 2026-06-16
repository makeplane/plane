"""
Change Management ViewSet.

Handles CRUD, state transitions, approvals, tasks, activity,
and overview dashboard for change requests.
"""


# Django imports
from django.db import transaction, IntegrityError
from django.db.models import Q, Count, Max
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    ChangeRequest,
    ChangeApproval,
    ChangeTask,
    ChangeActivity,
    Project,
    Workspace,
    WorkspaceMember,
    WorkspaceSecOpsConfig,
    AssignmentGroupMember,
    CabGroup,
    CabGroupMember,
)
from plane.app.serializers import (
    ChangeRequestSerializer,
    ChangeRequestCreateSerializer,
    ChangeApprovalSerializer,
    ChangeTaskSerializer,
    ChangeActivitySerializer,
)
from .state_machine import validate_transition


# Fields that become read-only once the change leaves "new" state.
# These define the core change request and must not be modified after submission.
LOCKED_AFTER_NEW_FIELDS = {
    "category", "service", "configuration_item",
    "priority", "risk", "impact",
    "assignment_group",
    "short_description", "description_html",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_default_project_for_workspace(workspace_slug):
    """
    Resolve the default project for change management in a workspace.

    Resolution order:
      1. WorkspaceSecOpsConfig.default_change_project  (explicit admin config)
      2. First project in the workspace                (auto-fallback)
      3. Error if no projects exist

    Returns (project, error_response).  If error_response is not None,
    the caller should return it immediately.
    """
    # Look up the workspace
    try:
        workspace = Workspace.objects.get(slug=workspace_slug)
    except Workspace.DoesNotExist:
        return None, Response(
            {"error": f"Workspace '{workspace_slug}' not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # 1. Check explicit config
    try:
        config = WorkspaceSecOpsConfig.objects.select_related(
            "default_change_project"
        ).get(workspace=workspace)
        if config.default_change_project_id:
            return config.default_change_project, None
    except WorkspaceSecOpsConfig.DoesNotExist:
        pass

    # 2. Fallback: first project in this workspace
    project = (
        Project.objects.filter(workspace=workspace)
        .order_by("created_at")
        .first()
    )

    if not project:
        return None, Response(
            {
                "error": (
                    f"No projects exist in workspace '{workspace_slug}'. "
                    "Create a project first, then retry."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return project, None


def _log_activity(change, actor, verb, field=None,
                  old_value=None, new_value=None, comment=None):
    """Create a ChangeActivity audit record."""
    ChangeActivity.objects.create(
        change_request=change,
        actor=actor,
        verb=verb,
        field=field,
        old_value=old_value,
        new_value=new_value,
        comment=comment,
    )


def _create_implementation_tasks(change):
    """Auto-create the two default implementation tasks for a change."""
    ChangeTask.objects.bulk_create([
        ChangeTask(
            change_request=change,
            short_description="Implement Change",
            task_type="implementation",
            state="pending",
            description="Complete the implementation of the change.",
            assignment_group=change.assignment_group,
            order=1,
        ),
        ChangeTask(
            change_request=change,
            short_description="Post-Implementation Testing",
            task_type="testing",
            state="pending",
            description="Perform post-implementation testing and verification.",
            assignment_group=change.assignment_group,
            order=2,
        ),
    ])


CLOSED_TASK_STATES = {"closed_complete", "closed_incomplete", "closed_skipped"}


def _all_tasks_closed(change):
    """Check if all tasks for a change are in a closed state."""
    open_count = change.tasks.exclude(state__in=CLOSED_TASK_STATES).count()
    return open_count == 0, open_count, change.tasks.count()


def _all_approvals_decided(change, level):
    """Check if all approvals at the given level are approved."""
    pending = change.approvals.filter(
        approval_level=level, status="pending"
    ).count()
    return pending == 0


def _any_approval_rejected(change, level):
    """Check if any approval at the given level was rejected."""
    return change.approvals.filter(
        approval_level=level, status="rejected"
    ).exists()


# ---------------------------------------------------------------------------
# ViewSet
# ---------------------------------------------------------------------------

class ChangeRequestViewSet(BaseViewSet):
    serializer_class = ChangeRequestSerializer
    model = ChangeRequest
    lookup_field = "number"

    def get_queryset(self):
        return (
            ChangeRequest.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
            )
            .select_related(
                "requested_by",
                "project", "workspace", "cab_delegate",
            )
            .order_by("-created_at")
        )

    # ------------------------------------------------------------------
    # LIST
    # ------------------------------------------------------------------
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.get_queryset()

        # Filters
        change_type = request.query_params.get("type")
        if change_type:
            queryset = queryset.filter(type=change_type)

        state = request.query_params.get("state")
        if state:
            queryset = queryset.filter(state=state)

        priority = request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        risk = request.query_params.get("risk")
        if risk:
            queryset = queryset.filter(risk=risk)

        requested_by = request.query_params.get("requested_by")
        if requested_by:
            queryset = queryset.filter(requested_by_id=requested_by)

        date_from = request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        # Open / Closed filtering
        view_filter = request.query_params.get("view")
        if view_filter == "open":
            queryset = queryset.exclude(state__in=["closed", "cancelled"])
        elif view_filter == "closed":
            queryset = queryset.filter(state__in=["closed", "cancelled"])

        serializer = ChangeRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # CREATE
    # ------------------------------------------------------------------
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        serializer = ChangeRequestCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        project, error = _get_default_project_for_workspace(slug)
        if error:
            return error

        data = serializer.validated_data
        change_type = data.get("type", "normal")

        # Validate type
        if change_type not in ("normal", "standard"):
            return Response(
                {"error": f"Invalid change type: '{change_type}'. Must be 'normal' or 'standard'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                change = ChangeRequest(
                    **data,
                    requested_by=request.user,
                    state="new",
                    project=project,
                    workspace=project.workspace,
                )
                change.save()

                # Log creation activity
                _log_activity(
                    change, request.user, "state_changed",
                    field="state", new_value="new",
                    comment=f"Change request {change.number} created.",
                )
        except IntegrityError as e:
            return Response(
                {"error": f"Failed to create change request (database constraint): {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except KeyError as e:
            return Response(
                {"error": f"Missing or invalid field: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create change request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Re-fetch with select_related
        change = self.get_queryset().get(pk=change.pk)
        return Response(
            ChangeRequestSerializer(change).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # RETRIEVE
    # ------------------------------------------------------------------
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            ChangeRequestSerializer(change).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # UPDATE
    # ------------------------------------------------------------------
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Track field changes for activity logging
        tracked_fields = [
            "priority", "risk", "impact", "category",
            "short_description", "assignment_group",
            "on_hold", "on_hold_reason",
            "planned_start_date", "planned_end_date",
            "cab_required", "cab_date", "cab_delegate",
            "close_code", "close_notes",
        ]

        for field_name in tracked_fields:
            if field_name in request.data:
                old_val = str(getattr(change, field_name, ""))
                new_val = str(request.data[field_name])
                if old_val != new_val:
                    _log_activity(
                        change, request.user, "field_updated",
                        field=field_name,
                        old_value=old_val,
                        new_value=new_val,
                    )

        # ---- ISSUE 2: Locked-field enforcement ----
        # Core definition fields are read-only once state leaves "new".
        # Silently strip them from the payload (UI already shows them as
        # disabled/greyed out, so any presence here is incidental).
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if change.state != "new":
            for field in LOCKED_AFTER_NEW_FIELDS:
                data.pop(field, None)

        serializer = ChangeRequestSerializer(
            change, data=data, partial=True
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        change = self.get_queryset().get(pk=change.pk)
        return Response(
            ChangeRequestSerializer(change).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # DELETE (cancel)
    # ------------------------------------------------------------------
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        old_state = change.state
        change.state = "cancelled"
        change.save(update_fields=["state", "updated_at"])

        _log_activity(
            change, request.user, "state_changed",
            field="state", old_value=old_state, new_value="cancelled",
            comment="Change request cancelled.",
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    # ------------------------------------------------------------------
    # STATE TRANSITION
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="transition")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def transition(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_state = request.data.get("state")
        if not new_state:
            return Response(
                {"error": "The 'state' field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_state = change.state

        # Validate transition
        is_valid, error_msg = validate_transition(
            change.type, old_state, new_state
        )
        if not is_valid:
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Assignment group is required before leaving New (both Normal and Standard)
        if old_state == "new" and new_state in ("assess", "scheduled"):
            if not change.assignment_group_id:
                return Response(
                    {
                        "error": (
                            "Cannot proceed: Assignment Group is required "
                            "before moving out of New. Set the Assignment "
                            "Group in the change request details."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---- ISSUE 1: scheduled → implement requires actual dates ----
        if old_state == "scheduled" and new_state == "implement":
            missing = []
            if not change.actual_start_date:
                missing.append("Actual Start Date")
            if not change.actual_end_date:
                missing.append("Actual End Date")
            if missing:
                return Response(
                    {
                        "error": (
                            f"{' and '.join(missing)} {'is' if len(missing) == 1 else 'are'} required "
                            "before beginning implementation."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Validate actual_end_date is after actual_start_date
            if change.actual_start_date and change.actual_end_date:
                if change.actual_end_date <= change.actual_start_date:
                    return Response(
                        {"error": "Actual End Date must be after Actual Start Date."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # implement → review: all tasks must be closed
        if old_state == "implement" and new_state == "review":
            all_closed, open_count, total_count = _all_tasks_closed(change)
            if not all_closed:
                return Response(
                    {
                        "error": (
                            f"{open_count} of {total_count} tasks are still "
                            f"open. Close all tasks before moving to Review."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Normal: assess → authorize requires peer_review approvals
        if (change.type == "normal" and old_state == "assess"
                and new_state == "authorize"):
            if not _all_approvals_decided(change, "peer_review"):
                return Response(
                    {
                        "error": (
                            "Cannot move to Authorize: pending peer review "
                            "approvals must be completed first."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if _any_approval_rejected(change, "peer_review"):
                return Response(
                    {
                        "error": (
                            "Cannot move to Authorize: peer review has been "
                            "rejected."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Normal: authorize → scheduled requires cab approvals
        if (change.type == "normal" and old_state == "authorize"
                and new_state == "scheduled"):
            if not _all_approvals_decided(change, "cab"):
                return Response(
                    {
                        "error": (
                            "Cannot move to Scheduled: pending CAB approvals "
                            "must be completed first."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if _any_approval_rejected(change, "cab"):
                return Response(
                    {
                        "error": (
                            "Cannot move to Scheduled: CAB approval has been "
                            "rejected. Change will be sent back to New."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # review → closed: closure fields required, not on hold
        if old_state == "review" and new_state == "closed":
            if change.on_hold:
                return Response(
                    {
                        "error": (
                            "Cannot close: change is currently on hold. "
                            "Remove the hold first."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not change.close_code:
                return Response(
                    {
                        "error": (
                            "Cannot close: a Close Code is required. "
                            "Set the Close Code in the Closure tab first."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not change.close_notes:
                return Response(
                    {
                        "error": (
                            "Cannot close: Close Notes are required. "
                            "Add closure notes in the Closure tab first."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            change.state = new_state
            update_fields = ["state", "updated_at"]

            # Auto-set actual dates
            if new_state == "implement" and not change.actual_start_date:
                change.actual_start_date = timezone.now()
                update_fields.append("actual_start_date")

            if new_state == "closed" and not change.actual_end_date:
                change.actual_end_date = timezone.now()
                update_fields.append("actual_end_date")

            change.save(update_fields=update_fields)

            # Auto-create tasks when entering implement
            if new_state == "implement":
                if not change.tasks.exists():
                    _create_implementation_tasks(change)

            # ---------------------------------------------------------
            # PEER REVIEW approvals when entering Assess (Normal only)
            # Goes to ALL members of the selected Assignment Group
            # (excluding the requester). No admin fallback.
            # ---------------------------------------------------------
            if change.type == "normal" and new_state == "assess":
                if not change.approvals.filter(approval_level="peer_review").exists():
                    group_member_ids = list(
                        AssignmentGroupMember.objects.filter(
                            assignment_group_id=change.assignment_group_id,
                        ).exclude(
                            member_id=change.requested_by_id,
                        ).values_list("member_id", flat=True)
                    )
                    if not group_member_ids:
                        # Rollback the state change
                        change.state = old_state
                        change.save(update_fields=["state", "updated_at"])
                        return Response(
                            {
                                "error": (
                                    "No members found in the selected "
                                    "Assignment Group. Please ask your "
                                    "super admin to add members in God "
                                    "Mode before proceeding."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    for member_id in group_member_ids:
                        ChangeApproval.objects.create(
                            change_request=change,
                            approver_id=member_id,
                            approval_level="peer_review",
                            status="pending",
                        )

            # ---------------------------------------------------------
            # CAB approvals when entering Authorize (Normal only)
            # Goes to members of the workspace's designated CabGroup
            # (from WorkspaceSecOpsConfig.cab_group).
            # ---------------------------------------------------------
            if change.type == "normal" and new_state == "authorize":
                if not change.approvals.filter(approval_level="cab").exists():
                    try:
                        config = WorkspaceSecOpsConfig.objects.get(
                            workspace=change.workspace,
                        )
                        cab_group = config.cab_group
                    except WorkspaceSecOpsConfig.DoesNotExist:
                        cab_group = None

                    if not cab_group:
                        # Rollback the state change
                        change.state = old_state
                        change.save(update_fields=["state", "updated_at"])
                        return Response(
                            {
                                "error": (
                                    "No CAB Group has been configured for "
                                    "this workspace. Please ask your super "
                                    "admin to set one up in God Mode."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    cab_member_ids = list(
                        CabGroupMember.objects.filter(
                            cab_group=cab_group,
                        ).exclude(
                            member_id=change.requested_by_id,
                        ).values_list("member_id", flat=True)
                    )
                    if not cab_member_ids:
                        # Rollback the state change
                        change.state = old_state
                        change.save(update_fields=["state", "updated_at"])
                        return Response(
                            {
                                "error": (
                                    "The configured CAB Group has no "
                                    "members. Please ask your super admin "
                                    "to add CAB members in God Mode."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    for member_id in cab_member_ids:
                        ChangeApproval.objects.create(
                            change_request=change,
                            approver_id=member_id,
                            approval_level="cab",
                            status="pending",
                        )

            _log_activity(
                change, request.user, "state_changed",
                field="state", old_value=old_state, new_value=new_state,
            )

        change = self.get_queryset().get(pk=change.pk)
        return Response(
            ChangeRequestSerializer(change).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # APPROVALS — LIST
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="approvals")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list_approvals(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        approvals = change.approvals.select_related("approver").all()
        return Response(
            ChangeApprovalSerializer(approvals, many=True).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # APPROVE
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="approve")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def approve(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        comments = (request.data.get("comments") or "").strip()

        # Mandatory note validation
        if not comments:
            return Response(
                {"error": "A note is required when approving or rejecting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find a pending approval for this user
        approval = change.approvals.filter(
            approver=request.user, status="pending"
        ).first()

        if not approval:
            return Response(
                {"error": "No pending approval found for you on this change."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        approval.status = "approved"
        approval.comments = comments
        approval.decided_at = now
        approval.save()

        # First-decision-wins: void all other pending approvals
        # for the same change + same approval level
        voided_count = change.approvals.filter(
            approval_level=approval.approval_level,
            status="pending",
        ).exclude(pk=approval.pk).update(
            status="voided",
            decided_at=now,
            comments=(
                f"Auto-voided: {request.user.display_name or request.user.email} "
                f"approved on {now.strftime('%Y-%m-%d %H:%M')}."
            ),
        )

        _log_activity(
            change, request.user, "approved",
            field=approval.approval_level,
            new_value="approved",
            comment=comments,
        )

        return Response(
            ChangeApprovalSerializer(approval).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # REJECT
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="reject")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def reject(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        comments = (request.data.get("comments") or "").strip()

        # Mandatory note validation
        if not comments:
            return Response(
                {"error": "A note is required when approving or rejecting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval = change.approvals.filter(
            approver=request.user, status="pending"
        ).first()

        if not approval:
            return Response(
                {"error": "No pending approval found for you on this change."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        approval.status = "rejected"
        approval.comments = comments
        approval.decided_at = now
        approval.save()

        # First-decision-wins: void all other pending approvals
        # for the same change + same approval level
        change.approvals.filter(
            approval_level=approval.approval_level,
            status="pending",
        ).exclude(pk=approval.pk).update(
            status="voided",
            decided_at=now,
            comments=(
                f"Auto-voided: {request.user.display_name or request.user.email} "
                f"rejected on {now.strftime('%Y-%m-%d %H:%M')}."
            ),
        )

        _log_activity(
            change, request.user, "rejected",
            field=approval.approval_level,
            new_value="rejected",
            comment=comments,
        )

        # Normal CAB rejection → send back to new
        if (change.type == "normal" and change.state == "authorize"
                and approval.approval_level == "cab"):
            old_state = change.state
            change.state = "new"
            change.save(update_fields=["state", "updated_at"])
            _log_activity(
                change, request.user, "state_changed",
                field="state", old_value=old_state, new_value="new",
                comment="CAB rejected — change sent back to New.",
            )

        return Response(
            ChangeApprovalSerializer(approval).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # TASKS — LIST
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="tasks")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list_tasks(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        tasks = change.tasks.select_related("assignment_group").all()
        return Response(
            ChangeTaskSerializer(tasks, many=True).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # TASKS — CREATE
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="tasks/create")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create_task(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only allow task creation during Implement state
        if change.state != "implement":
            return Response(
                {"error": "Tasks can only be added during the Implement stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ChangeTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        # Auto-assign order as last + 1
        max_order = change.tasks.aggregate(
            max_order=Max("order")
        )["max_order"] or 0

        serializer.save(
            change_request=change,
            assignment_group=change.assignment_group,
            order=max_order + 1,
        )

        _log_activity(
            change, request.user, "field_updated",
            field="task",
            new_value=f"Added task: {serializer.instance.short_description}",
        )

        return Response(
            ChangeTaskSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # TASKS — UPDATE
    # ------------------------------------------------------------------
    @action(
        detail=True, methods=["patch"],
        url_path=r"tasks/(?P<task_id>[0-9a-f-]+)",
    )
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def update_task(self, request, slug, number, task_id):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            task = change.tasks.get(pk=task_id)
        except ChangeTask.DoesNotExist:
            return Response(
                {"error": f"Task '{task_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        old_state = task.state
        serializer = ChangeTaskSerializer(
            task, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        new_state = request.data.get("state", old_state)

        # Auto-manage closed_at based on state transitions
        if new_state in CLOSED_TASK_STATES and old_state not in CLOSED_TASK_STATES:
            task.closed_at = timezone.now()
        elif new_state not in CLOSED_TASK_STATES and old_state in CLOSED_TASK_STATES:
            task.closed_at = None

        serializer.save()

        if old_state != new_state:
            _log_activity(
                change, request.user, "task_completed",
                field=task.task_type,
                old_value=old_state,
                new_value=new_state,
                comment=f"Task: {task.short_description}",
            )

        return Response(
            ChangeTaskSerializer(task).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # TASKS — DELETE
    # ------------------------------------------------------------------
    @action(
        detail=True, methods=["delete"],
        url_path=r"tasks/(?P<task_id>[0-9a-f-]+)/delete",
    )
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete_task(self, request, slug, number, task_id):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if change.state != "implement":
            return Response(
                {"error": "Tasks can only be deleted during the Implement stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = change.tasks.get(pk=task_id)
        except ChangeTask.DoesNotExist:
            return Response(
                {"error": f"Task '{task_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        task_desc = task.short_description
        task.delete()

        _log_activity(
            change, request.user, "field_updated",
            field="task",
            new_value=f"Deleted task: {task_desc}",
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    # ------------------------------------------------------------------
    # ACTIVITY — LIST
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="activity")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list_activity(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        activities = change.activities.select_related("actor").all()
        return Response(
            ChangeActivitySerializer(activities, many=True).data,
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # ADD COMMENT (activity note)
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="comment")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def add_comment(self, request, slug, number):
        try:
            change = self.get_queryset().get(number=number)
        except ChangeRequest.DoesNotExist:
            return Response(
                {"error": f"Change request '{number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        comment = request.data.get("comment", "").strip()
        if not comment:
            return Response(
                {"error": "Comment text is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _log_activity(
            change, request.user, "commented",
            comment=comment,
        )

        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # OVERVIEW DASHBOARD
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="overview")
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def overview(self, request, slug):
        base_qs = ChangeRequest.objects.filter(workspace__slug=slug)
        today = timezone.now().date()
        open_qs = base_qs.exclude(state__in=["closed", "cancelled"])

        # KPI counts
        todays_new_count = base_qs.filter(
            state="new", created_at__date=today
        ).count()

        critical_open_count = open_qs.filter(
            priority="1_critical"
        ).count()

        overdue_count = open_qs.filter(
            planned_end_date__date__lt=today
        ).count()

        todays_high_risk_count = base_qs.filter(
            risk__in=["1_critical", "2_high"],
            created_at__date=today,
        ).count()

        on_hold_count = base_qs.filter(on_hold=True).exclude(
            state__in=["closed", "cancelled"]
        ).count()

        awaiting_approval_count = (
            ChangeApproval.objects.filter(
                change_request__workspace__slug=slug,
                status="pending",
            )
            .values("change_request_id")
            .distinct()
            .count()
        )

        # Open grouped by risk
        risk_groups = (
            open_qs
            .values("risk")
            .annotate(count=Count("id"))
            .order_by("risk")
        )
        open_grouped_by_risk = {
            "1_critical": 0,
            "2_high": 0,
            "3_moderate": 0,
            "4_low": 0,
        }
        for rg in risk_groups:
            if rg["risk"] in open_grouped_by_risk:
                open_grouped_by_risk[rg["risk"]] = rg["count"]

        return Response(
            {
                "todays_new_count": todays_new_count,
                "critical_open_count": critical_open_count,
                "overdue_count": overdue_count,
                "todays_high_risk_count": todays_high_risk_count,
                "on_hold_count": on_hold_count,
                "awaiting_approval_count": awaiting_approval_count,
                "open_grouped_by_risk": open_grouped_by_risk,
            },
            status=status.HTTP_200_OK,
        )
