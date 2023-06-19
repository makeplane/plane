# Python imports
from itertools import groupby

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception


# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import StateSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import State, Issue


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

    def create(self, request, slug, project_id):
        try:
            serializer = StateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "State with the name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def list(self, request, slug, project_id):
        try:
            state_dict = dict()
            states = StateSerializer(self.get_queryset(), many=True).data

            for key, value in groupby(
                sorted(states, key=lambda state: state["group"]),
                lambda state: state.get("group"),
            ):
                state_dict[str(key)] = list(value)

            return Response(state_dict, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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

            # Check for any issues in the state
            issue_exist = Issue.issue_objects.filter(state=pk).exists()

            if issue_exist:
                return Response(
                    {
                        "error": "The state is not empty, only empty states can be deleted"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            state.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except State.DoesNotExist:
            return Response({"error": "State does not exists"}, status=status.HTTP_404)
