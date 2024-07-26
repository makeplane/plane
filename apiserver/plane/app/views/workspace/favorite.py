# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import UserFavorite, Workspace
from plane.app.serializers import UserFavoriteSerializer
from plane.app.permissions import WorkspaceEntityPermission


class WorkspaceFavoriteEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        favorites = UserFavorite.objects.filter(
            user=request.user,
            workspace__slug=slug,
            parent__isnull=True,
        )
        serializer = UserFavoriteSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = UserFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_id=request.user.id, workspace=workspace)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, favorite_id):
        favorite = UserFavorite.objects.get(
            user=request.user, workspace__slug=slug, pk=favorite_id
        )
        serializer = UserFavoriteSerializer(
            favorite, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, favorite_id):
        favorite = UserFavorite.objects.get(
            user=request.user, workspace__slug=slug, pk=favorite_id
        )
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFavoriteGroupEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug, favorite_id):
        favorites = UserFavorite.objects.filter(
            user=request.user,
            workspace__slug=slug,
            parent_id=favorite_id,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        )
        serializer = UserFavoriteSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
