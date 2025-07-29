# Python imports
import json
from itertools import groupby
from collections import defaultdict

# Django imports
from django.db.utils import IntegrityError

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder


# Module imports
from .. import BaseViewSet
from plane.app.serializers import StateSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import State, Issue
from plane.ee.models import Workflow
from plane.utils.cache import invalidate_cache
from plane.ee.bgtasks.project_activites_task import project_activity
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class StateViewSet(BaseViewSet):
    serializer_class = StateSerializer
    model = State

    def update_workflow_state(self, slug, project_id, state_id):
        """Method to update the default workflow state's issue creation"""
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.WORKFLOWS,
            slug=slug,
            user_id=str(self.request.user.id),
        ):
            workflow = Workflow.objects.filter(
                workspace__slug=slug, project_id=project_id, state_id=state_id
            ).first()
            if workflow:
                workflow.allow_issue_creation = True
                workflow.save()

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .filter(is_triage=False)
            .select_related("project")
            .select_related("workspace")
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .distinct()
        )

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        try:
            serializer = StateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                project_activity.delay(
                    type="project.activity.updated",
                    requested_data=json.dumps(
                        {"project_state": serializer.data.get("id")},
                        cls=DjangoJSONEncoder,
                    ),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    current_instance=json.dumps(
                        {"project_state": None}, cls=DjangoJSONEncoder
                    ),
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The state name is already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def partial_update(self, request, slug, project_id, pk):
        try:
            state = State.objects.get(
                pk=pk, project_id=project_id, workspace__slug=slug
            )
            serializer = StateSerializer(state, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The state name is already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        states = StateSerializer(self.get_queryset(), many=True).data

        grouped_states = defaultdict(list)
        for state in states:
            grouped_states[state["group"]].append(state)

        for group, group_states in grouped_states.items():
            count = len(group_states)

            for index, state in enumerate(group_states, start=1):
                state["order"] = index / count

        grouped = request.GET.get("grouped", False)

        if grouped == "true":
            state_dict = {}
            for key, value in groupby(
                sorted(states, key=lambda state: state["group"]),
                lambda state: state.get("group"),
            ):
                state_dict[str(key)] = list(value)
            return Response(state_dict, status=status.HTTP_200_OK)

        return Response(states, status=status.HTTP_200_OK)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def mark_as_default(self, request, slug, project_id, pk):
        # Select all the states which are marked as default
        _ = State.objects.filter(
            workspace__slug=slug, project_id=project_id, default=True
        ).update(default=False)
        _ = State.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=pk
        ).update(default=True)

        # Call the method to update workflow state
        self.update_workflow_state(slug, project_id, pk)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        state = State.objects.get(
            is_triage=False, pk=pk, project_id=project_id, workspace__slug=slug
        )

        if state.default:
            return Response(
                {"error": "Default state cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues in the state
        issue_exist = Issue.issue_objects.filter(state=pk).exists()

        if issue_exist:
            return Response(
                {"error": "The state is not empty, only empty states can be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"project_state": None}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                {"project_state": pk, "state_name": state.name}, cls=DjangoJSONEncoder
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        state.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
