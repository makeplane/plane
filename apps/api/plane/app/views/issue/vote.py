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

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers.vote import IssueVoteSerializer
from plane.db.models import IssueVote
from plane.permissions import can, WorkitemPermissions


class IssueVoteEndpoint(BaseAPIView):
    @can(WorkitemPermissions.REACT, resource_param="work_item_id")
    def get(self, request, slug, project_id, work_item_id):
        votes = IssueVote.objects.filter(
            project_id=project_id,
            issue_id=work_item_id,
            workspace__slug=slug,
        ).select_related("actor")

        serializer = IssueVoteSerializer(votes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(WorkitemPermissions.REACT, resource_param="work_item_id")
    def post(self, request, slug, project_id, work_item_id):
        serializer = IssueVoteSerializer(
            data=request.data, context={"issue_id": work_item_id, "project_id": project_id, "user": request.user}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(WorkitemPermissions.REACT, resource_param="work_item_id")
    def delete(self, request, slug, project_id, work_item_id):
        issue_vote = IssueVote.objects.filter(
            issue_id=work_item_id,
            actor=request.user,
            project_id=project_id,
            workspace__slug=slug,
        ).first()

        if not issue_vote:
            return Response(
                {"error": "Vote not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        issue_vote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
