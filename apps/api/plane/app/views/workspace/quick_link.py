# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import WorkspaceUserLink, Workspace
from plane.app.serializers import WorkspaceUserLinkSerializer
from ..base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE


class QuickLinkViewSet(BaseViewSet):
    model = WorkspaceUserLink
    use_read_replica = True

    def get_serializer_class(self):
        return WorkspaceUserLinkSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceUserLinkSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, owner_id=request.user.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        quick_link = WorkspaceUserLink.objects.filter(pk=pk, workspace__slug=slug, owner=request.user).first()

        if quick_link:
            serializer = WorkspaceUserLinkSerializer(quick_link, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Quick link not found."}, status=status.HTTP_404_NOT_FOUND)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        try:
            quick_link = WorkspaceUserLink.objects.get(pk=pk, workspace__slug=slug, owner=request.user)
            serializer = WorkspaceUserLinkSerializer(quick_link)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except WorkspaceUserLink.DoesNotExist:
            return Response({"error": "Quick link not found."}, status=status.HTTP_404_NOT_FOUND)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        quick_link = WorkspaceUserLink.objects.get(pk=pk, workspace__slug=slug, owner=request.user)
        quick_link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        quick_links = WorkspaceUserLink.objects.filter(workspace__slug=slug, owner=request.user)

        serializer = WorkspaceUserLinkSerializer(quick_links, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
