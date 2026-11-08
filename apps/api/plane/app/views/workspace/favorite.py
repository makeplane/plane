# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from collections.abc import Mapping

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Django modules
from django.db import IntegrityError, transaction
from django.db.models import Q

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueView, UserFavorite, Workspace
from plane.app.serializers import UserFavoriteSerializer
from plane.app.serializers.favorite import get_entity_model_and_serializer, get_favorite_entities
from plane.app.permissions import allow_permission, ROLE


class WorkspaceFavoriteEndpoint(BaseAPIView):
    """Manage favorites belonging to a workspace."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        """List the current user's top-level workspace favorites."""
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
        """Create a workspace favorite after validating its target entity."""
        try:
            workspace = Workspace.objects.get(slug=slug)

            with transaction.atomic():
                # If the favorite exists return
                if request.data.get("entity_identifier"):
                    user_favorites = UserFavorite.objects.filter(
                        workspace=workspace,
                        user_id=request.user.id,
                        entity_type=request.data.get("entity_type"),
                        entity_identifier=request.data.get("entity_identifier"),
                    ).first()

                    if user_favorites:
                        serializer = UserFavoriteSerializer(user_favorites)
                        return Response(serializer.data, status=status.HTTP_200_OK)

                serializer = UserFavoriteSerializer(data=request.data)
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                project_id = request.data.get("project_id", None)
                entity_type = serializer.validated_data.get("entity_type")
                entity_model, _ = get_entity_model_and_serializer(entity_type)

                # A view favorite must share the view lock with deletion so it cannot
                # be inserted after deletion has already removed its favorites.
                if entity_model:
                    favorite_entities = get_favorite_entities(entity_type, request.user.id, project_id)
                    if entity_type == "view":
                        favorite_entities = favorite_entities.select_for_update()
                    favorite_entities.get(
                        pk=serializer.validated_data.get("entity_identifier"), workspace=workspace
                    )

                serializer.save(
                    user_id=request.user.id,
                    workspace=workspace,
                    project_id=project_id,
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
        except IntegrityError:
            return Response({"error": "Favorite already exists"}, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, favorite_id):
        """Update favorite metadata without racing saved-view deletion."""
        if not isinstance(request.data, Mapping):
            return Response(
                {"error": "Request body must be an object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            favorite_filter = UserFavorite.objects.filter(
                user=request.user, workspace__slug=slug, pk=favorite_id
            )
            favorite = favorite_filter.first()
            if favorite is None:
                return Response(
                    {"error": "The requested resource does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if favorite.entity_type == "view":
                # Deletion locks the view before removing favorites. Take that same
                # lock first, then re-read the favorite so a stale pre-delete
                # instance can never be saved back after cleanup commits.
                issue_view = IssueView.objects.select_for_update().filter(
                    pk=favorite.entity_identifier,
                    workspace_id=favorite.workspace_id,
                    project_id=favorite.project_id,
                ).first()
                if issue_view is None:
                    return Response(
                        {"error": "The requested resource does not exist."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                favorite = favorite_filter.select_for_update().first()
                if favorite is None:
                    return Response(
                        {"error": "The requested resource does not exist."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                favorite = favorite_filter.select_for_update().first()
                if favorite is None:
                    return Response(
                        {"error": "The requested resource does not exist."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # Only the name, position and folder can change; the favorited entity stays fixed.
            data = {key: request.data[key] for key in ("name", "sequence", "parent") if key in request.data}
            serializer = UserFavoriteSerializer(favorite, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, favorite_id):
        """Remove a favorite owned by the requesting user."""
        favorite = UserFavorite.objects.get(user=request.user, workspace__slug=slug, pk=favorite_id)
        favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFavoriteGroupEndpoint(BaseAPIView):
    """List and manage favorites inside workspace folders."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, favorite_id):
        """List the requesting user's favorites in a folder."""
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
