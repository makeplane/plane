# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.serializers import DeployBoardSerializer
from plane.db.models import DeployBoard, IssueView


class ViewPublicSettingsEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="view").first()
        if not deploy_board:
            return Response({"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND)

        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ViewMetaDataEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="view").first()
        if not deploy_board:
            return Response({"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND)

        issue_view = IssueView.objects.filter(pk=deploy_board.entity_identifier).first()
        if not issue_view:
            return Response({"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "id": str(issue_view.id),
                "name": issue_view.name,
                "description": issue_view.description,
                "logo_props": issue_view.logo_props,
            },
            status=status.HTTP_200_OK,
        )
