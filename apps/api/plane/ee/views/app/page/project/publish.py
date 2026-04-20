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
from plane.ee.permissions import (
    ProjectPagePermission,
)
from plane.ee.views.base import BaseAPIView
from plane.permissions import PagePermissions
from plane.permissions import HasResourcePermission
from plane.db.models import DeployBoard, Workspace, Page
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction


class ProjectPagePublishEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [HasResourcePermission, ProjectPagePermission]

    action_permissions = {
        "create": {"permission": PagePermissions.EDIT, "resource_param": "project_id"},
        "partial_update": {"permission": PagePermissions.EDIT, "resource_param": "project_id"},
        "retrieve": {"permission": PagePermissions.VIEW, "resource_param": "project_id"},
        "destroy": {"permission": PagePermissions.DELETE, "resource_param": "project_id"},
    }

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def post(self, request, slug, project_id, page_id):
        workspace = Workspace.objects.get(slug=slug)
        # Fetch the page
        page = Page.objects.get(
            pk=page_id,
            workspace=workspace,
            project_pages__project_id=project_id,
            is_global=False,
            project_pages__deleted_at__isnull=True,
        )

        if page.archived_at:
            return Response(
                {"error": "You cannot publish an archived page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Throw error if the page is a workspace page
        if page.is_global:
            return Response(
                {"error": "Workspace pages cannot be published as project pages"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the deploy board attributes
        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        intake = request.data.get("intake", None)
        votes = request.data.get("is_votes_enabled", False)
        view_props = request.data.get("view_props", {})

        # Create a deploy board for the page
        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_identifier=page_id,
            entity_name="page",
            project_id=project_id,
            defaults={
                "is_comments_enabled": comments,
                "is_reactions_enabled": reactions,
                "intake": intake,
                "is_votes_enabled": votes,
                "view_props": view_props,
                "workspace": workspace,
            },
        )

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.PUBLISHED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def patch(self, request, slug, project_id, page_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(entity_identifier=page_id, entity_name="page", workspace__slug=slug)
        # Get the deploy board attributes
        data = {
            "is_comments_enabled": request.data.get("is_comments_enabled", deploy_board.is_comments_enabled),
            "is_reactions_enabled": request.data.get("is_reactions_enabled", deploy_board.is_reactions_enabled),
            "intake": request.data.get("intake", deploy_board.intake),
            "is_votes_enabled": request.data.get("is_votes_enabled", deploy_board.is_votes_enabled),
            "view_props": request.data.get("view_props", deploy_board.view_props),
        }

        # Update the deploy board
        serializer = DeployBoardSerializer(deploy_board, data=data, partial=True)
        # Return the updated deploy board
        if serializer.is_valid():
            # Save the updated deploy board
            serializer.save()
            # Return the updated deploy board
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def get(self, request, slug, project_id, page_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(entity_identifier=page_id, entity_name="page", workspace__slug=slug)
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        # Return the deploy board
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def delete(self, request, slug, project_id, page_id):
        # Get the deploy board and un publish all the sub page as well.
        deploy_board = DeployBoard.objects.get(entity_identifier=page_id, entity_name="page", workspace__slug=slug)
        # Delete the deploy board
        deploy_board.delete()

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.UNPUBLISHED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)
