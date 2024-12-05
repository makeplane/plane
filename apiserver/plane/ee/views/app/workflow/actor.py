# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkflowTransitionActor, WorkflowTransition
from plane.ee.serializers import WorkflowTransitionActorSerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkflowTransitionActorEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, workflow_transition_id):
        requested_actor_ids = request.data.get("actor_ids", [])

        workflow_transition = WorkflowTransition.objects.filter(
            id=workflow_transition_id, project_id=project_id, workspace__slug=slug
        ).first()
        # Check if the workflow transition exists
        if not workflow_transition:
            return Response(
                {"error": "Workflow transition not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_actor_ids = [
            str(actor_id)
            for actor_id in WorkflowTransitionActor.objects.filter(
                workflow_transition_id=workflow_transition_id,
                project_id=project_id,
                workspace__slug=slug,
            ).values_list("actor_id", flat=True)
        ]

        # Remove the actors and add the new ones
        removed_actor_ids = list(set(existing_actor_ids) - set(requested_actor_ids))
        added_actor_ids = list(set(requested_actor_ids) - set(existing_actor_ids))

        # Remove the actors
        WorkflowTransitionActor.objects.filter(
            workflow_transition_id=workflow_transition_id,
            project_id=project_id,
            workspace__slug=slug,
            actor_id__in=removed_actor_ids,
        ).delete()

        # Add the new actors
        WorkflowTransitionActor.objects.bulk_create(
            [
                WorkflowTransitionActor(
                    project_id=project_id,
                    workflow_transition_id=workflow_transition_id,
                    workflow_id=workflow_transition.workflow_id,
                    actor_id=actor_id,
                    workspace_id=workflow_transition.workspace_id,
                )
                for actor_id in added_actor_ids
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        # Create the workflow transition
        workflow_transition_actors = WorkflowTransitionActor.objects.filter(
            project_id=project_id,
            workflow_transition_id=workflow_transition.id,
            workflow_id=workflow_transition.workflow_id,
        )
        serializer = WorkflowTransitionActorSerializer(
            workflow_transition_actors, many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
