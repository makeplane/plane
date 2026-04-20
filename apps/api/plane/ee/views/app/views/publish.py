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
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.permissions import can, WorkitemViewPermissions
from plane.db.models import DeployBoard, Workspace, IssueView
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
class WorkspaceViewsPublishEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    def post(self, request, slug, view_id):
        workspace = Workspace.objects.get(slug=slug)
        # Fetch the view
        issue_view = IssueView.objects.get(pk=view_id, workspace=workspace)

        if request.user != issue_view.owned_by:
            return Response(
                {"error": "Only the owner can publish the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the view is already published
        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        intake = request.data.get("intake", None)
        votes = request.data.get("is_votes_enabled", False)
        view_props = request.data.get("view_props", {})

        # Create a deploy board for the views
        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_identifier=view_id,
            entity_name="view",
            defaults={
                "is_comments_enabled": comments,
                "is_reactions_enabled": reactions,
                "intake": intake,
                "is_votes_enabled": votes,
                "view_props": view_props,
                "workspace": workspace,
            },
        )

        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    def patch(self, request, slug, view_id):
        deploy_board = DeployBoard.objects.get(entity_identifier=view_id, entity_name="view", workspace__slug=slug)
        data = {
            "is_comments_enabled": request.data.get("is_comments_enabled", deploy_board.is_comments_enabled),
            "is_reactions_enabled": request.data.get("is_reactions_enabled", deploy_board.is_reactions_enabled),
            "intake": request.data.get("intake", deploy_board.intake),
            "is_votes_enabled": request.data.get("is_votes_enabled", deploy_board.is_votes_enabled),
            "view_props": request.data.get("view_props", deploy_board.view_props),
        }

        serializer = DeployBoardSerializer(deploy_board, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    def get(self, request, slug, view_id):
        deploy_board = DeployBoard.objects.get(entity_identifier=view_id, entity_name="view", workspace__slug=slug)
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    def delete(self, request, slug, view_id):
        deploy_board = DeployBoard.objects.get(entity_identifier=view_id, entity_name="view", workspace__slug=slug)
        deploy_board.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueViewsPublishEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    @can(WorkitemViewPermissions.PUBLISH, resource_param="pk")
    def post(self, request, slug, project_id, pk):
        # Fetch the view
        issue_view = IssueView.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)

        if request.user != issue_view.owned_by:
            return Response(
                {"error": "Only the owner can publish the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the view is already published
        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        intake = request.data.get("intake", None)
        votes = request.data.get("is_votes_enabled", False)
        view_props = request.data.get("view_props", {})

        # Create a deploy board for the views
        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_identifier=pk,
            entity_name="view",
            project_id=project_id,
            defaults={
                "is_comments_enabled": comments,
                "is_reactions_enabled": reactions,
                "intake": intake,
                "is_votes_enabled": votes,
                "view_props": view_props,
            },
        )
        issue_view.save()

        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    @can(WorkitemViewPermissions.PUBLISH, resource_param="pk")
    def patch(self, request, slug, project_id, pk):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk,
            entity_name="view",
            workspace__slug=slug,
            project_id=project_id,
        )
        data = {
            "is_comments_enabled": request.data.get("is_comments_enabled", deploy_board.is_comments_enabled),
            "is_reactions_enabled": request.data.get("is_reactions_enabled", deploy_board.is_reactions_enabled),
            "intake": request.data.get("intake", deploy_board.intake),
            "is_votes_enabled": request.data.get("is_votes_enabled", deploy_board.is_votes_enabled),
            "view_props": request.data.get("view_props", deploy_board.view_props),
        }

        serializer = DeployBoardSerializer(deploy_board, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    @can(WorkitemViewPermissions.PUBLISH, resource_param="pk")
    def get(self, request, slug, project_id, pk):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk,
            entity_name="view",
            workspace__slug=slug,
            project_id=project_id,
        )
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.VIEW_PUBLISH)
    @can(WorkitemViewPermissions.PUBLISH, resource_param="pk")
    def delete(self, request, slug, project_id, pk):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk,
            entity_name="view",
            workspace__slug=slug,
            project_id=project_id,
        )
        deploy_board.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
