# Django import
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet, BaseAPIView
from plane.db.models import SlackProjectSync, WorkspaceIntegration, ProjectMember
from plane.api.serializers import SlackProjectSyncSerializer
from plane.api.permissions import ProjectBasePermission, ProjectEntityPermission


class SlackProjectSyncViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]
    serializer_class = SlackProjectSyncSerializer
    model = SlackProjectSync

    def create(self, request, slug, project_id, workspace_integration_id):
        try:
            serializer = SlackProjectSyncSerializer(data=request.data)

            workspace_integration = WorkspaceIntegration.objects.get(
                workspace__slug=slug, pk=workspace_integration_id
            )

            if serializer.is_valid():
                serializer.save(
                    project_id=project_id,
                    workspace_integration_id=workspace_integration_id,
                )

                workspace_integration = WorkspaceIntegration.objects.get(
                    pk=workspace_integration_id, workspace__slug=slug
                )

                _ = ProjectMember.objects.get_or_create(
                    member=workspace_integration.actor, role=20, project_id=project_id
                )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"error": "Slack is already enabled for the project"}, status=status.HTTP_400_BAD_REQUEST)
        except WorkspaceIntegration.DoesNotExist:
            return Response(
                {"error": "Workspace Integration does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            print(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
