# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.workflow import (
    ProjectWorkflowSerializer,
    WorkflowActivitySerializer,
    WorkflowStateConfigSerializer,
    WorkflowTransitionSerializer,
)
from plane.db.models import (
    ProjectMember,
    ProjectWorkflow,
    State,
    WorkflowActivity,
    WorkflowStateConfig,
    WorkflowTransition,
    WorkflowTransitionApprover,
)

from .base import BaseAPIView, BaseViewSet


def _log_activity(project_id, workspace_id, actor, field, old_value=None, new_value=None):
    """Helper to record a WorkflowActivity audit entry."""
    WorkflowActivity.objects.create(
        project_id=project_id,
        workspace_id=workspace_id,
        actor=actor,
        field=field,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
    )


class WorkflowStateConfigViewSet(BaseViewSet):
    """
    GET  /workspaces/{slug}/workflow-states/?project_id={id}
    PATCH /workspaces/{slug}/workflow-states/{state_id}/
    """

    serializer_class = WorkflowStateConfigSerializer
    model = WorkflowStateConfig

    def get_queryset(self):
        return self.model.objects.filter(
            project_id=self.kwargs.get("project_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        states = State.objects.filter(
            project_id=project_id,
            project__workspace__slug=slug,
        ).values("id")

        # Fetch only existing config rows (no auto-create; compute defaults in Python)
        configs = {
            str(c.state_id): c
            for c in WorkflowStateConfig.objects.filter(
                project_id=project_id, project__workspace__slug=slug
            )
        }
        transitions = list(
            WorkflowTransition.objects.filter(
                project_id=project_id, project__workspace__slug=slug
            ).prefetch_related("approvers")
        )

        result = {}
        for state in states:
            state_id_str = str(state["id"])
            config = configs.get(state_id_str)
            state_transitions = {
                str(t.id): {
                    "transition_state": str(t.transition_state_id),
                    "approvers": list(t.approvers.values_list("approver_id", flat=True)),
                }
                for t in transitions
                if str(t.state_id) == state_id_str
            }
            result[state_id_str] = {
                "allow_issue_creation": config.allow_issue_creation if config else True,
                "transitions": state_transitions,
            }

        return Response(result, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, state_id):
        try:
            state = State.objects.get(pk=state_id, project__workspace__slug=slug)
        except State.DoesNotExist:
            return Response({"error": "State not found"}, status=status.HTTP_404_NOT_FOUND)

        config, _ = WorkflowStateConfig.objects.get_or_create(
            project=state.project,
            state=state,
            defaults={"workspace": state.project.workspace},
        )
        old_value = config.allow_issue_creation
        serializer = WorkflowStateConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            _log_activity(
                project_id=state.project_id,
                workspace_id=state.project.workspace_id,
                actor=request.user,
                field="allow_issue_creation",
                old_value=old_value,
                new_value=serializer.data.get("allow_issue_creation"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectWorkflowViewSet(BaseAPIView):
    """
    GET   /workspaces/{slug}/projects/{project_id}/workflow/
    PATCH /workspaces/{slug}/projects/{project_id}/workflow/
    POST  /workspaces/{slug}/projects/{project_id}/workflow/reset/
    GET   /workspaces/{slug}/projects/{project_id}/workflow/activity/
    """

    def _get_or_create_workflow(self, slug, project_id):
        from plane.db.models import Project

        project = Project.objects.select_related("workspace").get(
            pk=project_id, workspace__slug=slug
        )
        workflow, _ = ProjectWorkflow.objects.get_or_create(
            project=project,
            defaults={"workspace": project.workspace, "is_live": False},
        )
        return workflow, project

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, action=None):
        if action == "activity":
            return self._activity(request, slug, project_id)

        workflow, _ = self._get_or_create_workflow(slug, project_id)
        serializer = ProjectWorkflowSerializer(workflow)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        workflow, _ = self._get_or_create_workflow(slug, project_id)
        old_live = workflow.is_live
        serializer = ProjectWorkflowSerializer(workflow, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if old_live != serializer.data.get("is_live"):
                _log_activity(
                    project_id=project_id,
                    workspace_id=workflow.workspace_id,
                    actor=request.user,
                    field="is_live",
                    old_value=old_live,
                    new_value=serializer.data.get("is_live"),
                )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, action=None):
        if action == "reset":
            return self._reset(request, slug, project_id)
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def _reset(self, request, slug, project_id):  # noqa: ARG002 — slug used in ORM scope
        """Full reset: soft-delete transitions+approvers, hard-delete configs, set is_live=False."""
        now = timezone.now()

        # Soft-delete all approvers for this project (workspace-scoped)
        approver_ids = WorkflowTransitionApprover.objects.filter(
            project_id=project_id, project__workspace__slug=slug
        ).values_list("id", flat=True)
        WorkflowTransitionApprover.objects.filter(id__in=approver_ids).update(deleted_at=now)

        # Soft-delete all transitions for this project (workspace-scoped)
        WorkflowTransition.objects.filter(
            project_id=project_id, project__workspace__slug=slug
        ).update(deleted_at=now)

        # Hard-delete all state configs (so allow_issue_creation reverts to True default)
        WorkflowStateConfig.objects.filter(
            project_id=project_id, project__workspace__slug=slug
        ).delete(soft=False)

        # Set is_live=False
        workflow = ProjectWorkflow.objects.filter(project_id=project_id).first()
        if workflow:
            workflow.is_live = False
            workflow.save()
            _log_activity(
                project_id=project_id,
                workspace_id=workflow.workspace_id,
                actor=request.user,
                field="reset",
                old_value=None,
                new_value="reset",
            )

        return Response({"message": "Workflow reset successfully"}, status=status.HTTP_200_OK)

    def _activity(self, request, slug, project_id):
        activities = WorkflowActivity.objects.filter(
            project_id=project_id,
            project__workspace__slug=slug,
        ).select_related("actor").order_by("-created_at")
        serializer = WorkflowActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkflowTransitionViewSet(BaseViewSet):
    """
    POST   /workspaces/{slug}/projects/{project_id}/workflow-transitions/
    DELETE /workspaces/{slug}/projects/{project_id}/workflow-transitions/{transition_id}/
    """

    serializer_class = WorkflowTransitionSerializer
    model = WorkflowTransition

    def get_queryset(self):
        return self.model.objects.filter(
            project_id=self.kwargs.get("project_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        ).prefetch_related("approvers")

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        from plane.db.models import Project

        state_id = request.data.get("state_id")
        transition_state_id = request.data.get("transition_state_id")
        if not state_id or not transition_state_id:
            return Response(
                {"error": "state_id and transition_state_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(state_id) == str(transition_state_id):
            return Response(
                {"error": "state_id and transition_state_id must be different"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = Project.objects.select_related("workspace").get(pk=project_id, workspace__slug=slug)
        transition = WorkflowTransition.objects.create(
            project=project,
            workspace=project.workspace,
            state_id=state_id,
            transition_state_id=transition_state_id,
        )
        _log_activity(
            project_id=project_id,
            workspace_id=project.workspace_id,
            actor=request.user,
            field="transition_added",
            old_value=None,
            new_value=f"{state_id} → {transition_state_id}",
        )
        serializer = WorkflowTransitionSerializer(transition)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        try:
            transition = WorkflowTransition.objects.get(
                pk=pk, project_id=project_id, project__workspace__slug=slug
            )
        except WorkflowTransition.DoesNotExist:
            return Response({"error": "Transition not found"}, status=status.HTTP_404_NOT_FOUND)

        _log_activity(
            project_id=project_id,
            workspace_id=transition.workspace_id,
            actor=request.user,
            field="transition_removed",
            old_value=f"{transition.state_id} → {transition.transition_state_id}",
            new_value=None,
        )
        transition.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowTransitionApproverViewSet(BaseViewSet):
    """
    POST   /workspaces/{slug}/projects/{project_id}/workflow-transitions/{transition_id}/approvers/
    DELETE /workspaces/{slug}/projects/{project_id}/workflow-transitions/{transition_id}/approvers/{approver_id}/
    """

    serializer_class = WorkflowStateConfigSerializer  # unused — responses built manually
    model = WorkflowTransitionApprover

    def get_queryset(self):
        return self.model.objects.filter(
            transition_id=self.kwargs.get("transition_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id, transition_id):
        approver_ids = request.data.get("approver_ids", [])
        if not approver_ids:
            return Response({"error": "approver_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transition = WorkflowTransition.objects.get(
                pk=transition_id,
                project_id=project_id,
                project__workspace__slug=slug,
            )
        except WorkflowTransition.DoesNotExist:
            return Response({"error": "Transition not found"}, status=status.HTTP_404_NOT_FOUND)

        # Validate all approver_ids are active project members
        valid_member_ids = set(
            ProjectMember.objects.filter(
                project_id=project_id,
                member_id__in=approver_ids,
                is_active=True,
            ).values_list("member_id", flat=True)
        )
        invalid_ids = [aid for aid in approver_ids if str(aid) not in {str(v) for v in valid_member_ids}]
        if invalid_ids:
            return Response(
                {"error": "Some approver_ids are not active project members"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        for approver_id in approver_ids:
            approver, _ = WorkflowTransitionApprover.objects.get_or_create(
                transition=transition,
                approver_id=approver_id,
                defaults={
                    "project_id": project_id,
                    "workspace_id": transition.workspace_id,
                },
            )
            created.append(str(approver_id))

        _log_activity(
            project_id=project_id,
            workspace_id=transition.workspace_id,
            actor=request.user,
            field="approvers_added",
            old_value=None,
            new_value=", ".join(created),
        )
        serializer = WorkflowTransitionSerializer(transition)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, transition_id, pk):
        try:
            approver = WorkflowTransitionApprover.objects.get(
                approver_id=pk,
                transition_id=transition_id,
                project_id=project_id,
                project__workspace__slug=slug,
            )
        except WorkflowTransitionApprover.DoesNotExist:
            return Response({"error": "Approver not found"}, status=status.HTTP_404_NOT_FOUND)

        _log_activity(
            project_id=project_id,
            workspace_id=approver.workspace_id,
            actor=request.user,
            field="approver_removed",
            old_value=str(approver.approver_id),
            new_value=None,
        )
        approver.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
