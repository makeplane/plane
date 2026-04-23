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

from django.db import transaction
from django.db.models import Q, OuterRef
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Subquery, UUIDField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from plane.api.views.base import ScopedBaseAPIView
from plane.permissions import can, WorkflowPermissions
from plane.utils.openapi import (
    workflow_docs,
    workflow_detail_docs,
    workflow_state_docs,
    workflow_state_detail_docs,
    workflow_transition_docs,
    workflow_transition_detail_docs,
    workflow_approval_docs,
    workflow_activity_docs,
    DELETED_RESPONSE,
    WORKFLOW_EXAMPLE,
    WORKFLOW_STATE_EXAMPLE,
    WORKFLOW_TRANSITION_EXAMPLE,
    WORKFLOW_ACTIVITY_EXAMPLE,
    WORKFLOW_APPROVAL_RESPONSE_EXAMPLE,
    WORKFLOW_CREATE_EXAMPLE,
    WORKFLOW_UPDATE_EXAMPLE,
    WORKFLOW_ADD_STATES_EXAMPLE,
    WORKFLOW_STATE_UPDATE_EXAMPLE,
    WORKFLOW_TRANSFER_STATE_EXAMPLE,
    WORKFLOW_TRANSITION_CREATE_EXAMPLE,
    WORKFLOW_TRANSITION_UPDATE_EXAMPLE,
    WORKFLOW_APPROVAL_REQUEST_EXAMPLE,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag, check_feature_flag
from plane.db.models import Workspace, Issue, State
from plane.app.serializers.issue import IssueSerializer
from plane.ee.models import (
    Workflow,
    WorkflowState,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowTransitionApprover,
    WorkflowTransitionHook,
    WorkflowWorkItemType,
    ProjectFeature,
)

from plane.api.serializers.workflow import (
    WorkflowAPISerializer,
    WorkflowStateAPISerializer,
    WorkflowTransitionAPISerializer,
    WorkflowTransitionActivityAPISerializer,
)
from plane.ee.models import WorkflowTransitionActivity
from plane.ee.bgtasks.workflow_activity_task import workflow_activity
from plane.ee.utils.state_order_helper import get_top_state
from plane.ee.views.app.workflow.base import (
    _base_issues_outside_workflow,
)
from plane.ee.utils.workflow import WorkflowStateManager
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity
from plane.utils.host import base_host
from plane.utils.oauth import READ_SCOPE, WRITE_SCOPE, PROJECTS_WORKFLOWS_READ_SCOPE, PROJECTS_WORKFLOWS_WRITE_SCOPE


class WorkflowListCreateAPIEndpoint(ScopedBaseAPIView):
    """List and create workflows for a project."""

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORKFLOWS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    def _get_queryset(self, slug, project_id):
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

    @workflow_docs(
        operation_id="list_workflows",
        summary="List workflows",
        description="List all workflows for a project.",
        responses={
            200: OpenApiResponse(
                description="List of workflows",
                response=WorkflowAPISerializer(many=True),
                examples=[WORKFLOW_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id):
        workflows = self._get_queryset(slug, project_id)
        data = WorkflowAPISerializer(workflows, many=True).data
        return Response(data, status=status.HTTP_200_OK)

    @workflow_docs(
        operation_id="create_workflow",
        summary="Create a workflow",
        description="Create a new workflow for a project. Requires the Multiple Workflows feature flag.",
        request=OpenApiRequest(request=WorkflowAPISerializer, examples=[WORKFLOW_CREATE_EXAMPLE]),
        responses={
            201: OpenApiResponse(
                description="Workflow created",
                response=WorkflowAPISerializer,
                examples=[WORKFLOW_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @can(WorkflowPermissions.CREATE, resource_param="project_id")
    def post(self, request, slug, project_id):
        # check if the workflow is enabled for the project
        if not ProjectFeature.objects.filter(project_id=project_id, is_workflow_enabled=True).exists():
            return Response(
                {"error": "Workflows feature is not enabled for this project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WorkflowAPISerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
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
            workflow = self._get_queryset(slug, project_id).filter(id=serializer.data["id"]).first()
            data = WorkflowAPISerializer(workflow).data
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkflowDetailAPIEndpoint(ScopedBaseAPIView):
    """Retrieve, update, and delete a workflow."""

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORKFLOWS_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    def _get_queryset(self, slug, project_id):
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

    @workflow_detail_docs(
        operation_id="retrieve_workflow",
        summary="Retrieve a workflow",
        description="Retrieve details of a specific workflow.",
        responses={
            200: OpenApiResponse(
                description="Workflow",
                response=WorkflowAPISerializer,
                examples=[WORKFLOW_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id, pk):
        workflow = self._get_queryset(slug, project_id).filter(id=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)
        data = WorkflowAPISerializer(workflow).data
        return Response(data, status=status.HTTP_200_OK)

    @workflow_detail_docs(
        operation_id="update_workflow",
        summary="Update a workflow",
        description="Partially update a workflow's name, description, active status, or work item type associations.",
        request=OpenApiRequest(request=WorkflowAPISerializer, examples=[WORKFLOW_UPDATE_EXAMPLE]),
        responses={
            200: OpenApiResponse(
                description="Updated workflow",
                response=WorkflowAPISerializer,
                examples=[WORKFLOW_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def patch(self, request, slug, project_id, pk):
        workflow = self._get_queryset(slug, project_id).filter(id=pk).first()
        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

        if not workflow.is_default and not check_workspace_feature_flag(
            feature_key=FeatureFlag.MULTIPLE_WORKFLOWS,
            slug=slug,
            user_id=str(request.user.id),
        ):
            return Response(
                {"error": "Only default workflow can be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_instance = json.dumps(WorkflowAPISerializer(workflow).data, cls=DjangoJSONEncoder)
        patch_data = dict(request.data)

        if patch_data.get("is_active", False) is True:
            if not WorkflowState.objects.filter(workflow_id=workflow.id).exists():
                return Response(
                    {"error": "At least one state is required to activate the workflow"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not WorkflowWorkItemType.objects.filter(workflow_id=workflow.id).exists():
                return Response(
                    {"error": "At least one work item type is required to activate the workflow"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            issues_outside = list(
                _base_issues_outside_workflow(str(workflow.id), project_id, slug).values("id", "state_id")
            )
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
                patch_data["is_active"] = False
            elif workflow.is_active:
                existing_ids = set(
                    WorkflowWorkItemType.objects.filter(workflow_id=workflow.id).values_list(
                        "work_item_type_id", flat=True
                    )
                )
                if incoming_ids - existing_ids:
                    patch_data["is_active"] = False

        serializer = WorkflowAPISerializer(workflow, data=patch_data, partial=True)
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
            updated_workflow = self._get_queryset(slug, project_id).filter(id=pk).first()
            data = WorkflowAPISerializer(updated_workflow).data
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @workflow_detail_docs(
        operation_id="delete_workflow",
        summary="Delete a workflow",
        description="Delete a workflow. The default workflow cannot be deleted.",
        responses={204: DELETED_RESPONSE},
    )
    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @can(WorkflowPermissions.DELETE, resource_param="project_id")
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


class WorkflowStatesAPIEndpoint(ScopedBaseAPIView):
    """List, add, update, and remove states from a workflow."""

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORKFLOWS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    @workflow_state_docs(
        operation_id="list_workflow_states",
        summary="List workflow states",
        description="List all states belonging to a workflow.",
        responses={
            200: OpenApiResponse(
                description="List of workflow states",
                response=WorkflowStateAPISerializer(many=True),
                examples=[WORKFLOW_STATE_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id, workflow_id):
        workflow_states = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, workspace__slug=slug
        )
        return Response(WorkflowStateAPISerializer(workflow_states, many=True).data, status=status.HTTP_200_OK)

    @workflow_state_docs(
        operation_id="add_workflow_states",
        summary="Add states to a workflow",
        description="Add one or more project states to a workflow.",
        request=OpenApiRequest(
            request=inline_serializer(
                name="WorkflowAddStatesRequest",
                fields={"state_ids": drf_serializers.ListField(child=drf_serializers.UUIDField())},
            ),
            examples=[WORKFLOW_ADD_STATES_EXAMPLE],
        ),
        responses={201: OpenApiResponse(description="States added successfully")},
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, workflow_id):
        state_ids = request.data.get("state_ids", [])
        if not state_ids:
            return Response({"error": "State ids are required"}, status=status.HTTP_400_BAD_REQUEST)

        # check all the states are present in the project
        state_ids = State.objects.filter(id__in=state_ids, project_id=project_id).values_list("id", flat=True)

        existing_workflow_states = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id__in=state_ids
        ).values_list("state_id", flat=True)
        new_state_ids = set(state_ids) - set(existing_workflow_states)

        workspace = Workspace.objects.get(slug=slug)
        all_current_state_ids = list(
            str(sid)
            for sid in WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id).values_list(
                "state_id", flat=True
            )
        )

        WorkflowState.objects.bulk_create(
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

    @workflow_state_detail_docs(
        operation_id="update_workflow_state",
        summary="Update a workflow state",
        description="Update the type or allow_issue_creation flag of a state within a workflow.",
        request=OpenApiRequest(request=WorkflowStateAPISerializer, examples=[WORKFLOW_STATE_UPDATE_EXAMPLE]),
        responses={
            200: OpenApiResponse(
                description="Updated workflow state",
                response=WorkflowStateAPISerializer,
                examples=[WORKFLOW_STATE_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
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
        if state_type and workflow_state.type != state_type:
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
            workflow_state.type = state_type
            workflow_state.save()
            workflow_activity.delay(
                workflow_id=str(workflow_id),
                type="workflow_state.activity.updated",
                requested_data=json.dumps(
                    {"type": state_type, "state_id": str(state_id)},
                    cls=DjangoJSONEncoder,
                ),
                actor_id=str(request.user.id),
                workflow_state_id=str(workflow_state.id),
                project_id=str(project_id),
                current_instance=current_instance,
                slug=slug,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(WorkflowStateAPISerializer(workflow_state).data, status=status.HTTP_200_OK)

        serializer = WorkflowStateAPISerializer(workflow_state, data=request.data, partial=True)
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

    @workflow_state_detail_docs(
        operation_id="remove_workflow_state",
        summary="Remove a state from a workflow",
        description="Remove a state from a workflow. This also deletes all transitions associated with the state.",
        responses={204: DELETED_RESPONSE},
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def delete(self, request, slug, project_id, workflow_id, state_id):
        workflow_state = (
            WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id, state_id=state_id)
            .select_related("workflow")
            .first()
        )
        if not workflow_state:
            return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        if workflow_state.workflow.is_default:
            return Response(
                {"error": "Default workflow states cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_instance = json.dumps(
            {"state_id": str(state_id), "type": workflow_state.type},
            cls=DjangoJSONEncoder,
        )
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
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowStateTransitionsAPIEndpoint(ScopedBaseAPIView):
    """Create, update, and delete transitions between workflow states."""

    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    def _validate_transition_state_ids(self, slug, project_id, transition_state_id, rejection_state_id):
        """Return a 400 Response if either state ID does not belong to this project/workspace, else None."""
        valid_ids = set(State.objects.filter(project_id=project_id, workspace__slug=slug).values_list("id", flat=True))
        if transition_state_id and uuid.UUID(str(transition_state_id)) not in valid_ids:
            return Response(
                {"error": "transition_state_id does not belong to this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if rejection_state_id and uuid.UUID(str(rejection_state_id)) not in valid_ids:
            return Response(
                {"error": "rejection_state_id does not belong to this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def _get_annotated_transition(self, transition_id):
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

    @workflow_transition_docs(
        operation_id="create_workflow_transition",
        summary="Create a workflow transition",
        description="Create a transition between two workflow states. Approval states are limited to one transition.",
        request=OpenApiRequest(
            request=WorkflowTransitionAPISerializer,
            examples=[WORKFLOW_TRANSITION_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Workflow transition created",
                response=WorkflowTransitionAPISerializer,
                examples=[WORKFLOW_TRANSITION_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, workflow_id):
        state_id = request.data.pop("state_id")
        member_ids = request.data.pop("member_ids", [])
        transition_state_id = request.data.get("transition_state_id")
        rejection_state_id = request.data.get("rejection_state_id")

        workflow_state = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=state_id
        ).first()
        if not workflow_state:
            return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        if workflow_state.type == WorkflowStateType.APPROVAL and not check_workspace_feature_flag(
            slug=slug,
            feature_key=FeatureFlag.MULTIPLE_WORKFLOWS,
            user_id=request.user.id,
        ):
            return Response(
                {"error": "You are not allowed to create an approval transition."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            workflow_state.type == WorkflowStateType.APPROVAL
            and WorkflowTransition.objects.filter(
                workflow_state_id=workflow_state.id,
                project_id=project_id,
            ).exists()
        ):
            return Response(
                {"error": "An approval state can only have one transition."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if WorkflowTransition.objects.filter(
            project_id=project_id,
            workflow_state__workflow_id=workflow_id,
            workflow_state__state_id=state_id,
            transition_state_id=transition_state_id,
        ).exists():
            return Response({"error": "Workflow transition already exists"}, status=status.HTTP_400_BAD_REQUEST)

        error = self._validate_transition_state_ids(slug, project_id, transition_state_id, rejection_state_id)
        if error:
            return error

        serializer = WorkflowTransitionAPISerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(project_id=project_id, workflow_state_id=workflow_state.id)

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
            requested_data=json.dumps({"added_approver_ids": member_ids or [], "removed_approver_ids": []}),
            actor_id=str(request.user.id),
            workflow_state_id=str(workflow_state.id),
            project_id=str(project_id),
            current_instance=None,
            slug=slug,
            epoch=int(timezone.now().timestamp()),
        )
        transition = self._get_annotated_transition(serializer.data["id"])
        return Response(WorkflowTransitionAPISerializer(transition).data, status=status.HTTP_201_CREATED)

    @workflow_transition_detail_docs(
        operation_id="update_workflow_transition",
        summary="Update a workflow transition",
        description="Update a workflow transition's target state, rejection state, or approver members.",
        request=OpenApiRequest(
            request=WorkflowTransitionAPISerializer,
            examples=[WORKFLOW_TRANSITION_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Updated workflow transition",
                response=WorkflowTransitionAPISerializer,
                examples=[WORKFLOW_TRANSITION_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def patch(self, request, slug, project_id, workflow_id, transition_id):
        transition_state_id = request.data.get("transition_state_id")
        rejection_state_id = request.data.get("rejection_state_id")

        workflow_transition = (
            WorkflowTransition.objects.filter(id=transition_id, project_id=project_id, workspace__slug=slug)
            .select_related("workflow_state")
            .first()
        )
        if not workflow_transition:
            return Response({"error": "Workflow transition not found"}, status=status.HTTP_404_NOT_FOUND)

        error = self._validate_transition_state_ids(slug, project_id, transition_state_id, rejection_state_id)
        if error:
            return error

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

        serializer = WorkflowTransitionAPISerializer(workflow_transition, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

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
            removed_approver_ids = list(set(existing_approver_ids) - set(requested_approver_ids))
            added_approver_ids = list(set(requested_approver_ids) - set(existing_approver_ids))

            WorkflowTransitionApprover.objects.filter(
                workflow_transition_id=transition_id,
                workflow_state__workflow_id=workflow_id,
                project_id=project_id,
                workspace__slug=slug,
                approver_id__in=removed_approver_ids,
            ).delete()
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
        return Response(WorkflowTransitionAPISerializer(transition).data, status=status.HTTP_200_OK)

    @workflow_transition_detail_docs(
        operation_id="delete_workflow_transition",
        summary="Delete a workflow transition",
        description="Delete a workflow transition.",
        responses={204: DELETED_RESPONSE},
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
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


class WorkflowStateTransferAPIEndpoint(ScopedBaseAPIView):
    """Transfer issues from one workflow state to another and remove the source state."""

    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    @workflow_state_detail_docs(
        operation_id="transfer_workflow_state",
        summary="Transfer and remove a workflow state",
        description="Move all work items from a state to another state and remove the source state from the workflow.",
        request=OpenApiRequest(
            request=inline_serializer(
                name="WorkflowTransferStateRequest",
                fields={"new_state_id": drf_serializers.UUIDField()},
            ),
            examples=[WORKFLOW_TRANSFER_STATE_EXAMPLE],
        ),
        responses={200: OpenApiResponse(description="State transferred and removed successfully")},
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, workflow_id, state_id):
        new_state_id = request.data.get("new_state_id")
        if not new_state_id:
            return Response({"error": "new_state_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        old_workflow_state = WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=state_id
        ).first()
        if not old_workflow_state:
            return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        if not WorkflowState.objects.filter(
            project_id=project_id, workflow_id=workflow_id, state_id=new_state_id
        ).exists():
            return Response({"error": "Target workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

        if str(state_id) == str(new_state_id):
            return Response(
                {"error": "new_state_id must be different from the current state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not State.objects.filter(id=new_state_id, project_id=project_id, workspace__slug=slug).exists():
            return Response({"error": "Target state not found in this project"}, status=status.HTTP_404_NOT_FOUND)

        transitions_qs = WorkflowTransition.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            workflow_state__workflow_id=workflow_id,
        )
        if transitions_qs.filter(Q(transition_state_id=state_id) | Q(rejection_state_id=state_id)).exists():
            return Response(
                {"error": "The state is referenced as a transition or rejection in one or more workflow transitions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        WorkflowState.objects.filter(project_id=project_id, workflow_id=workflow_id, state_id=state_id).delete()

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


class WorkflowWorkItemApproverAPIEndpoint(ScopedBaseAPIView):
    """Approve or reject a work item in an approval workflow state."""

    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [PROJECTS_WORKFLOWS_WRITE_SCOPE]],
    }

    @workflow_approval_docs(
        operation_id="approve_or_reject_work_item",
        summary="Approve or reject a work item",
        description="Approve or reject a work item that is currently in an approval workflow state.",
        request=OpenApiRequest(
            request=inline_serializer(
                name="WorkflowApprovalRequest",
                fields={"type": drf_serializers.ChoiceField(choices=["approve", "reject"])},
            ),
            examples=[WORKFLOW_APPROVAL_REQUEST_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="New state after approval or rejection",
                response=inline_serializer(
                    name="WorkflowApprovalResponse",
                    fields={"state_id": drf_serializers.UUIDField()},
                ),
                examples=[WORKFLOW_APPROVAL_RESPONSE_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.MULTIPLE_WORKFLOWS)
    @can(WorkflowPermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, work_item_id):
        action_type = request.data.get("type", None)
        if action_type not in ["approve", "reject"]:
            return Response({"error": "Type must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

        issue = Issue.objects.filter(id=work_item_id, project_id=project_id, workspace__slug=slug).first()
        if not issue:
            return Response({"error": "Work item not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow = None
        if issue.type_id:
            workflow_work_item_type = (
                WorkflowWorkItemType.objects.filter(
                    project_id=project_id, workspace__slug=slug, work_item_type_id=issue.type_id
                )
                .only("workflow_id")
                .first()
            )
            if workflow_work_item_type:
                workflow = Workflow.objects.filter(id=workflow_work_item_type.workflow_id).first()

        if not workflow:
            workflow = Workflow.objects.filter(project_id=project_id, workspace__slug=slug, is_default=True).first()

        if not workflow:
            return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow_state = WorkflowState.objects.filter(
            workflow_id=workflow.id,
            project_id=project_id,
            workspace__slug=slug,
            state_id=issue.state_id,
        ).first()
        if not workflow_state or workflow_state.type != WorkflowStateType.APPROVAL:
            return Response({"error": "Work item is not in an approval state"}, status=status.HTTP_400_BAD_REQUEST)

        workflow_transition = WorkflowTransition.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).first()
        if not workflow_transition:
            return Response({"error": "Workflow transition not found"}, status=status.HTTP_404_NOT_FOUND)

        approvers = WorkflowTransitionApprover.objects.filter(
            workflow_state_id=workflow_state.id,
            project_id=project_id,
            workspace__slug=slug,
        ).values_list("approver_id", flat=True)

        if not approvers:
            return Response(
                {"error": "No approvers found for this workflow state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.id not in approvers:
            return Response(
                {"error": "You are not an approver for this workflow state"},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_state_id = (
            workflow_transition.transition_state_id
            if action_type == "approve"
            else workflow_transition.rejection_state_id
        )
        current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)

        with transaction.atomic():
            if check_workspace_feature_flag(
                feature_key=FeatureFlag.WORKFLOW_CONDITIONS,
                slug=slug,
                user_id=str(request.user.id),
            ):
                workflow_manager = WorkflowStateManager(project_id=project_id, slug=slug)
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
            model_activity.delay(
                model_name="issue",
                model_id=str(work_item_id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

        return Response({"state_id": str(new_state_id)}, status=status.HTTP_200_OK)


class WorkflowActivityAPIEndpoint(ScopedBaseAPIView):
    """List workflow transition activities."""

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORKFLOWS_READ_SCOPE]],
    }

    @workflow_activity_docs(
        operation_id="list_workflow_activities",
        summary="List workflow activities",
        description="List all transition activities for a workflow, optionally filtered by creation timestamp.",
        responses={
            200: OpenApiResponse(
                description="List of workflow activities",
                response=WorkflowTransitionActivityAPISerializer(many=True),
                examples=[WORKFLOW_ACTIVITY_EXAMPLE],
            ),
        },
    )
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @can(WorkflowPermissions.VIEW, resource_param="project_id")
    def get(self, request, slug, project_id, workflow_id):
        filters = {}
        if request.GET.get("created_at__gt"):
            filters["created_at__gt"] = request.GET.get("created_at__gt")

        activities = (
            WorkflowTransitionActivity.objects.filter(
                workspace__slug=slug, project_id=project_id, workflow_id=workflow_id
            )
            .filter(**filters)
            .select_related("actor", "workspace", "project")
            .order_by("created_at")
        )
        return Response(WorkflowTransitionActivityAPISerializer(activities, many=True).data, status=status.HTTP_200_OK)
