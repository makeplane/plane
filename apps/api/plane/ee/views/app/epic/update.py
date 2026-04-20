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
from django.db.models import Prefetch, OuterRef, Func, F, Count, Q, Subquery

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

from plane.permissions import can, EpicUpdatePermissions, EpicUpdateCommentPermissions, ResourceType
from plane.ee.serializers import UpdatesSerializer, UpdateReactionSerializer
from plane.db.models import Workspace, Issue
from plane.ee.views.base import BaseAPIView
from plane.ee.models import EntityUpdates, UpdateReaction, EntityTypeEnum
from plane.ee.utils.nested_issue_children import get_all_related_issues
from plane.bgtasks.email_notification_task import create_emaillogs_for_epic_updates
from plane.utils.host import base_host


class EpicsUpdateViewSet(BaseAPIView):
    use_read_replica = True

    model = EntityUpdates

    def get_queryset(self):
        return EntityUpdates.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            epic_id=self.kwargs.get("epic_id"),
        )

    @can(EpicUpdatePermissions.CREATE, resource_param="project_id")
    @check_feature_flag(FeatureFlag.EPICS)
    def post(self, request, slug, project_id, epic_id):
        workspace = Workspace.objects.get(slug=slug)
        issue_ids = get_all_related_issues(epic_id)

        sub_issues = Issue.objects.filter(id__in=issue_ids, workspace__slug=slug)

        sub_issues = sub_issues.aggregate(
            total_sub_issues=Count("id"),
            completed_sub_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_sub_issues=Count("id", filter=Q(state__group="cancelled")),
        )
        update_status = None

        completed_sub_issues = sub_issues["completed_sub_issues"] + sub_issues["cancelled_sub_issues"]

        if request.data.get("parent"):
            parent_update = EntityUpdates.objects.get(
                parent_update=request.data.get("parent"),
                entity_type=EntityTypeEnum.EPIC,
            )
            update_status = parent_update.status

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                epic_id=epic_id,
                project_id=project_id,
                status=(update_status if update_status else request.data.get("status")),
                entity_type=EntityTypeEnum.EPIC,
                total_issues=sub_issues["total_sub_issues"],
                completed_issues=completed_sub_issues,
            )

            # Create email logs
            create_emaillogs_for_epic_updates.delay(
                serializer.data, request.user.id, origin=base_host(request=request, is_app=True), verb="created"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(EpicUpdatePermissions.VIEW, resource_param="project_id")
    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id, epic_id):
        epic_updates = (
            self.get_queryset()
            .filter(parent__isnull=True, entity_type=EntityTypeEnum.EPIC)
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .annotate(
                comments_count=Subquery(
                    EntityUpdates.objects.filter(parent=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
            )
        )

        serializer = UpdatesSerializer(epic_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(EpicUpdatePermissions.EDIT, resource_param="pk")
    @check_feature_flag(FeatureFlag.EPICS)
    def patch(self, request, slug, project_id, epic_id, pk):
        epic_update = self.get_queryset().get(pk=pk)

        serializer = UpdatesSerializer(epic_update, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(EpicUpdatePermissions.DELETE, resource_param="pk")
    @check_feature_flag(FeatureFlag.EPICS)
    def delete(self, request, slug, project_id, epic_id, pk):
        epic_update = self.get_queryset().get(pk=pk)

        epic_update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EpicsUpdateCommentsViewSet(BaseAPIView):
    use_read_replica = True

    def get_queryset(self):
        return EntityUpdates.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            epic_id=self.kwargs.get("epic_id"),
            entity_type=EntityTypeEnum.EPIC,
        )

    @can(EpicUpdatePermissions.VIEW, resource_param="project_id")
    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id, epic_id, pk):
        epic_updates = (
            self.get_queryset()
            .filter(parent_id=pk)
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .order_by("created_at")
        )

        serializer = UpdatesSerializer(epic_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(
        EpicUpdateCommentPermissions.CREATE,
        resource_param="pk",
        scope_param_type=ResourceType.EPIC_UPDATE,
    )
    @check_feature_flag(FeatureFlag.EPICS)
    def post(self, request, slug, project_id, epic_id, pk):
        workspace = Workspace.objects.get(slug=slug)
        parent_update = self.get_queryset().get(pk=pk, entity_type=EntityTypeEnum.EPIC)

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project_id=project_id,
                epic_id=epic_id,
                status=parent_update.status,
                entity_type=EntityTypeEnum.EPIC,
                parent_id=pk,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EpicsUpdatesReactionViewSet(BaseAPIView):
    use_read_replica = True

    @can(EpicUpdatePermissions.REACT, resource_param="project_id")
    def post(self, request, slug, project_id, epic_id, update_id):
        serializer = UpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, actor_id=request.user.id, update_id=update_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(EpicUpdatePermissions.REACT, resource_param="project_id")
    def delete(self, reqeust, slug, project_id, epic_id, update_id, reaction_code):
        update_reaction = UpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=update_id,
            reaction=reaction_code,
            actor=reqeust.user,
        )
        update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
