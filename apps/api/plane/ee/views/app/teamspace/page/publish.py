# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import DeployBoard, Workspace, Page
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction
from plane.ee.permissions.page import TeamspacePagePermission


class TeamspacePagePublishEndpoint(BaseAPIView):

    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def post(self, request, slug, team_space_id, page_id):
        workspace = Workspace.objects.get(slug=slug)
        # Fetch the page
        page = Page.objects.get(pk=page_id, workspace=workspace, is_global=False)

        if page.archived_at:
            return Response(
                {"error": "You cannot publish an archived page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Throw error if the page is a workspace page
        if page.is_global:
            return Response(
                {"error": "Workspace pages cannot be published as teamspace pages"},
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
            entity_name=DeployBoard.DeployBoardType.TEAMSPACE_PAGE,
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
            slug=slug,
            user_id=request.user.id,
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def patch(self, request, slug, team_space_id, page_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id,
            entity_name=DeployBoard.DeployBoardType.TEAMSPACE_PAGE,
            workspace__slug=slug,
        )
        # Get the deploy board attributes
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
    def get(self, request, slug, team_space_id, page_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id,
            entity_name=DeployBoard.DeployBoardType.TEAMSPACE_PAGE,
            workspace__slug=slug,
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        # Return the deploy board
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    def delete(self, request, slug, team_space_id, page_id):
        # Get the deploy board and un publish all the sub page as well.
        deploy_board = DeployBoard.objects.get(
            entity_identifier=page_id,
            entity_name=DeployBoard.DeployBoardType.TEAMSPACE_PAGE,
            workspace__slug=slug,
        )
        # Delete the deploy board
        deploy_board.delete()

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.UNPUBLISHED,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)
