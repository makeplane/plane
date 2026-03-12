# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from itertools import groupby
from collections import defaultdict

# Django imports
from django.db.utils import IntegrityError

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import StateSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import State, Issue
from plane.utils.cache import invalidate_cache
from plane.utils.instance_admin import is_instance_admin


class StateViewSet(BaseViewSet):
    serializer_class = StateSerializer
    model = State

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(is_triage=False)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        try:
            data = request.data.copy()
            # Strip is_system from non-instance-admins; only instance admins can create system states
            if not is_instance_admin(request.user):
                data.pop("is_system", None)
            serializer = StateSerializer(data=data)
            if serializer.is_valid():
                serializer.save(project_id=project_id)
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
            state = State.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)
            # Allow sequence-only patches (drag reorder) for any admin;
            # block other field mutations on system states for non-instance-admins
            is_sequence_only = set(request.data.keys()) <= {"sequence"}
            if state.is_system and not is_sequence_only and not is_instance_admin(request.user):
                return Response(
                    {"error": "Only instance admins can modify system states."},
                    status=status.HTTP_403_FORBIDDEN,
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
        state = State.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)
        if state.is_system and not is_instance_admin(request.user):
            return Response(
                {"error": "Only instance admins can mark a system state as default."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Unmark current default then mark the target state
        State.objects.filter(workspace__slug=slug, project_id=project_id, default=True).update(default=False)
        State.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk).update(default=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        state = State.objects.get(is_triage=False, pk=pk, project_id=project_id, workspace__slug=slug)

        if state.is_system and not is_instance_admin(request.user):
            return Response(
                {"error": "Only instance admins can delete system states."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if state.default:
            return Response(
                {"error": "Default state cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues in the state
        issue_exist = Issue.objects.filter(state=pk).exists()

        if issue_exist:
            return Response(
                {"error": "The state is not empty, only empty states can be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IntakeStateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        state = State.triage_objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not state:
            return Response(
                {"error": "Triage state not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(StateSerializer(state).data, status=status.HTTP_200_OK)
