# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkflowTransitionApprover, WorkflowTransition
from plane.ee.serializers import WorkflowTransitionActorSerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.workflow_activity_task import workflow_activity


class WorkflowTransitionApproverEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, workflow_transition_id):
        requested_approver_ids = request.data.get("approver_ids", [])
        workflow_transition = WorkflowTransition.objects.filter(
            id=workflow_transition_id, project_id=project_id, workspace__slug=slug
        ).first()
        # Check if the workflow transition exists
        if not workflow_transition:
            return Response(
                {"error": "Workflow transition not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing_approver_ids = [
            str(actor_id)
            for actor_id in WorkflowTransitionApprover.objects.filter(
                workflow_transition_id=workflow_transition_id,
                project_id=project_id,
                workspace__slug=slug,
            ).values_list("approver_id", flat=True)
        ]
        # Remove the actors and add the new ones
        removed_approver_ids = list(
            set(existing_approver_ids) - set(requested_approver_ids)
        )
        added_approver_ids = list(
            set(requested_approver_ids) - set(existing_approver_ids)
        )
        # Remove the actors
        WorkflowTransitionApprover.objects.filter(
            workflow_transition_id=workflow_transition_id,
            project_id=project_id,
            workspace__slug=slug,
            approver_id__in=removed_approver_ids,
        ).delete()
        # Add the new actors
        WorkflowTransitionApprover.objects.bulk_create(
            [
                WorkflowTransitionApprover(
                    project_id=project_id,
                    workflow_transition_id=workflow_transition_id,
                    workflow_id=workflow_transition.workflow_id,
                    approver_id=actor_id,
                    workspace_id=workflow_transition.workspace_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for actor_id in added_approver_ids
            ],
            batch_size=10,
            ignore_conflicts=True,
        )
        # Create the workflow transition
        workflow_transition_actors = WorkflowTransitionApprover.objects.filter(
            project_id=project_id,
            workflow_transition_id=workflow_transition.id,
            workflow_id=workflow_transition.workflow_id,
        )
        serializer = WorkflowTransitionActorSerializer(
            workflow_transition_actors, many=True
        )
        workflow_activity.delay(
            type="workflow_approver.activity.updated",
            requested_data=json.dumps(
                {
                    "added_approver_ids": added_approver_ids or [],
                    "removed_approver_ids": removed_approver_ids or [],
                }
            ),
            actor_id=str(request.user.id),
            workflow_id=str(workflow_transition.workflow_id),
            project_id=str(project_id),
            current_instance=None,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
