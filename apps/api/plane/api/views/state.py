# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import StateSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, State
from .base import BaseAPIView
from plane.utils.openapi import (
    state_docs,
    STATE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    STATE_CREATE_EXAMPLE,
    STATE_UPDATE_EXAMPLE,
    # Response Examples
    STATE_EXAMPLE,
    INVALID_REQUEST_RESPONSE,
    STATE_NAME_EXISTS_RESPONSE,
    DELETED_RESPONSE,
    STATE_CANNOT_DELETE_RESPONSE,
    EXTERNAL_ID_EXISTS_RESPONSE,
)


class StateListCreateAPIEndpoint(BaseAPIView):
    """State List and Create Endpoint"""

    serializer_class = StateSerializer
    model = State
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            State.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(is_triage=False)
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    @state_docs(
        operation_id="create_state",
        summary="Create state",
        description="Create a new workflow state for a project with specified name, color, and group.",
        request=OpenApiRequest(
            request=StateSerializer,
            examples=[STATE_CREATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="State created",
                response=StateSerializer,
                examples=[STATE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            409: STATE_NAME_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create state

        Create a new workflow state for a project with specified name, color, and group.
        Supports external ID tracking for integration purposes.
        """
        try:
            serializer = StateSerializer(data=request.data, context={"project_id": project_id})
            if serializer.is_valid():
                if (
                    request.data.get("external_id")
                    and request.data.get("external_source")
                    and State.objects.filter(
                        project_id=project_id,
                        workspace__slug=slug,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    ).exists()
                ):
                    state = State.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        external_id=request.data.get("external_id"),
                        external_source=request.data.get("external_source"),
                    ).first()
                    return Response(
                        {
                            "error": "State with the same external id and external source already exists",
                            "id": str(state.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            state = State.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                name=request.data.get("name"),
            ).first()
            return Response(
                {
                    "error": "State with the same name already exists in the project",
                    "id": str(state.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

    @state_docs(
        operation_id="list_states",
        summary="List states",
        description="Retrieve all workflow states for a project.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                StateSerializer,
                "PaginatedStateResponse",
                "Paginated list of states",
                "Paginated States",
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List states

        Retrieve all workflow states for a project.
        Returns paginated results when listing all states.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda states: StateSerializer(states, many=True, fields=self.fields, expand=self.expand).data,
        )


class StateDetailAPIEndpoint(BaseAPIView):
    """State Detail Endpoint"""

    serializer_class = StateSerializer
    model = State
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            State.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(is_triage=False)
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    @state_docs(
        operation_id="retrieve_state",
        summary="Retrieve state",
        description="Retrieve details of a specific state.",
        parameters=[
            STATE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="State retrieved",
                response=StateSerializer,
                examples=[STATE_EXAMPLE],
            ),
        },
    )
    def get(self, request, slug, project_id, state_id):
        """Retrieve state

        Retrieve details of a specific state.
        Returns paginated results when listing all states.
        """
        serializer = StateSerializer(
            self.get_queryset().get(pk=state_id),
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @state_docs(
        operation_id="delete_state",
        summary="Delete state",
        description="Permanently remove a workflow state from a project. Default states and states with existing work items cannot be deleted.",  # noqa: E501
        parameters=[
            STATE_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            400: STATE_CANNOT_DELETE_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, state_id):
        """Delete state

        Permanently remove a workflow state from a project.
        Default states and states with existing work items cannot be deleted.
        """
        state = State.objects.get(is_triage=False, pk=state_id, project_id=project_id, workspace__slug=slug)

        if state.default:
            return Response(
                {"error": "Default state cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues in the state
        issue_exist = Issue.objects.filter(state=state_id).exists()

        if issue_exist:
            return Response(
                {"error": "The state is not empty, only empty states can be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @state_docs(
        operation_id="update_state",
        summary="Update state",
        description="Partially update an existing workflow state's properties like name, color, or group.",
        parameters=[
            STATE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=StateSerializer,
            examples=[STATE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="State updated",
                response=StateSerializer,
                examples=[STATE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, state_id):
        """Update state

        Partially update an existing workflow state's properties like name, color, or group.
        Validates external ID uniqueness if provided.
        """
        state = State.objects.get(workspace__slug=slug, project_id=project_id, pk=state_id)
        serializer = StateSerializer(state, data=request.data, partial=True)
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (state.external_id != str(request.data.get("external_id")))
                and State.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source", state.external_source),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "State with the same external id and external source already exists",
                        "id": str(state.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
