# Python improts
import uuid

# Django imports
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet
from plane.db.models import (
    Integration,
    WorkspaceIntegration,
    Workspace,
    User,
    WorkspaceMember,
    APIToken,
)
from plane.api.serializers import IntegrationSerializer, WorkspaceIntegrationSerializer
from plane.utils.integrations.github import (
    get_github_metadata,
    delete_github_installation,
)
from plane.api.permissions import WorkSpaceAdminPermission

class IntegrationViewSet(BaseViewSet):
    serializer_class = IntegrationSerializer
    model = Integration

    def create(self, request):
        try:
            serializer = IntegrationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, pk):
        try:
            integration = Integration.objects.get(pk=pk)
            if integration.verified:
                return Response(
                    {"error": "Verified integrations cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IntegrationSerializer(
                integration, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Integration.DoesNotExist:
            return Response(
                {"error": "Integration Does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, pk):
        try:
            integration = Integration.objects.get(pk=pk)
            if integration.verified:
                return Response(
                    {"error": "Verified integrations cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            integration.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Integration.DoesNotExist:
            return Response(
                {"error": "Integration Does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )


class WorkspaceIntegrationViewSet(BaseViewSet):
    serializer_class = WorkspaceIntegrationSerializer
    model = WorkspaceIntegration

    permission_classes = [
        WorkSpaceAdminPermission,
    ]


    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("integration")
        )

    def create(self, request, slug, provider):
        try:
            installation_id = request.data.get("installation_id", None)

            if not installation_id:
                return Response(
                    {"error": "Installation ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.get(slug=slug)
            integration = Integration.objects.get(provider=provider)
            config = {}
            if provider == "github":
                metadata = get_github_metadata(installation_id)
                config = {"installation_id": installation_id}

            # Create a bot user
            bot_user = User.objects.create(
                email=f"{uuid.uuid4().hex}@plane.so",
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
                is_bot=True,
                first_name=integration.title,
                avatar=integration.avatar_url
                if integration.avatar_url is not None
                else "",
            )

            # Create an API Token for the bot user
            api_token = APIToken.objects.create(
                user=bot_user,
                user_type=1,  # bot user
                workspace=workspace,
            )

            workspace_integration = WorkspaceIntegration.objects.create(
                workspace=workspace,
                integration=integration,
                actor=bot_user,
                api_token=api_token,
                metadata=metadata,
                config=config,
            )

            # Add bot user as a member of workspace
            _ = WorkspaceMember.objects.create(
                workspace=workspace_integration.workspace,
                member=bot_user,
                role=20,
            )
            return Response(
                WorkspaceIntegrationSerializer(workspace_integration).data,
                status=status.HTTP_201_CREATED,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "Integration is already active in the workspace"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (Workspace.DoesNotExist, Integration.DoesNotExist) as e:
            capture_exception(e)
            return Response(
                {"error": "Workspace or Integration not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, pk):
        try:
            workspace_integration = WorkspaceIntegration.objects.get(
                pk=pk, workspace__slug=slug
            )

            if workspace_integration.integration.provider == "github":
                installation_id = workspace_integration.config.get(
                    "installation_id", False
                )
                if installation_id:
                    delete_github_installation(installation_id=installation_id)

            workspace_integration.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except WorkspaceIntegration.DoesNotExist:
            return Response(
                {"error": "Workspace Integration Does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
