# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import Workflow, WorkflowTransition, WorkflowTransitionActor
from plane.ee.serializers import WorkflowSerializer, WorkflowTransitionSerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkflowEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def get(self, request, slug, project_id, pk=None):
        if pk:
            workflow = Workflow.objects.get(
                pk=pk, project_id=project_id, workspace__slug=slug
            )
            serializer = WorkflowSerializer(workflow)
            return Response(serializer.data, status=status.HTTP_200_OK)

        workflows = Workflow.objects.filter(project_id=project_id, workspace__slug=slug)
        serializer = WorkflowSerializer(workflows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        serializer = WorkflowSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, pk):
        workflow = Workflow.objects.get(pk=pk)
        serializer = WorkflowSerializer(workflow, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, pk):
        workflow = Workflow.objects.get(pk=pk)
        workflow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowTransitionEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        # Check if the state id and transition state id
        state_id = request.data.pop("state_id")
        transition_state_id = request.data.pop("transition_state_id")

        if not state_id or not transition_state_id:
            # Return error
            return Response(
                {"error": "State id and transition state id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check if the transition state workflow exists
        workflow = Workflow.objects.filter(
            project_id=project_id, state_id=state_id, workspace__slug=slug
        ).first()
        if not workflow:
            workflow = Workflow.objects.create(project_id=project_id, state_id=state_id)

        # Create the workflow transition
        workflow_transition = WorkflowTransition.objects.create(
            project_id=project_id,
            workflow_id=workflow.id,
            transition_state_id=transition_state_id,
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
        workflow_transition.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorkflowEndpoint(BaseAPIView):
    """
    Endpoint to get the project workflow
    """

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT"
    )
    def get(self, request, slug, project_id):
        # Get the workflow states
        workflow_states = Workflow.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values("state_id", "id")

        # Get the workflow transitions
        workflow_transitions = WorkflowTransition.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values("id", "transition_state_id", "workflow_id")

        # Get the workflow transition actors
        workflow_transition_actors = WorkflowTransitionActor.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values("workflow_transition_id", "actor_id")

        # Create the project workflow structure
        project_workflows = {}
        for workflow_state in workflow_states:
            project_workflows[str(workflow_state["state_id"])] = {
                str(workflow_transition["id"]): {
                    "transition_state_id": str(
                        workflow_transition["transition_state_id"]
                    ),
                    "actors": [
                        str(workflow_transition_actor["actor_id"])
                        for workflow_transition_actor in workflow_transition_actors
                        if (
                            str(workflow_transition_actor["workflow_transition_id"])
                            == str(workflow_transition["id"])
                        )
                    ],
                }
                for workflow_transition in workflow_transitions
                if str(workflow_transition["workflow_id"]) == str(workflow_state["id"])
            }

        # Return the project workflow structure
        return Response(project_workflows, status=status.HTTP_200_OK)
