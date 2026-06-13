# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.app.serializers import RosterPlayerImportSerializer, RosterPlayerSerializer
from plane.db.models import Project, RosterPlayer
from .base import BaseViewSet


class RosterPlayerViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = RosterPlayer
    serializer_class = RosterPlayerSerializer
    filterset_fields = ["position", "status", "class_year"]
    search_fields = ["player_name", "jersey_number", "position"]

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
        )

        return queryset.order_by(RosterPlayer.jersey_number_ordering(), "player_name", "created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = Project.objects.get(workspace__slug=self.kwargs.get("slug"), pk=self.kwargs.get("project_id"))
        return context

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        return super().retrieve(request, slug, project_id, pk)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        return super().create(request, slug, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        return super().partial_update(request, slug, project_id, pk)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        roster_player = self.get_object()
        roster_player.delete()
        return Response({"success": True, "message": "Player deleted successfully."}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def import_players(self, request, slug, project_id):
        serializer = RosterPlayerImportSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            players = serializer.save()

        response_serializer = self.get_serializer(players, many=True)
        return Response(
            {
                "success": True,
                "data": response_serializer.data,
                "imported_count": len(response_serializer.data),
                "message": "Roster imported successfully.",
            },
            status=status.HTTP_201_CREATED,
        )
