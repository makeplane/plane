import json

# Django imports
from django.db.models import Q
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import State, Workspace
from plane.ee.views.base import BaseAPIView
from plane.ee.models import (
    Workflow,
    WorkflowTransition,
    WorkflowTransitionApprover,
)
from plane.ee.serializers import WorkflowSerializer, WorkflowTransitionSerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.workflow_activity_task import workflow_activity


class WorkflowTransitionEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        state_id = request.data.pop("state_id")
        transition_state_id = request.data.pop("transition_state_id")

        # Check if the state id and transition state id are provided
        if not state_id or not transition_state_id:
            return Response(
                {"error": "State id and transition state id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check if the transition state already exists
        workflow = Workflow.objects.filter(
            project_id=project_id, state_id=state_id, workspace__slug=slug
        ).first()
        if not workflow:
            workflow = Workflow.objects.create(
                project_id=project_id,
                state_id=state_id,
                updated_by=request.user,
                created_by=request.user,
            )

        workflow_transition = WorkflowTransition.objects.filter(
            project_id=project_id,
            workflow__state_id=state_id,
            transition_state_id=transition_state_id,
        )
        if not workflow_transition:
            # Create the workflow transition
            workflow_transition = WorkflowTransition.objects.create(
                project_id=project_id,
                workflow_id=workflow.id,
                transition_state_id=transition_state_id,
            )
            workflow_activity.delay(
                type="workflow_transition.activity.created",
                requested_data=json.dumps(
                    {"transition_state_id": str(transition_state_id)}
                ),
                actor_id=str(request.user.id),
                workflow_id=workflow.id,
                project_id=str(project_id),
                current_instance=None,
                slug=slug,
                epoch=int(timezone.now().timestamp()),
            )

        serializer = WorkflowTransitionSerializer(workflow_transition)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, pk=None):
        workflow_transition = WorkflowTransition.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        workflow_transition.transition_state_id = request.data.get(
            "transition_state_id", workflow_transition.transition_state_id
        )
        workflow_transition.save()
        serializer = WorkflowTransitionSerializer(workflow_transition)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, pk=None):
        workflow_transition = WorkflowTransition.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        current_instance = json.dumps(
            {"transition_state_id": str(workflow_transition.transition_state_id)}
        )
        workflow_transition.delete()
        workflow_activity.delay(
            type="workflow_transition.activity.deleted",
            requested_data=None,
            actor_id=str(request.user.id),
            workflow_id=str(workflow_transition.workflow_id),
            project_id=str(project_id),
            slug=slug,
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowEndpoint(BaseAPIView):
    """
    Endpoint to get the project workflow
    """

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def get(self, request, slug):
        project_id = request.query_params.get("project_id", None)

        # Define a filter condition based on project_id
        filter_condition = Q(workspace__slug=slug)
        if project_id:
            # Get all the states for the project
            states = State.objects.filter(
                workspace__slug=slug, project_id=project_id
            ).values_list("id", flat=True)

            workflows = Workflow.objects.filter(
                workspace__slug=slug, project_id=project_id
            ).values_list("state_id", flat=True)

            # get the states that are not in the workflow table
            states = set(states) - set(workflows)

            workspace = Workspace.objects.get(slug=slug)

            # now bulk create the workflows
            if states:
                Workflow.objects.bulk_create(
                    [
                        Workflow(
                            workspace_id=workspace.id,
                            project_id=project_id,
                            state_id=state_id,
                            created_by=request.user,
                            updated_by=request.user,
                        )
                        for state_id in states
                    ],
                    ignore_conflicts=True,
                )

            filter_condition &= Q(project_id=project_id)

        # Get the workflow states
        workflow_states = Workflow.objects.filter(filter_condition).values(
            "state_id", "id", "allow_issue_creation"
        )

        # Get the workflow transitions
        workflow_transitions = WorkflowTransition.objects.filter(
            filter_condition
        ).values("id", "transition_state_id", "workflow_id")

        # Get the workflow transition actors
        workflow_transition_actors = WorkflowTransitionApprover.objects.filter(
            filter_condition
        ).values("workflow_transition_id", "approver_id")

        # Create the project workflow structure
        project_workflows = {}

        for workflow_state in workflow_states:
            state_id = str(workflow_state["state_id"])
            project_workflows[state_id] = {
                "allow_issue_creation": workflow_state["allow_issue_creation"],
                "transitions": {
                    str(workflow_transition["id"]): {
                        "transition_state_id": str(
                            workflow_transition["transition_state_id"]
                        ),
                        "approvers": [
                            str(actor["approver_id"])
                            for actor in workflow_transition_actors
                            if str(actor["workflow_transition_id"])
                            == str(workflow_transition["id"])
                        ],
                    }
                    for workflow_transition in workflow_transitions
                    if str(workflow_transition["workflow_id"])
                    == str(workflow_state["id"])
                },
            }

        # Return the project workflow structure
        return Response(project_workflows, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, state_id):
        workflow = Workflow.objects.select_related("state").get(
            workspace__slug=slug, state_id=state_id
        )
        if workflow.state.default:
            return Response(
                {"error": "Cannot update default state"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current_instance = json.dumps(
            {"allow_issue_creation": workflow.allow_issue_creation}
        )

        serializer = WorkflowSerializer(workflow, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            workflow_activity.delay(
                type="workflow_transition.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                workflow_id=str(workflow.id),
                project_id=str(workflow.project_id),
                slug=slug,
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id):
        # Get the workflow for the project
        workflow = Workflow.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        # update the workflows for the project
        Workflow.objects.filter(workspace__slug=slug, project_id=project_id).update(
            allow_issue_creation=True
        )

        WorkflowTransition.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).delete()

        WorkflowTransitionApprover.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).delete()

        WorkflowTransitionApprover.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).delete()

        workflow_activity.delay(
            type="workflow_reset.activity.updated",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            workflow_id=str(workflow.id),
            project_id=str(project_id),
            slug=slug,
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
