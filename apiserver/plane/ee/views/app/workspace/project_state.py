# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.db import IntegrityError

# Module imports
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import Workspace
from plane.ee.models import ProjectState, ProjectAttribute
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import ProjectStateSerializer
from plane.app.permissions import WorkSpaceBasePermission

# EE imports
from plane.ee.utils.workspace_feature import (
    WorkspaceFeatureContext,
    check_workspace_feature,
)


class WorkspaceProjectStatesEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    def get(self, request, slug):
        if check_workspace_feature(
            slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
        ):
            project_states = ProjectState.objects.filter(workspace__slug=slug).order_by(
                "sequence"
            )
            serializer = ProjectStateSerializer(project_states, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "Project grouping is not enabled for this workspace"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    def post(self, request, slug):
        if check_workspace_feature(
            slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
        ):
            try:
                workspace = Workspace.objects.get(slug=slug)
                serializer = ProjectStateSerializer(data=request.data)
                if serializer.is_valid():
                    serializer.save(workspace=workspace)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except IntegrityError as e:
                if "already exists" in str(e):
                    return Response(
                        {"name": "The state name is already taken"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        return Response(
            {"error": "Project grouping is not enabled for this workspace"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    def patch(self, request, slug, pk):
        if check_workspace_feature(
            slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
        ):
            project_states = ProjectState.objects.filter(
                workspace__slug=slug, pk=pk
            ).first()
            serializer = ProjectStateSerializer(
                project_states, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "Project grouping is not enabled for this workspace"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    def delete(self, request, slug, pk):
        if check_workspace_feature(
            slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
        ):
            project_state = ProjectState.objects.filter(
                workspace__slug=slug, pk=pk
            ).first()

            if project_state.default:
                return Response(
                    {"error": "Default state cannot be deleted"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check for any project in the state
            project_exist = ProjectAttribute.objects.filter(state=pk).exists()

            if project_exist:
                return Response(
                    {
                        "error": "The state is not empty, only empty states can be deleted"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project_state.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "Project grouping is not enabled for this workspace"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WorkspaceProjectStatesDefaultEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    def post(self, request, slug, pk):
        if check_workspace_feature(
            slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
        ):
            # Select all the states which are marked as default
            _ = ProjectState.objects.filter(workspace__slug=slug, default=True).update(
                default=False
            )
            _ = ProjectState.objects.filter(workspace__slug=slug, pk=pk).update(
                default=True
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "Project grouping is not enabled for this workspace"},
            status=status.HTTP_400_BAD_REQUEST,
        )
