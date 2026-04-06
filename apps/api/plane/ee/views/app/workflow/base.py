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

import uuid
import json
from collections import defaultdict

# Django imports
from django.db.models import Exists, OuterRef, Q, prefetch_related_objects
from django.utils import timezone
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.utils.host import base_host
from plane.ee.utils.state_order_helper import get_top_state
from plane.db.models import Workspace, Issue, State
from plane.ee.views.base import BaseAPIView
from plane.ee.models import (
    Workflow,
    WorkflowState,
    WorkflowTransition,
    WorkflowTransitionHook,
    WorkflowTransitionHookPhase,
    WorkflowWorkItemType,
    WorkflowTransitionApprover,
)
from plane.ee.serializers import WorkflowSerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.workflow_activity_task import workflow_activity
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag
from plane.bgtasks.issue_activities_task import issue_activity


def _issues_outside_workflow_qs(workflow_ref, project_id, slug):
    """
    Core queryset: issues whose type is in the workflow but whose state is not.
    workflow_ref can be a concrete id (UUID/str) or an OuterRef expression.
    """
    return Issue.objects.filter(
        project_id=project_id,
        workspace__slug=slug,
        type_id__in=WorkflowWorkItemType.objects.filter(
            workflow_id=workflow_ref, project_id=project_id, workspace__slug=slug
        ).values("work_item_type_id"),
    ).exclude(
        state_id__in=WorkflowState.objects.filter(
            workflow_id=workflow_ref, project_id=project_id, workspace__slug=slug
        ).values("state_id")
    )


def _base_issues_outside_workflow(workflow_id, project_id, slug):
    return _issues_outside_workflow_qs(workflow_id, project_id, slug)


def get_issue_ids_outside_workflow(workflow_id, project_id, slug):
    """Return distinct issue IDs whose state is not part of the workflow."""
    return _base_issues_outside_workflow(workflow_id, project_id, slug).values_list("id", flat=True).distinct()


def get_state_ids_outside_workflow(workflow_id, project_id, slug):
    """Return distinct state IDs not part of the workflow that have issues assigned."""
    return (
        _base_issues_outside_workflow(workflow_id, project_id, slug)
        .order_by("state_id")
        .values_list("state_id", flat=True)
        .distinct()
    )


def get_missing_states_map(workflow_ids, project_id, slug):
    """
    Return a dict of {workflow_id_str: bool} indicating whether each workflow has
    issues outside its allowed states. Executes a single query.
    """
    rows = (
        Workflow.objects.filter(id__in=workflow_ids, project_id=project_id, workspace__slug=slug)
        .annotate(has_missing=Exists(_issues_outside_workflow_qs(OuterRef(OuterRef("id")), project_id, slug)))
        .values("id", "has_missing")
    )
    return {str(row["id"]): row["has_missing"] for row in rows}


