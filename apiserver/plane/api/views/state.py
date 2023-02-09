# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from . import BaseViewSet
from plane.api.serializers import StateSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import State


class StateViewSet(BaseViewSet):
    serializer_class = StateSerializer
    model = State
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    def destroy(self, request, slug, project_id, pk):
        try:
            state = State.objects.get(
                pk=pk, project_id=project_id, workspace__slug=slug
            )

            if state.default:
                return Response(
                    {"error": "Default state cannot be deleted"}, status=False
                )

            state.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except State.DoesNotExist:
            return Response({"error": "State does not exists"}, status=status.HTTP_404)
