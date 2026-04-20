# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import (
    UpdateReactionSerializer,
)
from plane.permissions import can, CycleUpdatePermissions
from plane.ee.models import (
    UpdateReaction,
)


class CycleUpdatesReactionViewSet(BaseAPIView):
    @can(CycleUpdatePermissions.REACT, resource_param="project_id")
    def post(self, request, slug, project_id, cycle_id, update_id):
        serializer = UpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                actor_id=request.user.id,
                update_id=update_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(CycleUpdatePermissions.REACT, resource_param="project_id")
    def delete(self, request, slug, project_id, cycle_id, update_id, reaction_code):
        cycle_update_reaction = UpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=update_id,
            reaction=reaction_code,
            actor=request.user,
        )
        cycle_update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
