# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import StateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import State
from plane.app.permissions import WorkspaceEntityPermission
from plane.utils.cache import cache_response
from collections import defaultdict


class WorkspaceStatesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        states = State.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            is_triage=False,
        )

        grouped_states = defaultdict(list)
        for state in states:
            grouped_states[state.group].append(state)

        for group, group_states in grouped_states.items():
            count = len(group_states)

            for index, state in enumerate(group_states, start=1):
                state.order = index / count

        serializer = StateSerializer(states, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)
