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

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import (
    InitiativeCommentSerializer,
    InitiativeCommentReactionSerializer,
)
from plane.permissions import can, InitiativeCommentPermissions, ResourceType
from plane.db.models import Workspace
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.models import InitiativeComment, InitiativeCommentReaction
from plane.ee.bgtasks.initiative_activity_task import initiative_activity


class InitiativeCommentViewSet(BaseViewSet):
    serializer_class = InitiativeCommentSerializer
    model = InitiativeComment

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(initiative_id=self.kwargs.get("initiative_id"))
            .select_related("workspace", "initiative")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeCommentPermissions.CREATE, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)
    def create(self, request, slug, initiative_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = InitiativeCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                initiative_id=initiative_id,
                actor=request.user,
            )
            initiative_activity.delay(
                type="comment.activity.created",
                slug=slug,
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                initiative_id=str(self.kwargs.get("initiative_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeCommentPermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, initiative_id, pk):
        initiative_comment = InitiativeComment.objects.get(workspace__slug=slug, initiative_id=initiative_id, pk=pk)
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(InitiativeCommentSerializer(initiative_comment).data, cls=DjangoJSONEncoder)
        serializer = InitiativeCommentSerializer(initiative_comment, data=request.data, partial=True)
        if serializer.is_valid():
            if "comment_html" in request.data and request.data["comment_html"] != initiative_comment.comment_html:
                serializer.save(edited_at=timezone.now())

            initiative_activity.delay(
                type="comment.activity.updated",
                slug=slug,
                requested_data=requested_data,
                actor_id=str(request.user.id),
                initiative_id=str(initiative_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeCommentPermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, initiative_id, pk):
        initiative_comment = InitiativeComment.objects.get(workspace__slug=slug, initiative_id=initiative_id, pk=pk)
        current_instance = json.dumps(InitiativeCommentSerializer(initiative_comment).data, cls=DjangoJSONEncoder)
        initiative_comment.delete()
        initiative_activity.delay(
            type="comment.activity.deleted",
            slug=slug,
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            initiative_id=str(initiative_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeCommentReactionViewSet(BaseViewSet):
    serializer_class = InitiativeCommentReactionSerializer
    model = InitiativeCommentReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(initiative_id=self.kwargs.get("initiative_id"))
            .filter(comment_id=self.kwargs.get("comment_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeCommentPermissions.REACT, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)
    def create(self, request, slug, initiative_id, comment_id):
        workspace = Workspace.objects.get(slug=slug)

        serializer = InitiativeCommentReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                actor_id=request.user.id,
                comment_id=comment_id,
            )
            initiative_activity.delay(
                type="comment_reaction.activity.created",
                slug=slug,
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                initiative_id=initiative_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeCommentPermissions.REACT, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)
    def destroy(self, request, slug, initiative_id, comment_id, reaction_code):
        initiative_comment_reaction = InitiativeCommentReaction.objects.get(
            workspace__slug=slug,
            comment_id=comment_id,
            reaction=reaction_code,
            actor=request.user,
        )
        initiative_activity.delay(
            type="comment_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            slug=slug,
            initiative_id=initiative_id,
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(initiative_comment_reaction.id),
                    "comment_id": str(comment_id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        initiative_comment_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
