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
from django.db.models import OuterRef, Prefetch, F, Func

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.ee.serializers import UpdatesSerializer, UpdateReactionSerializer
from plane.ee.models import UpdateReaction, EntityUpdates
from plane.permissions import can, ProjectUpdatePermissions, ProjectUpdateCommentPermissions, ResourceType
from plane.db.models import Workspace, Issue
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ProjectUpdatesViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = UpdatesSerializer
    model = EntityUpdates
    filterset_fields = ["issue__id", "workspace__id"]

    def get_queryset(self):
        queryset = self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(parent__isnull=True)
            .filter(
                project__archived_at__isnull=True,
            )
            .select_related("workspace", "project")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

        return queryset

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, project_id, pk=None):
        return super().retrieve(request, slug, project_id, pk)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id):
        project_updates = (
            EntityUpdates.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                parent__isnull=True,
                entity_type="PROJECT",
            )
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .annotate(
                comments_count=EntityUpdates.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        serializer = UpdatesSerializer(project_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdateCommentPermissions.VIEW, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)
    def comments_list(self, request, slug, project_id, pk):
        project_updates = (
            EntityUpdates.objects.filter(
                workspace__slug=slug,
                parent_id=pk,
                project_id=project_id,
                entity_type="PROJECT",
            )
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .order_by("created_at")
        )

        serializer = UpdatesSerializer(project_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.CREATE, resource_param="project_id")
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        project_issues = Issue.issue_objects.filter(workspace__slug=slug, project_id=project_id)
        total_issues = project_issues.count()
        completed_issues = (
            project_issues.filter(state__group="completed").count()
            + project_issues.filter(state__group="cancelled").count()
        )

        update_status = None

        if request.data.get("parent"):
            parent_update = EntityUpdates.objects.get(pk=request.data.get("parent"), entity_type="PROJECT")
            update_status = parent_update.status

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project_id=project_id,
                status=(update_status if update_status else request.data.get("status")),
                entity_type="PROJECT",
                total_issues=total_issues,
                completed_issues=completed_issues,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdateCommentPermissions.CREATE, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)
    def comments_create(self, request, slug, project_id, pk):
        workspace = Workspace.objects.get(slug=slug)
        parent_update = EntityUpdates.objects.get(pk=pk, entity_type="PROJECT")

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project_id=project_id,
                status=parent_update.status,
                entity_type="PROJECT",
                parent_id=pk,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, project_id, pk):
        project_update = EntityUpdates.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        serializer = UpdatesSerializer(project_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, project_id, pk):
        project_update = EntityUpdates.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        project_update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectUpdatesReactionViewSet(BaseAPIView):
    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.REACT, resource_param="project_id")
    def post(self, request, slug, project_id, update_id):
        serializer = UpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, actor_id=request.user.id, update_id=update_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdatePermissions.REACT, resource_param="project_id")
    def delete(self, request, slug, project_id, update_id, reaction_code):
        update_reaction = UpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=update_id,
            reaction=reaction_code,
            actor=request.user,
        )
        update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectUpdateCommentsReactionViewSet(BaseAPIView):
    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdateCommentPermissions.REACT, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)
    def post(self, request, slug, project_id, pk, comment_id):
        serializer = UpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, actor_id=request.user.id, update_id=comment_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @can(ProjectUpdateCommentPermissions.REACT, resource_param="pk", scope_param_type=ResourceType.PROJECT_UPDATE)
    def delete(self, request, slug, project_id, pk, comment_id, reaction_code):
        update_reaction = UpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=comment_id,
            reaction=reaction_code,
            actor=request.user,
        )
        update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