class WorkspaceWorkflowEndpoint(BaseAPIView):
    """
    Endpoint to get the project workflow
    """

    use_read_replica = True

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        filter_condition = Q(workspace__slug=slug)

        # Fetch all data upfront in 4 queries
        workflows = Workflow.objects.filter(filter_condition).values(
            "id",
            "name",
            "description",
            "is_default",
            "is_active",
            "workspace_id",
            "project_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )

        workflow_states_qs = list(
            WorkflowState.objects.filter(filter_condition).values(
                "id", "state_id", "allow_issue_creation", "workflow_id", "type"
            )
        )

        work_item_types_qs = list(
            WorkflowWorkItemType.objects.filter(filter_condition).values("workflow_id", "work_item_type_id")
        )

        workflow_transitions_qs = list(
            WorkflowTransition.objects.filter(filter_condition).values(
                "id",
                "transition_state_id",
                "workflow_state_id",
                "rejection_state_id",
            )
        )
        workflow_transition_rules_qs = list(
            WorkflowTransitionHook.objects.filter(
                workspace__slug=slug,
                is_enabled=True,
                deleted_at__isnull=True,
            )
            .order_by("workflow_transition_id", "phase", "execution_order", "created_at")
            .values("workflow_transition_id", "phase", "handler_name", "hook_type", "config")
        )
        workflow_transition_approvers_qs = list(
            WorkflowTransitionApprover.objects.filter(filter_condition).values("workflow_transition_id", "approver_id")
        )

        # Group workflow states by workflow_id and build a reverse lookup
        workflow_states_map = defaultdict(list)
        state_id_to_workflow_id = {}
        for ws in workflow_states_qs:
            wf_id = str(ws["workflow_id"])
            workflow_states_map[wf_id].append(ws)
            state_id_to_workflow_id[ws["id"]] = wf_id

        # Group workflow transitions by workflow_state_id
        workflow_transitions_map = defaultdict(list)
        for wt in workflow_transitions_qs:
            workflow_transitions_map[wt["workflow_state_id"]].append(wt)

        workflow_transition_rules_map = defaultdict(lambda: {"pre_rules": [], "post_rules": []})
        for hook in workflow_transition_rules_qs:
            target_key = "pre_rules" if hook["phase"] == WorkflowTransitionHookPhase.PRE else "post_rules"
            workflow_transition_rules_map[hook["workflow_transition_id"]][target_key].append(
                {
                    "handler_name": hook["handler_name"],
                    "rule_type": hook["hook_type"],
                    "config": hook.get("config") or {},
                }
            )

        # Group work item types by workflow_id
        work_item_types_map = defaultdict(list)
        for wit in work_item_types_qs:
            work_item_types_map[str(wit["workflow_id"])].append(str(wit["work_item_type_id"]))

        workflow_transition_approvers_map = defaultdict(list)
        for wta in workflow_transition_approvers_qs:
            workflow_transition_approvers_map[wta["workflow_transition_id"]].append(str(wta["approver_id"]))

        # Build enriched response from paginated workflows
        def on_results(paginated_workflows):
            response = []
            for workflow in paginated_workflows:
                workflow_id = str(workflow["id"])

                states = []
                for state in workflow_states_map.get(workflow_id, []):
                    id = str(state["state_id"])
                    state_allow_issue_creation = state["allow_issue_creation"]
                    transitions = []
                    # check the type of transition is approval or transition
                    transition_type = state["type"]
                    for transition in workflow_transitions_map.get(state["id"], []):
                        transitions.append(
                            {
                                "id": str(transition["id"]),
                                "transition_state_id": str(transition["transition_state_id"])
                                if transition["transition_state_id"]
                                else None,
                                "rejection_state_id": str(transition["rejection_state_id"])
                                if transition["rejection_state_id"]
                                else None,
                                "member_ids": workflow_transition_approvers_map.get(transition["id"], []),
                                "pre_rules": workflow_transition_rules_map[transition["id"]]["pre_rules"],
                                "post_rules": workflow_transition_rules_map[transition["id"]]["post_rules"],
                            }
                        )
                    states.append(
                        {
                            "id": id,
                            "allow_issue_creation": state_allow_issue_creation,
                            "transitions": transitions,
                            "type": transition_type,
                        }
                    )

                response.append(
                    {
                        "id": workflow_id,
                        "workspace_id": str(workflow["workspace_id"]),
                        "project_id": str(workflow["project_id"]),
                        "name": workflow["name"],
                        "description": workflow["description"],
                        "is_default": workflow["is_default"],
                        "is_active": workflow["is_active"],
                        "work_item_type_ids": work_item_types_map.get(workflow_id, []),
                        "states": states,
                        "created_at": workflow["created_at"],
                        "updated_at": workflow["updated_at"],
                        "created_by": workflow["created_by"],
                        "updated_by": workflow["updated_by"],
                    }
                )
            return response

        return self.paginate(
            request=request,
            queryset=workflows,
            on_results=on_results,
            default_per_page=100,
        )


class WorkflowEndpoint(BaseAPIView):
    use_read_replica = True

    def get_queryset(self, slug, project_id):
        return Workflow.objects.filter(project_id=project_id, workspace__slug=slug).annotate(
            work_item_type_ids=ArrayAgg(
                "workflow_work_item_types__work_item_type_id",
                distinct=True,
                filter=Q(
                    workflow_work_item_types__work_item_type_id__isnull=False,
                    workflow_work_item_types__deleted_at__isnull=True,
                ),
            )
        )

    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        serializer = WorkflowSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            # trigger the workflow activity
            workflow_activity.delay(
                workflow_id=str(serializer.data["id"]),
                type="workflow.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                current_instance=None,
                actor_id=str(request.user.id),
                workflow_state_id=str(serializer.data["id"]),
                project_id=str(project_id),
                slug=slug,
                epoch=int(timezone.now().timestamp()),
            )
            # fetch the workflow
            workflow = self.get_queryset(slug, project_id).filter(id=serializer.data["id"]).first()
            data = WorkflowSerializer(workflow).data
            missing_map = get_missing_states_map([workflow.id], project_id, slug)
            data["missing_states"] = missing_map.get(str(workflow.id), False)
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def get(self, request, slug, project_id, pk=None):
        if pk:
            workflow = self.get_queryset(slug, project_id).filter(id=pk).first()
            if not workflow:
                return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)
            data = WorkflowSerializer(workflow).data
            missing_map = get_missing_states_map([workflow.id], project_id, slug)
            data["missing_states"] = missing_map.get(str(workflow.id), False)
            return Response(data, status=status.HTTP_200_OK)

        workflows = self.get_queryset(slug, project_id)
        data = WorkflowSerializer(workflows, many=True).data
        missing_states_map = get_missing_states_map([wf["id"] for wf in data], project_id, slug)
        for workflow in data:
            workflow["missing_states"] = missing_states_map.get(str(workflow["id"]), False)

        return Response(data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, pk):
        workflow = self.get_queryset(slug, project_id).filter(id=pk).first()
        current_instance = json.dumps(WorkflowSerializer(workflow).data, cls=DjangoJSONEncoder)

        # user cannot update multiple workflow if feature flag is disabled
        if not workflow.is_default and not check_workspace_feature_flag(
            feature_key=FeatureFlag.MULTIPLE_WORKFLOWS,
            slug=slug,
            user_id=str(request.user.id),
        ):
            return Response(
                {"error": "Only default workflow can be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patch_data = dict(request.data)

        if patch_data.get("is_active", False) is True:
            # check if the states are added inside that
            if not WorkflowState.objects.filter(workflow_id=workflow.id).exists():
                return Response(
                    {"error": "At least one state is required to activate the workflow"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # also check if any work item type is present in that
            if not WorkflowWorkItemType.objects.filter(workflow_id=workflow.id).exists():
                return Response(
                    {"error": "At least one work item type is required to activate the workflow"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # get all issues outside the workflow with their current state before updating
            issues_outside = list(
                _base_issues_outside_workflow(str(workflow.id), project_id, slug).values("id", "state_id")
            )

            # update the state of those issues to the first state of the workflow
            if issues_outside:
                first_state = get_top_state(WorkflowState.objects.filter(workflow_id=workflow.id))
                requested_data = json.dumps({"state_id": str(first_state.state_id)}, cls=DjangoJSONEncoder)
                epoch = int(timezone.now().timestamp())
                issue_ids = [issue["id"] for issue in issues_outside]
                Issue.objects.filter(id__in=issue_ids).update(state_id=first_state.state_id)
                for issue in issues_outside:
                    issue_activity.delay(
                        type="issue.activity.updated",
                        requested_data=requested_data,
                        actor_id=str(request.user.id),
                        issue_id=str(issue["id"]),
                        project_id=str(project_id),
                        current_instance=json.dumps({"state_id": str(issue["state_id"])}, cls=DjangoJSONEncoder),
                        epoch=epoch,
                        notification=True,
                        origin=base_host(request=request, is_app=True),
                    )

        if "work_item_type_ids" in patch_data:
            incoming_ids = {uuid.UUID(str(t)) for t in patch_data["work_item_type_ids"]}
            if not incoming_ids:
                # All types removed — deactivate the workflow
                patch_data["is_active"] = False
            elif workflow.is_active:
                existing_ids = set(
                    WorkflowWorkItemType.objects.filter(workflow_id=workflow.id).values_list(
                        "work_item_type_id", flat=True
                    )
                )
                if incoming_ids - existing_ids:
                    patch_data["is_active"] = False

        serializer = WorkflowSerializer(workflow, data=patch_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            workflow_activity.delay(
                workflow_id=str(pk),
                type="workflow.activity.updated",
                requested_data=json.dumps(patch_data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                workflow_state_id=None,
                project_id=str(workflow.project_id),
                slug=slug,
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            # refetch the workflow to get the updated work item types and return the response
            updated_workflow = self.get_queryset(slug, project_id).filter(id=pk).first()
            data = WorkflowSerializer(updated_workflow).data
            missing_map = get_missing_states_map([updated_workflow.id], project_id, slug)
            data["missing_states"] = missing_map.get(str(updated_workflow.id), False)
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, pk):
        workflow = Workflow.objects.get(project_id=project_id, workspace__slug=slug, id=pk)
        if workflow.is_default:
            return Response({"error": "Default workflow cannot be deleted"}, status=status.HTTP_400_BAD_REQUEST)
        current_instance = json.dumps({"name": workflow.name}, cls=DjangoJSONEncoder)
        workflow.delete()
        workflow_activity.delay(
            workflow_id=str(pk),
            type="workflow.activity.deleted",
            requested_data=None,
            actor_id=str(request.user.id),
            workflow_state_id=None,
            project_id=str(project_id),
            current_instance=current_instance,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowWorkItemTypeWorkItemsCheckEndpoint(BaseAPIView):
    """
    Endpoint to check if any work item of the work item type is present in the project which are not part of the
    workflow states when a new work item type is added to the workflow.

    """

    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def get(self, request, slug, project_id, workflow_id):
        state_ids = list(get_state_ids_outside_workflow(workflow_id, project_id, slug))
        return Response({"state_ids": state_ids}, status=status.HTTP_200_OK)


class DefaultWorkflowEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        # check if the default workflow already exists
        workflow = Workflow.objects.filter(project_id=project_id, workspace__slug=slug, is_default=True).first()
        if not workflow:
            workspace = Workspace.objects.get(slug=slug)
            # Create a default Workflow for the project
            workflow = Workflow.objects.create(
                name="Default Workflow",
                description="Default workflow for the project",
                id=uuid.uuid4(),
                project_id=project_id,
                workspace_id=workspace.id,
                is_active=True,
                is_default=True,
            )
            # create the states inside the default workflow
            workflow_states = State.objects.filter(project_id=project_id, workspace_id=workspace.id).values_list(
                "id", flat=True
            )
            # bulk create all the states inside the workflow
            WorkflowState.objects.bulk_create(
                [
                    WorkflowState(
                        workflow_id=workflow.id,
                        state_id=state_id,
                        project_id=project_id,
                        workspace_id=workspace.id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for state_id in workflow_states
                ]
            )
        prefetch_related_objects([workflow], "workflow_states")
        states = [
            {
                "id": str(ws.state_id),
                "allow_issue_creation": ws.allow_issue_creation,
                "type": ws.type,
            }
            for ws in workflow.workflow_states.all()
        ]
        return Response({**WorkflowSerializer(workflow).data, "states": states}, status=status.HTTP_200_OK)
