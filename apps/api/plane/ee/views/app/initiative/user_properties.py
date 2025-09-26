from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.ee.models import InitiativeUserProperty
from plane.ee.permissions import WorkspaceEntityPermission
from plane.ee.serializers.app.initiative import InitiativeUserPropertySerializer


class InitiativeUserPropertiesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        initiative_user_properties, _ = InitiativeUserProperty.objects.get_or_create(
            user=request.user, workspace=workspace
        )
        serializer = InitiativeUserPropertySerializer(initiative_user_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        initiative_user_properties = InitiativeUserProperty.objects.get(
            user=request.user, workspace=workspace
        )
        initiative_user_properties.filters = request.data.get(
            "filters", initiative_user_properties.filters
        )

        initiative_user_properties.display_filters = request.data.get(
            "display_filters", initiative_user_properties.display_filters
        )
        initiative_user_properties.display_properties = request.data.get(
            "display_properties", initiative_user_properties.display_properties
        )
        initiative_user_properties.rich_filters = request.data.get(
            "rich_filters", initiative_user_properties.rich_filters
        )
        initiative_user_properties.save()
        serializer = InitiativeUserPropertySerializer(initiative_user_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)
