from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Integration, Workspace, WorkspaceIntegration

from .serializers import IntegrationSerializer, WorkspaceIntegrationSerializer


class IntegrationListEndpoint(BaseAPIView):
    """GET /api/integrations/ — list of available integration types.

    Returns the seeded Integration rows (Slack, GitHub). Auth required
    so the frontend's existing APIService can call it; no role gate
    because every workspace member can see what's available.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        integrations = Integration.objects.all()
        return Response(IntegrationSerializer(integrations, many=True).data)


class WorkspaceIntegrationEndpoint(BaseAPIView):
    """GET/DELETE /api/workspaces/<slug>/workspace-integrations/[<id>/provider/]

    Lists installed integrations for a workspace (any member can see)
    and lets workspace admins uninstall them.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        installed = WorkspaceIntegration.objects.filter(workspace=workspace).select_related("integration")
        return Response(WorkspaceIntegrationSerializer(installed, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        WorkspaceIntegration.objects.filter(workspace=workspace, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)