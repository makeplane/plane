# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import DeployBoardSerializer
from plane.db.models import DeployBoard, IssueView
from .. import BaseAPIView


class IssueViewPublishEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def get(self, request, slug, project_id, pk):
        deploy_board = DeployBoard.objects.filter(
            entity_name="view",
            entity_identifier=pk,
            workspace__slug=slug,
            project_id=project_id,
        ).first()
        if not deploy_board:
            return Response({"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND)

        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(self, request, slug, project_id, pk):
        issue_view = IssueView.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)

        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        votes = request.data.get("is_votes_enabled", False)
        views = request.data.get("views", {"list": True, "kanban": True})

        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_name="view", entity_identifier=issue_view.id, project_id=project_id
        )
        deploy_board.view_props = views
        deploy_board.is_votes_enabled = votes
        deploy_board.is_comments_enabled = comments
        deploy_board.is_reactions_enabled = reactions

        deploy_board.save()

        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def delete(self, request, slug, project_id, pk):
        deploy_boards = DeployBoard.objects.filter(
            entity_name="view",
            entity_identifier=pk,
            workspace__slug=slug,
            project_id=project_id,
        )
        if not deploy_boards.exists():
            return Response({"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND)

        deploy_boards.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
