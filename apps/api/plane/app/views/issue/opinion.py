# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.response import Response
from rest_framework import status

from .. import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueOpinionSerializer
from plane.db.models import IssueActivity, IssueOpinion


class IssueOpinionEndpoint(BaseAPIView):
    """
    Scoped per activity row.
    GET  /activities/<activity_id>/opinion/   → get opinion of this row (if exists)
    POST /activities/<activity_id>/opinion/   → upsert opinion of current user
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, activity_id):
        opinion = (
            IssueOpinion.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                activity_id=activity_id,
            )
            .select_related("actor", "workspace", "project", "activity")
            .first()
        )
        if not opinion:
            return Response(None, status=status.HTTP_204_NO_CONTENT)
        return Response(
            IssueOpinionSerializer(opinion).data, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id, activity_id):
        # Verify activity exists and actor match
        activity = IssueActivity.objects.filter(
            pk=activity_id,
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).first()
        if not activity:
            return Response(
                {"error": "Activity not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Enforce: only actor of this activity can create opinion
        if str(activity.actor_id) != str(request.user.id):
            return Response(
                {"error": "Only the activity owner can add an opinion."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueOpinionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        opinion, _ = IssueOpinion.objects.update_or_create(
            activity=activity,
            actor=request.user,
            defaults={
                "sentiment": serializer.validated_data.get("sentiment", "neutral"),
                "content": serializer.validated_data.get("content", ""),
                "workspace_id": activity.workspace_id,
                "project_id": activity.project_id,
            },
        )
        return Response(
            IssueOpinionSerializer(opinion).data, status=status.HTTP_200_OK
        )


class IssueOpinionDetailEndpoint(BaseAPIView):
    """
    DELETE /activities/<activity_id>/opinion/<pk>/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, issue_id, activity_id, pk):
        opinion = IssueOpinion.objects.filter(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            activity_id=activity_id,
        ).first()
        if not opinion:
            return Response(
                {"error": "Not found"}, status=status.HTTP_404_NOT_FOUND
            )
        if str(opinion.actor_id) != str(request.user.id):
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )
        opinion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueOpinionListEndpoint(BaseAPIView):
    """
    Batch GET: returns all opinions for an issue, keyed by activityId.
    GET /issues/<issue_id>/activity-opinions/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        opinions = IssueOpinion.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            activity__issue_id=issue_id,
        ).select_related("actor", "workspace", "project", "activity")
        # Return as dict keyed by activityId for O(1) frontend lookup
        data = {
            str(op.activity_id): IssueOpinionSerializer(op).data
            for op in opinions
        }
        return Response(data, status=status.HTTP_200_OK)
