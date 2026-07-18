# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from collections import defaultdict

# Django imports
from django.db import transaction

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import State, StateTransition


class StateTransitionEndpoint(BaseAPIView):
    """Project workflow: allowed transitions between states.

    A state with no outgoing transitions allows moving to every state; a state
    with one or more rows allows only the listed targets.
    """

    @staticmethod
    def _transition_map(slug, project_id):
        transitions = StateTransition.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).values_list("from_state_id", "to_state_id")

        transition_map = defaultdict(list)
        for from_state_id, to_state_id in transitions:
            transition_map[str(from_state_id)].append(str(to_state_id))
        return transition_map

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        return Response(self._transition_map(slug, project_id), status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def put(self, request, slug, project_id):
        payload = request.data.get("transitions")
        if not isinstance(payload, dict):
            return Response(
                {"error": "transitions must be an object of {from_state_id: [to_state_ids]}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_state_ids = {
            str(state_id)
            for state_id in State.all_state_objects.filter(project_id=project_id).values_list("id", flat=True)
        }

        # Validate the whole payload before touching the database
        for from_state_id, to_state_ids in payload.items():
            if not isinstance(to_state_ids, list):
                return Response(
                    {"error": f"Targets for state {from_state_id} must be a list"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if str(from_state_id) not in project_state_ids:
                return Response(
                    {"error": f"State {from_state_id} does not belong to this project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for to_state_id in to_state_ids:
                if str(to_state_id) not in project_state_ids:
                    return Response(
                        {"error": f"State {to_state_id} does not belong to this project"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if str(to_state_id) == str(from_state_id):
                    return Response(
                        {"error": "A state cannot transition to itself"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        workspace_id = (
            State.all_state_objects.filter(project_id=project_id).values_list("workspace_id", flat=True).first()
        )

        with transaction.atomic():
            # Bulk-replace semantics per submitted from_state key:
            # omitted keys stay untouched, [] clears (back to allow-all).
            StateTransition.objects.filter(
                project_id=project_id, from_state_id__in=list(payload.keys())
            ).delete(soft=False)
            StateTransition.objects.bulk_create(
                [
                    StateTransition(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        from_state_id=from_state_id,
                        to_state_id=to_state_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for from_state_id, to_state_ids in payload.items()
                    for to_state_id in dict.fromkeys(to_state_ids)
                ]
            )

        return Response(self._transition_map(slug, project_id), status=status.HTTP_200_OK)
