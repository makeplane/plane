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
from plane.app.serializers import NotificationSerializer
from plane.db.models import Notification
from plane.utils.paginator import BasePaginator
from plane.permissions import can, WorkspacePermissions
from plane.app.views.base import BaseViewSet
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class InboxViewSet(BaseViewSet, BasePaginator):
    model = Notification
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                receiver_id=self.request.user.id,
            )
            .select_related("workspace", "project", "triggered_by", "receiver")
        )

    @check_feature_flag(FeatureFlag.INBOX_STACKING)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def partial_update(self, request, slug):
        notification_ids = request.data.get("notification_ids")
        if notification_ids:
            notifications = Notification.objects.filter(
                workspace__slug=slug,
                receiver=request.user,
                id__in=request.data.get("notification_ids"),
            )
            for notification in notifications:
                notification_data = {"snoozed_till": request.data.get("snoozed_till", None)}
                serializer = NotificationSerializer(notification, data=notification_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(status=status.HTTP_204_NO_CONTENT)
        notification = Notification.objects.get(workspace__slug=slug, receiver=request.user)
        # Only read_at and snoozed_till can be updated
        notification_data = {"snoozed_till": request.data.get("snoozed_till", None)}
        serializer = NotificationSerializer(notification, data=notification_data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INBOX_STACKING)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def mark_read(self, request, slug):
        notification_ids = request.data.get("notification_ids")
        if notification_ids:
            notifications = Notification.objects.filter(
                workspace__slug=slug,
                receiver=request.user,
                id__in=request.data.get("notification_ids"),
            )
            for notification in notifications:
                notification.read_at = timezone.now()
                notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        notification = Notification.objects.get(receiver=request.user, workspace__slug=slug)
        notification.read_at = timezone.now()
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.INBOX_STACKING)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def mark_unread(self, request, slug):
        notification_ids = request.data.get("notification_ids")
        if notification_ids:
            notifications = Notification.objects.filter(
                workspace__slug=slug,
                receiver=request.user,
                id__in=request.data.get("notification_ids"),
            )
            for notification in notifications:
                notification.read_at = None
                notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        notification = Notification.objects.get(receiver=request.user, workspace__slug=slug)
        notification.read_at = None
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def archive(self, request, slug):
        notification_ids = request.data.get("notification_ids")
        if notification_ids:
            notifications = Notification.objects.filter(
                workspace__slug=slug,
                receiver=request.user,
                id__in=request.data.get("notification_ids"),
            )
            for notification in notifications:
                notification.archived_at = timezone.now()
                notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        notification = Notification.objects.get(receiver=request.user, workspace__slug=slug)
        notification.archived_at = timezone.now()
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def unarchive(self, request, slug):
        notification_ids = request.data.get("notification_ids")
        if notification_ids:
            notifications = Notification.objects.filter(
                workspace__slug=slug,
                receiver=request.user,
                id__in=request.data.get("notification_ids"),
            )
            for notification in notifications:
                notification.archived_at = None
                notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        notification = Notification.objects.get(receiver=request.user, workspace__slug=slug)
        notification.archived_at = None
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
