# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers import AgentDefinitionSerializer
from plane.license.models import AgentDefinition
from .base import BaseAPIView


class InstanceAgentEndpoint(BaseAPIView):
    """Instance-admin CRUD for the agent registry.

    See ``AgentDefinitionSerializer`` for the write-only ``env`` contract.
    """

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk=None):
        if pk is None:
            agents = AgentDefinition.objects.all()
            return Response(AgentDefinitionSerializer(agents, many=True).data, status=status.HTTP_200_OK)
        agent = AgentDefinition.objects.get(pk=pk)
        return Response(AgentDefinitionSerializer(agent).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AgentDefinitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        agent = AgentDefinition.objects.get(pk=pk)
        serializer = AgentDefinitionSerializer(agent, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        agent = AgentDefinition.objects.get(pk=pk)
        # Hard delete: a soft-deleted row would keep the encrypted credentials around.
        agent.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
