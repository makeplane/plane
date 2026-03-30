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

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace, ReleaseComment, ReleaseCommentReaction
from plane.app.serializers.release import (
    ReleaseCommentSerializer,
    ReleaseCommentReactionSerializer,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseCommentViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseCommentSerializer
    model = ReleaseComment

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(release_id=self.kwargs.get("release_id"))
            .select_related("workspace", "release")
            .prefetch_related("release_comment_reactions")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, release_id):
        comments = self.get_queryset()
        serializer = ReleaseCommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                release_id=release_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=ReleaseComment,
        level="WORKSPACE",
    )
    def partial_update(self, request, slug, release_id, pk):
        comment = ReleaseComment.objects.get(workspace__slug=slug, release_id=release_id, pk=pk)
        serializer = ReleaseCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(edited_at=timezone.now())
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=ReleaseComment,
        level="WORKSPACE",
    )
    def destroy(self, request, slug, release_id, pk):
        comment = ReleaseComment.objects.get(workspace__slug=slug, release_id=release_id, pk=pk)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseCommentReactionViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseCommentReactionSerializer
    model = ReleaseCommentReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(release_comment_id=self.kwargs.get("comment_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, release_id, comment_id):
        reactions = self.get_queryset()
        serializer = ReleaseCommentReactionSerializer(reactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug, release_id, comment_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseCommentReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                release_comment_id=comment_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def destroy(self, request, slug, release_id, comment_id, reaction_code):
        reaction = ReleaseCommentReaction.objects.get(
            workspace__slug=slug,
            release_comment_id=comment_id,
            reaction=reaction_code,
            created_by=request.user,
        )
        reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
