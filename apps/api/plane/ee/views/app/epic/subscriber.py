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
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.db.models import IssueSubscriber
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import EpicSubscriberSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, EpicPermissions


class EpicSubscriberViewSet(BaseViewSet):
    serializer_class = EpicSubscriberSerializer
    model = IssueSubscriber

    @check_feature_flag(FeatureFlag.EPICS)
    @can(EpicPermissions.VIEW, resource_param="epic_id")
    def subscribe(self, request, slug, project_id, epic_id):
        if IssueSubscriber.objects.filter(
            issue_id=epic_id,
            subscriber=request.user,
            issue__type__is_epic=True,
            workspace__slug=slug,
            project=project_id,
        ).exists():
            return Response(
                {"message": "User already subscribed to the issue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscriber = IssueSubscriber.objects.create(
            issue_id=epic_id, subscriber_id=request.user.id, project_id=project_id
        )
        serializer = EpicSubscriberSerializer(subscriber)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.EPICS)
    @can(EpicPermissions.VIEW, resource_param="epic_id")
    def unsubscribe(self, request, slug, project_id, epic_id):
        issue_subscriber = IssueSubscriber.objects.get(
            project=project_id,
            subscriber=request.user,
            issue__type__is_epic=True,
            workspace__slug=slug,
            issue=epic_id,
        )
        issue_subscriber.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.EPICS)
    @can(EpicPermissions.VIEW, resource_param="epic_id")
    def subscription_status(self, request, slug, project_id, epic_id):
        issue_subscriber = IssueSubscriber.objects.filter(
            issue_id=epic_id,
            issue__type__is_epic=True,
            subscriber=request.user,
            workspace__slug=slug,
            project=project_id,
        ).exists()
        return Response({"subscribed": issue_subscriber}, status=status.HTTP_200_OK)
