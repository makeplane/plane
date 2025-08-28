# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.permissions import WorkspacePagePermission
from plane.ee.views.base import BaseAPIView
from plane.db.models import DeployBoard, Page
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction


class WorkspacePagePublishEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def post(self, request, slug, page_id):
        # Fetch the page
        page = Page.objects.get(pk=page_id, workspace__slug=slug)

        if not page:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if page.archived_at:
            return Response(
                {"error": "You cannot publish an archived page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Throw error if the page is a project page
        if not page.is_global:
            return Response(
                {"error": "Project pages cannot be published as workspace pages"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a deploy board for the page
        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_identifier=page_id,
            entity_name="page",
            workspace_id=page.workspace_id,
        )

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.PUBLISHED,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def patch(self, request, slug, page_id):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id, entity_name="page", workspace__slug=slug
        )
        data = {
            "is_comments_enabled": request.data.get(
                "is_comments_enabled", deploy_board.is_comments_enabled
            ),
            "is_reactions_enabled": request.data.get(
                "is_reactions_enabled", deploy_board.is_reactions_enabled
            ),
            "intake": request.data.get("intake", deploy_board.intake),
            "is_votes_enabled": request.data.get(
                "is_votes_enabled", deploy_board.is_votes_enabled
            ),
            "view_props": request.data.get("view_props", deploy_board.view_props),
        }

        serializer = DeployBoardSerializer(deploy_board, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def get(self, request, slug, page_id):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id, entity_name="page", workspace__slug=slug
        )
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def delete(self, request, slug, page_id):
        # Get the deploy board and un publish all the sub page as well.
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id, entity_name="page", workspace__slug=slug
        )
        # Delete the deploy board
        deploy_board.delete()

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.UNPUBLISHED,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
