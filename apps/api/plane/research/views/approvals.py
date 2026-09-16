# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ApprovalAction,
    ApprovalFlow,
    ApprovalFlowStep,
    ApprovalRequest,
    Issue,
    OrgUnit,
    Project,
)
from plane.research.serializers import (
    ApprovalActionSerializer,
    ApprovalFlowSerializer,
    ApprovalRequestSerializer,
)
from plane.research.utils.approval_notifications import notify_approvers, notify_requester
from plane.research.utils.approvals import (
    can_act_on_current_step,
    flow_steps,
    move_issue_state,
    next_step_order,
    step_is_satisfied,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_APPROVALS
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.views.base import ResearchAPIView, resolve_user, truthy

APPROVAL_TYPES = ("TASK", "PURCHASE", "CUSTOM")


def flow_queryset(workspace):
    return ApprovalFlow.objects.filter(workspace=workspace).prefetch_related("steps")


def request_queryset(workspace):
    return (
        ApprovalRequest.objects.filter(flow__workspace=workspace)
        .select_related("flow", "issue", "requested_by", "org_unit")
        .order_by("-created_at")
    )


class ResearchApprovalFlowListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/approval-flows/``"""

    nav_capability = NAV_APPROVALS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        queryset = flow_queryset(workspace)
        if request.GET.get("approval_type"):
            queryset = queryset.filter(approval_type=str(request.GET["approval_type"]).upper())
        if request.GET.get("org_unit"):
            queryset = queryset.filter(org_unit_id=request.GET["org_unit"])
        data = list(queryset)
        return Response(
            {"results": ApprovalFlowSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()

        name = str(request.data.get("name") or "").strip()
        approval_type = str(request.data.get("approval_type") or "TASK").upper()
        if not name:
            return research_error(ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND, "Flow name is required.")
        if approval_type not in APPROVAL_TYPES:
            return research_error(ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND, "Unknown approval type.")

        org_unit = None
        if request.data.get("org_unit"):
            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=request.data["org_unit"]).first()
            if org_unit is None:
                return research_error(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")

        steps = request.data.get("steps") or []
        if not isinstance(steps, list) or not steps:
            return research_error(
                ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND,
                "At least one approval step is required.",
            )

        try:
            with transaction.atomic():
                flow = ApprovalFlow.objects.create(
                    workspace=workspace,
                    org_unit=org_unit,
                    approval_type=approval_type,
                    name=name,
                    version=1,
                    created_by=request.user,
                )
                for index, step in enumerate(steps, start=1):
                    approver_user = (
                        resolve_user(step.get("approver_user")) if step.get("approver_user") else None
                    )
                    if step.get("approver_user") and approver_user is None:
                        raise ValueError("approver_user_not_found")
                    ApprovalFlowStep.objects.create(
                        flow=flow,
                        order=int(step.get("order") or index),
                        approver_mode=str(step.get("approver_mode") or "ANY").upper(),
                        approver_org_role=(str(step["approver_org_role"]).upper() if step.get("approver_org_role") else None),
                        approver_user=approver_user,
                        is_required=truthy(step.get("is_required"), default=True),
                        created_by=request.user,
                    )
        except ValueError:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Approver not found.")
        except IntegrityError:
            return research_error(
                ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND,
                "Duplicate step order or flow name.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.APPROVAL_FLOW_CREATE,
            resource_type=ResearchResourceType.APPROVAL_FLOW,
            resource_id=flow.id,
            org_unit=flow.org_unit,
            actor=request.user,
            metadata={"name": name, "approval_type": approval_type, "steps": len(steps)},
            request=request,
        )
        return Response(
            ApprovalFlowSerializer(flow_queryset(workspace).get(pk=flow.id)).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchApprovalFlowDetailEndpoint(ResearchAPIView):
    """``PATCH /api/research/workspaces/<slug>/approval-flows/<pk>/``

    Editing a flow publishes a new version; in-flight requests keep the version
    they were created with (P0-APR-03).
    """

    nav_capability = NAV_APPROVALS

    def patch(self, request, slug, pk):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()
        flow = flow_queryset(workspace).filter(pk=pk).first()
        if flow is None:
            return research_not_found(ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND, "Flow not found.")

        steps = request.data.get("steps")
        new_version = flow.version + 1
        try:
            with transaction.atomic():
                # retire the current version, keep its steps for history
                flow.is_active = False
                flow.save(update_fields=["is_active", "updated_at"])

                successor = ApprovalFlow.objects.create(
                    workspace=workspace,
                    org_unit=flow.org_unit,
                    approval_type=flow.approval_type,
                    name=str(request.data.get("name") or flow.name),
                    version=new_version,
                    is_active=True,
                    created_by=request.user,
                )
                if isinstance(steps, list) and steps:
                    for index, step in enumerate(steps, start=1):
                        approver_user = (
                            resolve_user(step.get("approver_user")) if step.get("approver_user") else None
                        )
                        if step.get("approver_user") and approver_user is None:
                            raise ValueError("approver_user_not_found")
                        ApprovalFlowStep.objects.create(
                            flow=successor,
                            order=int(step.get("order") or index),
                            approver_mode=str(step.get("approver_mode") or "ANY").upper(),
                            approver_org_role=(
                                str(step["approver_org_role"]).upper() if step.get("approver_org_role") else None
                            ),
                            approver_user=approver_user,
                            is_required=truthy(step.get("is_required"), default=True),
                            created_by=request.user,
                        )
                else:
                    for step in flow_steps(flow):
                        ApprovalFlowStep.objects.create(
                            flow=successor,
                            order=step.order,
                            approver_mode=step.approver_mode,
                            approver_org_role=step.approver_org_role,
                            approver_user=step.approver_user,
                            is_required=step.is_required,
                            created_by=request.user,
                        )
                if "is_active" in request.data:
                    successor.is_active = truthy(request.data.get("is_active"))
                    successor.save(update_fields=["is_active", "updated_at"])
        except ValueError:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Approver not found.")
        except IntegrityError:
            return research_error(ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND, "Duplicate step order.")

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.APPROVAL_FLOW_UPDATE,
            resource_type=ResearchResourceType.APPROVAL_FLOW,
            resource_id=successor.id,
            org_unit=successor.org_unit,
            actor=request.user,
            metadata={"previous_version": flow.version, "version": successor.version},
            request=request,
        )
        return Response(
            ApprovalFlowSerializer(flow_queryset(workspace).get(pk=successor.id)).data,
            status=status.HTTP_200_OK,
        )


class ResearchApprovalRequestListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/approval-requests/``"""

    nav_capability = NAV_APPROVALS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error

        queryset = request_queryset(workspace)
        if request.GET.get("approval_type"):
            queryset = queryset.filter(approval_type=str(request.GET["approval_type"]).upper())
        if request.GET.get("status"):
            queryset = queryset.filter(status=str(request.GET["status"]).upper())
        if request.GET.get("org_unit"):
            queryset = queryset.filter(org_unit_id=request.GET["org_unit"])

        scope = str(request.GET.get("scope") or "").lower()
        if scope == "mine":
            queryset = queryset.filter(requested_by=request.user)
        elif scope == "completed":
            queryset = queryset.exclude(status=ApprovalRequest.Status.PENDING)

        data = list(queryset)
        if scope == "to_me":
            data = [
                item
                for item in data
                if item.status == ApprovalRequest.Status.PENDING
                and can_act_on_current_step(item, request.user)[0]
            ]
        return Response(
            {
                "results": [
                    ApprovalRequestSerializer(item, context={"actor": request.user}).data for item in data
                ],
                "count": len(data),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error

        issue_id = request.data.get("issue")
        if not issue_id:
            return research_error(ResearchErrorCode.APPROVAL_REQUEST_NOT_FOUND, "issue is required.")
        issue = (
            Issue.objects.filter(pk=issue_id, workspace=workspace, deleted_at__isnull=True)
            .select_related("project")
            .first()
        )
        if issue is None:
            return research_not_found(
                ResearchErrorCode.APPROVAL_REQUEST_NOT_FOUND, "Work item not found."
            )
        if ApprovalRequest.objects.filter(issue_id=issue.id).exists():
            return research_conflict(
                ResearchErrorCode.APPROVAL_STATE_CONFLICT,
                "This work item already has an approval request.",
            )

        org_unit = None
        if request.data.get("org_unit"):
            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=request.data["org_unit"]).first()
        approval_type = str(request.data.get("approval_type") or "TASK").upper()

        flow = None
        if request.data.get("flow"):
            flow = flow_queryset(workspace).filter(pk=request.data["flow"], version=1).first()
            if flow is None:
                flow = flow_queryset(workspace).filter(pk=request.data["flow"]).first()
        if flow is None:
            candidates = flow_queryset(workspace).filter(
                approval_type=approval_type, is_active=True
            )
            if org_unit is not None:
                flow = candidates.filter(org_unit=org_unit).first() or candidates.filter(org_unit__isnull=True).first()
            else:
                flow = candidates.first()
        if flow is None:
            return research_error(
                ResearchErrorCode.APPROVAL_FLOW_NOT_FOUND,
                "No active approval flow is configured for this type.",
            )

        research_project = None
        if request.data.get("research_project"):
            research_project = Project.objects.filter(
                workspace=workspace, pk=request.data["research_project"]
            ).first()

        approval_request = ApprovalRequest.objects.create(
            issue=issue,
            flow=flow,
            flow_version=flow.version,
            approval_type=flow.approval_type,
            org_unit=org_unit or flow.org_unit,
            requested_by=request.user,
            research_project=research_project,
            report_id=request.data.get("report") or None,
            created_by=request.user,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.APPROVAL_REQUEST_CREATE,
            resource_type=ResearchResourceType.APPROVAL_REQUEST,
            resource_id=approval_request.id,
            org_unit=approval_request.org_unit,
            actor=request.user,
            metadata={"issue": str(issue.id), "flow": str(flow.id), "version": flow.version},
            request=request,
        )
        notify_approvers(approval_request, request.user, f"待审批：{issue.name}")
        return Response(
            ApprovalRequestSerializer(approval_request, context={"actor": request.user}).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchApprovalRequestDetailEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/approval-requests/<pk>/``"""

    nav_capability = NAV_APPROVALS

    def get(self, request, slug, pk):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        approval_request = request_queryset(workspace).filter(pk=pk).first()
        if approval_request is None:
            return research_not_found(
                ResearchErrorCode.APPROVAL_REQUEST_NOT_FOUND, "Approval request not found."
            )
        return Response(
            ApprovalRequestSerializer(approval_request, context={"actor": request.user}).data,
            status=status.HTTP_200_OK,
        )


class ResearchApprovalRequestActionEndpoint(ResearchAPIView):
    """``POST .../approve/`` · ``.../reject/`` · ``.../withdraw/``"""

    nav_capability = NAV_APPROVALS

    def post(self, request, slug, pk, action):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        approval_request = request_queryset(workspace).filter(pk=pk).first()
        if approval_request is None:
            return research_not_found(
                ResearchErrorCode.APPROVAL_REQUEST_NOT_FOUND, "Approval request not found."
            )
        if approval_request.status != ApprovalRequest.Status.PENDING:
            return research_conflict(
                ResearchErrorCode.APPROVAL_STATE_CONFLICT,
                "This approval request is already closed.",
            )

        comment = str(request.data.get("comment") or "")

        if action == "withdraw":
            if approval_request.requested_by_id != request.user.id and not is_workspace_admin(
                request.user, workspace.id
            ):
                return research_permission_denied()
            approval_request.status = ApprovalRequest.Status.WITHDRAWN
            approval_request.save(update_fields=["status", "updated_at"])
            ApprovalAction.objects.create(
                request=approval_request,
                actor=request.user,
                action=ApprovalAction.Action.WITHDRAW,
                comment=comment,
            )
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.APPROVAL_WITHDRAW,
                resource_type=ResearchResourceType.APPROVAL_REQUEST,
                resource_id=approval_request.id,
                actor=request.user,
                metadata={"issue": str(approval_request.issue_id)},
                request=request,
            )
            notify_requester(approval_request, request.user, "审批申请已撤回", "withdrawn")
            return Response(
                ApprovalRequestSerializer(approval_request, context={"actor": request.user}).data,
                status=status.HTTP_200_OK,
            )

        allowed, step = can_act_on_current_step(approval_request, request.user)
        if not allowed:
            return research_permission_denied()
        if step is None:
            return research_conflict(
                ResearchErrorCode.APPROVAL_STATE_CONFLICT,
                "The current step is no longer available.",
            )
        if action == "reject" and not comment.strip():
            return research_error(
                ResearchErrorCode.APPROVAL_COMMENT_REQUIRED,
                "A comment is required when rejecting.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        with transaction.atomic():
            ApprovalAction.objects.create(
                request=approval_request,
                step=step,
                actor=request.user,
                action=(
                    ApprovalAction.Action.APPROVE if action == "approve" else ApprovalAction.Action.REJECT
                ),
                comment=comment,
            )

            if action == "reject":
                approval_request.status = ApprovalRequest.Status.REJECTED
                approval_request.save(update_fields=["status", "updated_at"])
                move_issue_state(approval_request, approved=False)
            elif step_is_satisfied(approval_request, step):
                following = next_step_order(approval_request)
                if following is None:
                    approval_request.status = ApprovalRequest.Status.APPROVED
                    approval_request.save(update_fields=["status", "updated_at"])
                    move_issue_state(approval_request, approved=True)
                else:
                    approval_request.current_step_order = following
                    approval_request.save(update_fields=["current_step_order", "updated_at"])

        audit_action = (
            ResearchAuditAction.APPROVAL_APPROVE
            if action == "approve"
            else ResearchAuditAction.APPROVAL_REJECT
        )
        record_audit_event(
            workspace=workspace,
            action=audit_action,
            resource_type=ResearchResourceType.APPROVAL_REQUEST,
            resource_id=approval_request.id,
            org_unit=approval_request.org_unit,
            actor=request.user,
            metadata={
                "issue": str(approval_request.issue_id),
                "step": step.order,
                "status": approval_request.status,
            },
            request=request,
        )
        if approval_request.status == ApprovalRequest.Status.PENDING:
            notify_approvers(approval_request, request.user, "待审批：下一级")
        else:
            notify_requester(
                approval_request,
                request.user,
                "审批已完成" if approval_request.status == "APPROVED" else "审批被驳回",
                approval_request.status.lower(),
            )
        return Response(
            ApprovalRequestSerializer(approval_request, context={"actor": request.user}).data,
            status=status.HTTP_200_OK,
        )


class ResearchApprovalRequestHistoryEndpoint(ResearchAPIView):
    """``GET .../approval-requests/<pk>/history/`` (append-only)."""

    nav_capability = NAV_APPROVALS

    def get(self, request, slug, pk):
        workspace, error = self.get_workspace(section="approvals")
        if error:
            return error
        approval_request = request_queryset(workspace).filter(pk=pk).first()
        if approval_request is None:
            return research_not_found(
                ResearchErrorCode.APPROVAL_REQUEST_NOT_FOUND, "Approval request not found."
            )
        actions = list(
            ApprovalAction.objects.filter(request=approval_request)
            .select_related("actor", "step")
            .order_by("created_at")
        )
        return Response(
            {"results": ApprovalActionSerializer(actions, many=True).data, "count": len(actions)},
            status=status.HTTP_200_OK,
        )
