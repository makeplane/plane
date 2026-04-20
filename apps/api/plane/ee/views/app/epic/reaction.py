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
from plane.db.models import IssueReaction
from plane.ee.views.base import BaseViewSet
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import EpicReactionSerializer
from plane.permissions import can, EpicPermissions
from plane.bgtasks.issue_activities_task import issue_activity
from plane.payment.flags.flag_decorator import check_feature_flag


class EpicReactionViewSet(BaseViewSet):
    serializer_class = EpicReactionSerializer
    model = IssueReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

    @can(EpicPermissions.REACT, resource_param="epic_id")
    @check_feature_flag(FeatureFlag.EPICS)
    def create(self, request, slug, project_id, epic_id):
        serializer = EpicReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(issue_id=epic_id, project_id=project_id, actor=request.user)
            issue_activity.delay(
                type="issue_reaction.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(epic_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(EpicPermissions.REACT, resource_param="epic_id")
    @check_feature_flag(FeatureFlag.EPICS)
    def destroy(self, request, slug, project_id, epic_id, reaction_code):
        epic_reaction = IssueReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=epic_id,
            reaction=reaction_code,
            actor=request.user,
        )
        issue_activity.delay(
            type="issue_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("epic_id", None)),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps({"reaction": str(reaction_code), "identifier": str(epic_reaction.id)}),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        epic_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
