# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import json

from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    OuterRef,
    Q,
    Subquery,
    UUIDField,
    Value,
)

from plane.db.models import Workspace, State, Issue
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host
from plane.ee.views.base import BaseAPIView
from plane.ee.models import (
    WorkflowState,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowTransitionApprover,
    WorkflowTransitionHook,
    WorkflowWorkItemType,
)
from plane.ee.permissions import allow_permission, ROLE
from plane.ee.serializers import WorkflowStateSerializer, WorkflowTransitionSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.workflow_activity_task import workflow_activity
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.response import Response


class WorkflowStatesEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id, workflow_id):
        state_ids = request.data.get("state_ids", [])
        if not state_ids:
            return Response({"error": "State ids are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter out states that already have a workflow state
        existing_workflow_states = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id__in=state_ids
        ).values_list("state_id", flat=True)
        new_state_ids = set(state_ids) - set(str(s) for s in existing_workflow_states)

        # Get the workflow to access its workspace
        workspace = Workspace.objects.get(slug=slug)

        # Get all current workflow state IDs before the operation
        all_current_state_ids = list(
            str(sid)
            for sid in WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id).values_list(
                "state_id", flat=True
            )
        )

        # Bulk create workflow states
        _ = WorkflowState.objects.bulk_create(
            [
                WorkflowState(
                    project_id=project_id,
                    workspace_id=workspace.id,
                    state_id=state_id,
                    workflow_id=workflow_id,
                )
                for state_id in new_state_ids
            ],
            ignore_conflicts=True,
        )
        # create activity for the workflow states
        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type="workflow_state.activity.created",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            workflow_state_id=None,
            project_id=str(project_id),
            current_instance=json.dumps({"state_ids": all_current_state_ids}, cls=DjangoJSONEncoder),
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, workflow_id, state_id):
        workflow_state = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=state_id
        ).first()
        if not workflow_state:
            return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)
        state_type = request.data.get("type")
        current_instance = json.dumps(
            {"type": workflow_state.type, "state_id": str(state_id)},
            cls=DjangoJSONEncoder,
        )
        if state_type and workflow_state.type != request.data.get("type"):
            # delete the current transitions
            WorkflowTransition.objects.filter(
                workflow_state_id=workflow_state.id,
                project_id=project_id,
                workspace__slug=slug,
            ).delete()

            # delete the members associated with the transitions
            WorkflowTransitionApprover.objects.filter(
                workflow_state_id=workflow_state.id,
                project_id=project_id,
                workspace__slug=slug,
            ).delete()

            # update the workflow state
            workflow_state.type = state_type
            workflow_state.save()
            workflow_activity.delay(
                workflow_id=str(workflow_id),
                type="workflow_state.activity.updated",
                requested_data=json.dumps(
                    {"type": request.data.get("type"), "state_id": str(state_id)},
                    cls=DjangoJSONEncoder,
                ),
                actor_id=str(request.user.id),
                workflow_state_id=str(workflow_state.id),
                project_id=str(project_id),
                current_instance=current_instance,
                slug=slug,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(
                WorkflowStateSerializer(workflow_state).data,
                status=status.HTTP_201_CREATED,
            )
        else:
            serializer = WorkflowStateSerializer(workflow_state, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                workflow_activity.delay(
                    workflow_id=str(workflow_id),
                    type="workflow_state.activity.updated",
                    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    workflow_state_id=str(workflow_state.id),
                    project_id=str(project_id),
                    current_instance=current_instance,
                    slug=slug,
                    epoch=int(timezone.now().timestamp()),
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, workflow_id, state_id):
        workflow_state = (
            WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id, state_id=state_id)
            .select_related("workflow")
            .first()
        )
        if not workflow_state:
            return Response(
                {"error": "Workflow state not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        current_instance = json.dumps(
            {"state_id": str(state_id), "type": workflow_state.type},
            cls=DjangoJSONEncoder,
        )

        # check if the workflow state is from default workflow, if yes then don't allow deletion
        if workflow_state.workflow.is_default:
            return Response(
                {"error": "Default workflow states cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # delete the transition in which the state is present
        WorkflowTransition.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        WorkflowTransitionApprover.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        WorkflowTransitionHook.objects.filter(
            workflow_transition__workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type="workflow_state.activity.deleted",
            requested_data=None,
            actor_id=str(request.user.id),
            workflow_state_id=workflow_state.id,
            project_id=str(project_id),
            current_instance=current_instance,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )
        workflow_state.delete()

        return Response(status=status.HTTP_200_OK)


class WorkflowStateTransitionsEndpoint(BaseAPIView):
    def _send_transition_activity(
        self,
        *,
        workflow_id,
        workflow_state,
        activity_type,
        transition_state_id,
        rejection_state_id,
        state_type,
        request,
        slug,
        project_id,
        current_instance=None,
    ):
        """Dispatch a workflow transition activity to the background task."""
        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type=activity_type,
            requested_data=json.dumps(
                {
                    "transition_state_id": (str(transition_state_id) if transition_state_id else None),
                    "rejection_state_id": (str(rejection_state_id) if rejection_state_id else None),
                    "type": state_type,
                }
            ),
            actor_id=str(request.user.id),
            workflow_state_id=str(workflow_state.id),
            project_id=str(project_id),
            current_instance=current_instance,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )

    def _get_annotated_transition(self, transition_id):
        """Fetch a transition with member_ids annotated."""
        return (
            WorkflowTransition.objects.filter(id=transition_id)
            .annotate(
                member_ids=Coalesce(
                    Subquery(
                        WorkflowTransitionApprover.objects.filter(
                            workflow_transition_id=OuterRef("pk"),
                        )
                        .values("workflow_transition_id")
                        .annotate(arr=ArrayAgg("approver_id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .first()
        )

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, workflow_id):
        state_id = request.data.pop("state_id")
        member_ids = request.data.pop("member_ids", [])
        transition_state_id = request.data.get("transition_state_id")
        rejection_state_id = request.data.get("rejection_state_id")

        # Get the workflow state
        workflow_state = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=state_id
        ).first()
        if not workflow_state:
            return Response(
                {"error": "Workflow state not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # check if the multiple workflows feature flag is enabled
        if workflow_state.type == WorkflowStateType.APPROVAL and not check_workspace_feature_flag(
            slug=slug,
            feature_key=FeatureFlag.MULTIPLE_WORKFLOWS,
            user_id=request.user.id,
        ):
            return Response(
                {"error": "You are not allowed to create a approval transition."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if a transition already exists for this state
        workflow_transition = WorkflowTransition.objects.filter(
            project_id=project_id,
            workflow_state__workflow_id=workflow_id,
            workflow_state__state_id=state_id,
            transition_state_id=transition_state_id,
        ).first()
        if workflow_transition:
            return Response(
                {"error": "Workflow transition already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create new transition
        serializer = WorkflowTransitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save(
            project_id=project_id,
            workflow_state_id=workflow_state.id,
        )
        if member_ids:
            WorkflowTransitionApprover.objects.bulk_create(
                [
                    WorkflowTransitionApprover(
                        project_id=project_id,
                        workflow_transition_id=serializer.data["id"],
                        workflow_state_id=workflow_state.id,
                        approver_id=member_id,
                        workspace_id=workflow_state.workspace_id,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                    )
                    for member_id in member_ids
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        # Activities after commit
        self._send_transition_activity(
            workflow_id=str(workflow_id),
            workflow_state=workflow_state,
            activity_type="workflow_transition.activity.created",
            transition_state_id=transition_state_id,
            rejection_state_id=rejection_state_id,
            state_type=workflow_state.type,
            request=request,
            slug=slug,
            project_id=project_id,
        )
        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type="workflow_approver.activity.updated",
            requested_data=json.dumps(
                {
                    "added_approver_ids": member_ids or [],
                    "removed_approver_ids": [],
                }
            ),
            actor_id=str(request.user.id),
            workflow_state_id=str(workflow_state.id),
            project_id=str(project_id),
            current_instance=None,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )
        # get the response data
        transition = self._get_annotated_transition(serializer.data["id"])
        response_data = WorkflowTransitionSerializer(transition).data
        return Response(response_data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, workflow_id, transition_id):
        transition_state_id = request.data.get("transition_state_id")
        rejection_state_id = request.data.get("rejection_state_id")

        # Get the workflow transition
        workflow_transition = (
            WorkflowTransition.objects.filter(id=transition_id, project_id=project_id, workspace__slug=slug)
            .select_related("workflow_state")
            .first()
        )
        if not workflow_transition:
            return Response(
                {"error": "Workflow transition not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        workflow_state_type = workflow_transition.workflow_state.type
        current_instance = json.dumps(
            {
                "transition_state_id": (
                    str(workflow_transition.transition_state_id) if workflow_transition.transition_state_id else None
                ),
                "rejection_state_id": (
                    str(workflow_transition.rejection_state_id) if workflow_transition.rejection_state_id else None
                ),
            },
            cls=DjangoJSONEncoder,
        )

        serializer = WorkflowTransitionSerializer(workflow_transition, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        # check if the members are dropped or added
        if request.data.get("member_ids") is not None:
            requested_approver_ids = request.data.get("member_ids")
            existing_approver_ids = [
                str(actor_id)
                for actor_id in WorkflowTransitionApprover.objects.filter(
                    workflow_transition_id=transition_id,
                    workflow_state__workflow_id=workflow_id,
                    project_id=project_id,
                    workspace__slug=slug,
                ).values_list("approver_id", flat=True)
            ]
            # Remove the actors and add the new ones
            removed_approver_ids = list(set(existing_approver_ids) - set(requested_approver_ids))
            added_approver_ids = list(set(requested_approver_ids) - set(existing_approver_ids))
            # Remove the actors
            WorkflowTransitionApprover.objects.filter(
                workflow_transition_id=transition_id,
                workflow_state__workflow_id=workflow_id,
                project_id=project_id,
                workspace__slug=slug,
                approver_id__in=removed_approver_ids,
            ).delete()
            # Add the new actors
            WorkflowTransitionApprover.objects.bulk_create(
                [
                    WorkflowTransitionApprover(
                        project_id=project_id,
                        workflow_transition_id=transition_id,
                        workflow_state_id=workflow_transition.workflow_state_id,
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

            workflow_activity.delay(
                workflow_id=str(workflow_id),
                type="workflow_approver.activity.updated",
                requested_data=json.dumps(
                    {
                        "added_approver_ids": added_approver_ids or [],
                        "removed_approver_ids": removed_approver_ids or [],
                    }
                ),
                actor_id=str(request.user.id),
                workflow_state_id=str(workflow_transition.workflow_state_id),
                project_id=str(project_id),
                current_instance=None,
                slug=slug,
                epoch=int(timezone.now().timestamp()),
            )

        self._send_transition_activity(
            workflow_id=str(workflow_id),
            workflow_state=workflow_transition.workflow_state,
            activity_type="workflow_transition.activity.updated",
            transition_state_id=transition_state_id,
            rejection_state_id=rejection_state_id,
            state_type=workflow_state_type,
            request=request,
            slug=slug,
            current_instance=current_instance,
            project_id=project_id,
        )

        transition = self._get_annotated_transition(transition_id)
        response_data = WorkflowTransitionSerializer(transition).data
        return Response(response_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, workflow_id, transition_id):
        workflow_transition = WorkflowTransition.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=transition_id
        ).first()
        if not workflow_transition:
            return Response({"error": "Workflow transition not found"}, status=status.HTTP_404_NOT_FOUND)
        current_instance = json.dumps({"transition_state_id": str(workflow_transition.transition_state_id)})
        workflow_transition.delete()
        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type="workflow_transition.activity.deleted",
            requested_data=None,
            actor_id=str(request.user.id),
            workflow_state_id=workflow_transition.workflow_state_id,
            project_id=str(project_id),
            slug=slug,
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowStateTransferEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, workflow_id, state_id):
        new_state_id = request.data.get("new_state_id")
        if not new_state_id:
            return Response(
                {"error": "new_state_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the source workflow state exists
        old_workflow_state = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=state_id
        ).first()
        if not old_workflow_state:
            return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        # validate the target workflow state exists
        if not WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=new_state_id
        ).exists():
            return Response({"error": "Target workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent transferring to the same state
        if str(state_id) == str(new_state_id):
            return Response(
                {"error": "new_state_id must be different from the current state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the target state belongs to the same project
        if not State.objects.filter(id=new_state_id, project_id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "Target state not found in this project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Base queryset for transitions in this workflow
        transitions_qs = WorkflowTransition.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            workflow_state__workflow_id=workflow_id,
        )

        # The state being removed must not be referenced as a transition_state or rejection_state
        # in any WorkflowTransition within this workflow.
        if transitions_qs.filter(Q(transition_state_id=state_id) | Q(rejection_state_id=state_id)).exists():
            return Response(
                {"error": "The state is referenced as a transition or rejection in one or more workflow transitions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # delete the workflow state
        WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id, state_id=state_id).delete()

        current_instance = json.dumps(
            {
                "state_id": str(state_id),
                "new_state_id": str(new_state_id),
                "type": old_workflow_state.type,
            },
            cls=DjangoJSONEncoder,
        )

        # Move all issues of the relevant work item types from the old state to the new state.
        work_item_type_ids = WorkflowWorkItemType.objects.filter(
            workflow_id=workflow_id,
            project_id=project_id,
        ).values_list("work_item_type_id", flat=True)

        affected_issue_ids = list(
            Issue.objects.filter(
                project_id=project_id,
                state_id=state_id,
                type_id__in=work_item_type_ids,
            ).values_list("id", flat=True)
        )

        Issue.objects.filter(id__in=affected_issue_ids).update(state_id=new_state_id)

        # current_instance is the same for all issues — they all transition from the same state
        current_instance = json.dumps({"state_id": str(state_id)}, cls=DjangoJSONEncoder)
        requested_data = json.dumps({"state_id": str(new_state_id)})
        epoch = int(timezone.now().timestamp())
        for issue_id in affected_issue_ids:
            issue_activity.delay(
                type="issue.activity.workflow_state_transferred",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=epoch,
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        workflow_activity.delay(
            workflow_id=str(workflow_id),
            type="workflow_state.activity.transferred",
            requested_data=json.dumps(
                {"new_state_id": str(new_state_id), "affected_count": len(affected_issue_ids)},
                cls=DjangoJSONEncoder,
            ),
            actor_id=str(request.user.id),
            workflow_state_id=str(old_workflow_state.id),
            project_id=str(project_id),
            current_instance=current_instance,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_200_OK)
