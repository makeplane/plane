# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Django modules
from django.db.models import Q
from django.db import IntegrityError

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import UserFavorite, Workspace
from plane.app.serializers import UserFavoriteSerializer
from plane.app.permissions import allow_permission, ROLE


class WorkspaceFavoriteEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        # the second filter is to check if the user is a member of the project
        favorites = UserFavorite.objects.filter(user=request.user, workspace__slug=slug, parent__isnull=True).filter(
            Q(project__isnull=True) & ~Q(entity_type="page")
            | (
                Q(project__isnull=False)
                & Q(project__project_projectmember__member=request.user)
                & Q(project__project_projectmember__is_active=True)
            )
        )
        serializer = UserFavoriteSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            # If the favorite exists return
            if request.data.get("entity_identifier"):
                user_favorites = UserFavorite.objects.filter(
                    workspace=workspace,
                    user_id=request.user.id,
                    entity_type=request.data.get("entity_type"),
                    entity_identifier=request.data.get("entity_identifier"),
                ).first()

                # If the favorite exists return
                if user_favorites:
                    serializer = UserFavoriteSerializer(user_favorites)
                    return Response(serializer.data, status=status.HTTP_200_OK)

            # else create a new favorite
            serializer = UserFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    user_id=request.user.id,
                    workspace=workspace,
                    project_id=request.data.get("project_id", None),
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"error": "Favorite already exists"}, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, favorite_id):
        favorite = UserFavorite.objects.get(user=request.user, workspace__slug=slug, pk=favorite_id)
        serializer = UserFavoriteSerializer(favorite, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, favorite_id):
        favorite = UserFavorite.objects.get(user=request.user, workspace__slug=slug, pk=favorite_id)
        favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFavoriteGroupEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, favorite_id):
        favorites = UserFavorite.objects.filter(user=request.user, workspace__slug=slug, parent_id=favorite_id).filter(
            Q(project__isnull=True)
            | (
                Q(project__isnull=False)
                & Q(project__project_projectmember__member=request.user)
                & Q(project__project_projectmember__is_active=True)
            )
        )
        serializer = UserFavoriteSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
