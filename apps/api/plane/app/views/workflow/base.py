# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkflowApprovalSerializer,
    WorkflowFlowSerializer,
    WorkflowHistorySerializer,
    WorkflowSerializer,
    WorkflowStateConfigSerializer,
)
from plane.db.models import (
    Issue,
    Project,
    State,
    Workflow,
    WorkflowApproval,
    WorkflowFlow,
    WorkflowHistory,
    WorkflowStateConfig,
)
from plane.utils.workflow import (
    create_default_workflow,
    get_allowed_target_state_ids,
    get_pending_approval,
    log_workflow_change,
    request_approval,
    resolve_approval,
    validate_state_transition,
)

from .. import BaseAPIView, BaseViewSet


class WorkflowViewSet(BaseViewSet):
    serializer_class = WorkflowSerializer
    model = Workflow

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project_id = self.kwargs.get("project_id")
        context["project_id"] = project_id
        project = Project.objects.filter(pk=project_id).only("workspace_id").first()
        if project:
            context["workspace_id"] = project.workspace_id
        return context

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("issue_type")
            .prefetch_related(
                "state_configs__state", "flows__source_state", "flows__target_state", "flows__reject_state"
            )
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        workflows = WorkflowSerializer(self.get_queryset(), many=True, context=self.get_serializer_context()).data
        return Response(workflows, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        serializer = WorkflowSerializer(
            data=request.data, context={**self.get_serializer_context(), "request": request}
        )
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        workflow = self.get_queryset().filter(pk=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkflowSerializer(workflow, context={**self.get_serializer_context(), "request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        workflow = self.get_queryset().filter(pk=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkflowSerializer(
            workflow,
            data=request.data,
            partial=True,
            context={**self.get_serializer_context(), "request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        workflow = self.get_queryset().filter(pk=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)
        if workflow.is_default:
            return Response({"error": "Default workflow cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)

        log_workflow_change(workflow, "deleted", {"name": workflow.name}, request.user.id)
        workflow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN])
    def toggle_pause(self, request, slug, project_id, pk):
        workflow = self.get_queryset().filter(pk=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow.is_paused = not workflow.is_paused
        workflow.save(update_fields=["is_paused", "updated_at"])
        log_workflow_change(
            workflow,
            "paused" if workflow.is_paused else "resumed",
            {"is_paused": workflow.is_paused},
            request.user.id,
        )
        return Response(
            WorkflowSerializer(workflow, context={**self.get_serializer_context(), "request": request}).data
        )


class WorkflowBulkConfigEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def put(self, request, slug, project_id, workflow_id):
        workflow = Workflow.objects.filter(
            pk=workflow_id,
            project_id=project_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

        state_configs_data = request.data.get("state_configs", [])
        flows_data = request.data.get("flows", [])

        now = timezone.now()
        WorkflowStateConfig.objects.filter(workflow=workflow, deleted_at__isnull=True).update(deleted_at=now)
        WorkflowFlow.objects.filter(workflow=workflow, deleted_at__isnull=True).update(deleted_at=now)

        context = {
            "request": request,
            "project_id": project_id,
            "workspace_id": workflow.workspace_id,
        }

        for config_data in state_configs_data:
            config_serializer = WorkflowStateConfigSerializer(data=config_data, context=context)
            if config_serializer.is_valid():
                config_serializer.save(workflow=workflow, project_id=project_id)
            else:
                return Response(config_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for flow_data in flows_data:
            flow_serializer = WorkflowFlowSerializer(data=flow_data, context=context)
            if flow_serializer.is_valid():
                flow_serializer.save(workflow=workflow, project_id=project_id)
            else:
                return Response(flow_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        log_workflow_change(
            workflow,
            "configured",
            {
                "state_configs_count": len(state_configs_data),
                "flows_count": len(flows_data),
            },
            request.user.id,
        )

        refreshed = Workflow.objects.prefetch_related(
            "state_configs__state",
            "flows__source_state",
            "flows__target_state",
            "flows__reject_state",
        ).get(pk=workflow.id)
        return Response(
            WorkflowSerializer(refreshed, context={**context, "request": request}).data,
            status=status.HTTP_200_OK,
        )


class WorkflowHistoryEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, workflow_id):
        history = WorkflowHistory.objects.filter(
            workflow_id=workflow_id,
            project_id=project_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).select_related("created_by")
        return Response(WorkflowHistorySerializer(history, many=True).data, status=status.HTTP_200_OK)


class ProjectWorkflowStatesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        workflows = Workflow.objects.filter(
            project_id=project_id,
            deleted_at__isnull=True,
        ).prefetch_related(
            "state_configs__state", "flows__source_state", "flows__target_state", "flows__reject_state"
        )

        states = State.objects.filter(
            project_id=project_id, deleted_at__isnull=True, is_triage=False
        ).order_by("sequence")

        return Response(
            {
                "is_workflow_enabled": project.is_workflow_enabled,
                "states": [
                    {
                        "id": str(state.id),
                        "name": state.name,
                        "color": state.color,
                        "group": state.group,
                        "sequence": state.sequence,
                        "default": state.default,
                    }
                    for state in states
                ],
                "workflows": WorkflowSerializer(
                    workflows,
                    many=True,
                    context={
                        "request": request,
                        "project_id": project_id,
                        "workspace_id": project.workspace_id,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class IssueWorkflowStatusEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = (
            Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug)
            .select_related("project")
            .first()
        )
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        pending = get_pending_approval(issue)
        allowed_ids = get_allowed_target_state_ids(issue, request.user.id)

        return Response(
            {
                "is_workflow_enabled": issue.project.is_workflow_enabled,
                "allowed_state_ids": allowed_ids,
                "pending_approval": WorkflowApprovalSerializer(pending).data if pending else None,
                "blocker_message": "This work item is awaiting approval." if pending else None,
            },
            status=status.HTTP_200_OK,
        )


class IssueWorkflowTransitionEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        issue = (
            Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug)
            .select_related("project")
            .first()
        )
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        target_state_id = request.data.get("state_id")
        if not target_state_id:
            return Response({"state_id": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        result = validate_state_transition(issue, issue.state_id, target_state_id, request.user.id)

        if result.pending_approval:
            return Response({"error": result.error_message}, status=status.HTTP_400_BAD_REQUEST)

        if not result.allowed and result.needs_approval and result.flow:
            approval = request_approval(issue, result.flow, request.user.id)
            return Response(
                {
                    "needs_approval": True,
                    "approval": WorkflowApprovalSerializer(approval).data,
                    "message": result.error_message,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        if not result.allowed:
            return Response({"error": result.error_message}, status=status.HTTP_400_BAD_REQUEST)

        issue.state_id = target_state_id
        issue.updated_by_id = request.user.id
        issue.save(update_fields=["state_id", "updated_at", "updated_by_id"])

        return Response({"state_id": str(issue.state_id)}, status=status.HTTP_200_OK)


class WorkflowApprovalActionEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id, approval_id, action):
        approval = WorkflowApproval.objects.filter(
            pk=approval_id,
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).select_related("flow", "issue", "issue__project").first()

        if not approval:
            return Response({"error": "Approval not found"}, status=status.HTTP_404_NOT_FOUND)

        if action not in ("approve", "reject"):
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            issue = resolve_approval(approval, request.user.id, approved=action == "approve")
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "approval": WorkflowApprovalSerializer(approval).data,
                "state_id": str(issue.state_id) if issue.state_id else None,
            },
            status=status.HTTP_200_OK,
        )


class ProjectWorkflowEnableEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        enabled = request.data.get("is_workflow_enabled", not project.is_workflow_enabled)
        project.is_workflow_enabled = enabled
        project.save(update_fields=["is_workflow_enabled", "updated_at"])

        if enabled and not Workflow.objects.filter(project=project, is_default=True, deleted_at__isnull=True).exists():
            create_default_workflow(project, request.user)

        return Response({"is_workflow_enabled": project.is_workflow_enabled}, status=status.HTTP_200_OK)
