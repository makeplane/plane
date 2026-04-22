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

# Python imports
import json

# Django imports
from django.db import transaction
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.utils.host import base_host
from plane.db.models import Issue
from plane.ee.views.base import BaseAPIView
from plane.ee.models import (
    WorkflowTransitionApprover,
    WorkflowTransition,
    WorkflowState,
    WorkflowStateType,
)
from plane.ee.serializers import WorkflowTransitionActorSerializer
from plane.permissions import can, WorkflowPermissions
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.workflow_activity_task import workflow_activity
from plane.ee.utils.workflow import WorkflowStateManager
from plane.app.serializers.issue import IssueSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity


class WorkflowTransitionMemberEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, workflow_id, transition_id):
        requested_approver_ids = request.data.get("approver_ids", [])
        workflow_transition = WorkflowTransition.objects.filter(
            id=transition_id, project_id=project_id, workspace__slug=slug, workflow_state__workflow_id=workflow_id
        ).first()
        # Check if the workflow transition exists
        if not workflow_transition:
            return Response(
                {"error": "Workflow transition not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if workflow_transition.workflow_state.type == WorkflowStateType.APPROVAL and not check_workspace_feature_flag(
            feature_key=FeatureFlag.APPROVALS,
            slug=slug,
            user_id=str(request.user.id),
        ):
            return Response(
                {"error": "Approvals are not enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
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
        # Create the workflow transition
        workflow_transition_actors = WorkflowTransitionApprover.objects.filter(
            project_id=project_id,
            workflow_transition_id=workflow_transition.id,
            workflow_state_id=workflow_transition.workflow_state_id,
        )
        serializer = WorkflowTransitionActorSerializer(workflow_transition_actors, many=True)
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
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkflowWorkItemApproverEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.APPROVALS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, work_item_id):
        action_type = request.data.get("type", None)
        if action_type not in ["approve", "reject"]:
            return Response(
                {"error": "Type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue = Issue.objects.filter(id=work_item_id, project_id=project_id, workspace__slug=slug).first()
        if not issue:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get the workflow associated with the issue's work item type
        # if no type, fall back to the default workflow
        workflow_manager = WorkflowStateManager(project_id=project_id, slug=slug)
        workflow = workflow_manager._get_workflow(type_id=issue.type_id, user_id=str(request.user.id))

        if not workflow:
            return Response(
                {"error": "Workflow not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check if the workflow has the transition as approval state
        workflow_state = WorkflowState.objects.filter(
            workflow_id=workflow.id,
            project_id=project_id,
            workspace__slug=slug,
            state_id=issue.state_id,
        ).first()

        if not workflow_state or workflow_state.type != WorkflowStateType.APPROVAL:
            return Response(
                {"error": "Issue is not in an approval state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get the workflow transition
        workflow_transition = WorkflowTransition.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).first()
        if not workflow_transition:
            return Response(
                {"error": "Workflow transition not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get the approvers for the workflow state
        approvers = WorkflowTransitionApprover.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).values_list("approver_id", flat=True)

        if not approvers:
            return Response(
                {"error": "No approvers found for the workflow state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.id not in approvers:
            return Response(
                {"error": "You are not an approver for this workflow state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # resolve the target state based on action type
        new_state_id = (
            workflow_transition.transition_state_id
            if action_type == "approve"
            else workflow_transition.rejection_state_id
        )

        current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)

        with transaction.atomic():
            # Run pre-validation and schedule post-actions via the shared util when
            # the feature flag is enabled. Fails open so a runner outage never blocks an approval.
            if check_workspace_feature_flag(
                feature_key=FeatureFlag.WORKFLOW_CONDITIONS,
                slug=slug,
                user_id=str(request.user.id),
            ):
                if not workflow_manager.run_transition_hooks(
                    issue,
                    new_state_id,
                    workflow_state_id=workflow_state.id,
                    workflow_type=WorkflowStateType.APPROVAL,
                    approval_type=action_type,
                ):
                    return Response(
                        {"error": "Pre-validation hook blocked this transition"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            issue.state_id = new_state_id
            issue.save()

            activity_type = (
                "issue.activity.workflow_approved" if action_type == "approve" else "issue.activity.workflow_rejected"
            )
            issue_activity.delay(
                type=activity_type,
                requested_data=json.dumps({"state_id": str(new_state_id)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"state_id": str(new_state_id)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            model_activity.delay(
                model_name="issue",
                model_id=str(work_item_id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

        return Response(
            {"state_id": str(new_state_id)},
            status=status.HTTP_200_OK,
        )
