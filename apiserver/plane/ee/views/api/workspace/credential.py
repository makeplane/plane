# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.conf import settings

# Module imports
from plane.db.models.workspace import Workspace
from plane.ee.models.workspace import WorkspaceCredential
from plane.ee.views.base import BaseAPIView, BaseViewSet
from plane.ee.serializers import WorkspaceCredentialSerializer
from plane.app.permissions.workspace import WorkSpaceBasePermission


class WorkspaceCredentialAPIView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]
    
    def get(self, request, slug, pk = None):
        if not pk:
            return self.get_credentials(request, slug)
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        serializer = WorkspaceCredentialSerializer(credential)
        return Response(serializer.data, status=status.HTTP_200_OK)  

    def get_credentials(self, request, slug):
        # Extract `source` from query params
        source = request.query_params.get("source", "").lower()
        user_id = request.query_params.get("user_id", None)

        # Fetch credentials using a service function
        workspace = Workspace.objects.filter(slug=slug).first()
        workspace_id = workspace.id
        credentials = WorkspaceCredential.objects.filter(workspace_id=workspace_id, user_id=user_id, source=source).first()

        # Determine if OAuth is enabled for the given source
        is_oauth_enabled = False
        if source == "linear":
            is_oauth_enabled = getattr(settings, "LINEAR_OAUTH_ENABLED", "0") == "1"
        elif source == "jira":
            is_oauth_enabled = getattr(settings, "JIRA_OAUTH_ENABLED", "0") == "1"
        elif source == "jira_server":
            is_oauth_enabled = getattr(settings, "JIRA_SERVER_OAUTH_ENABLED", "0") == "1"
        elif source == "asana":
            is_oauth_enabled = getattr(settings, "ASANA_OAUTH_ENABLED", "0") == "1"

        # Return appropriate response based on credentials
        if not credentials:
            return Response(
                {"isAuthenticated": False, "isOAuthEnabled": is_oauth_enabled},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"isAuthenticated": True, "isOAuthEnabled": is_oauth_enabled},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug = slug)
        user_id = request.data.get('user_id', None)
        source = request.data.get('source', None)

        credential, _ = WorkspaceCredential.objects.update_or_create(
            workspace_id = workspace.id,
            user_id = user_id,
            source = source,
            is_active = True,
            defaults = {
                "workspace_id": workspace.id,
                "user_id": user_id,
                "source": source,
                "is_active": True,
            }
        )

        serializer = WorkspaceCredentialSerializer(credential)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        if not credential:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = WorkspaceCredentialSerializer(credential, data={"is_active": False}, partial=True)
        if serializer.is_valid():
            serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyWorkspaceCredentialAPIView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]
    def post(self, request, slug, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        token = request.data.get("token", None)

        serializer = WorkspaceCredentialSerializer(
            credential, 
            data={"token": token}, 
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
