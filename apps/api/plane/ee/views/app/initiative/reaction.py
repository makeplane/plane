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

# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Workspace
from plane.ee.views.base import BaseViewSet
from plane.ee.models import InitiativeReaction
from plane.payment.flags.flag import FeatureFlag
from plane.permissions import can, InitiativePermissions
from plane.ee.serializers import InitiativeReactionSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity


class InitiativeReactionViewSet(BaseViewSet):
    serializer_class = InitiativeReactionSerializer
    model = InitiativeReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(initiative_id=self.kwargs.get("initiative_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.VIEW, resource_param="initiative_id")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.REACT, resource_param="initiative_id")
    def create(self, request, slug, initiative_id):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = InitiativeReactionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    initiative_id=initiative_id,
                    actor=request.user,
                    workspace_id=workspace.id,
                )
                initiative_activity.delay(
                    type="initiative_reaction.activity.created",
                    slug=slug,
                    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    initiative_id=str(initiative_id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"error": "Reaction already exists"}, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.REACT, resource_param="initiative_id")
    def destroy(self, request, slug, initiative_id, reaction_code):
        initiative_reaction = InitiativeReaction.objects.get(
            workspace__slug=slug,
            initiative_id=initiative_id,
            reaction=reaction_code,
            actor=request.user,
        )
        initiative_activity.delay(
            type="initiative_reaction.activity.deleted",
            slug=slug,
            requested_data=None,
            actor_id=str(self.request.user.id),
            initiative_id=str(self.kwargs.get("initiative_id", None)),
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(initiative_reaction.id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        initiative_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
