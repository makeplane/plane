# Python imports
from itertools import groupby

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from plane.api.serializers import StateSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import State, Issue


class StateAPIEndpoint(BaseAPIView):
    serializer_class = StateSerializer
    model = State
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(~Q(name="Triage"))
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    def post(self, request, slug, project_id):
        serializer = StateSerializer(data=request.data, context={"project_id": project_id})
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, project_id, pk=None):
        if pk:
            serializer = StateSerializer(self.get_queryset().get(pk=pk))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda states: StateSerializer(
                states,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def delete(self, request, slug, project_id, pk):
        state = State.objects.get(
            ~Q(name="Triage"),
            pk=pk,
            project_id=project_id,
            workspace__slug=slug,
        )

        if state.default:
            return Response({"error": "Default state cannot be deleted"}, status=False)

        # Check for any issues in the state
        issue_exist = Issue.issue_objects.filter(state=pk).exists()

        if issue_exist:
            return Response(
                {"error": "The state is not empty, only empty states can be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, project_id, pk=None):
        state = State.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk)
        serializer = StateSerializer(state, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)