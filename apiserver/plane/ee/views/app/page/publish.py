# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.ee.views.base import BaseAPIView
from plane.db.models import DeployBoard, Workspace, Page
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction


class ProjectPagePublishEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, field="owned_by", model=Page
    )
    def post(self, request, slug, project_id, pk):
        workspace = Workspace.objects.get(slug=slug)
        # Fetch the page
        page = Page.objects.get(
            pk=pk, workspace=workspace, projects__id=project_id, is_global=False
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
            entity_identifier=pk,
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
            page_id=pk,
            action=PageAction.PUBLISHED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, field="owned_by", model=Page
    )
    def patch(self, request, slug, project_id, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
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
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        # Return the deploy board
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, field="owned_by", model=Page
    )
    def delete(self, request, slug, project_id, pk):
        # Get the deploy board and un publish all the sub page as well.
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
        )
        # Delete the deploy board
        deploy_board.delete()

        nested_page_update.delay(
            page_id=pk,
            action=PageAction.UNPUBLISHED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePagePublishEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Page,
        field="owned_by",
        level="WORKSPACE",
    )
    def post(self, request, slug, pk):
        # Fetch the page
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        if not page:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Throw error if the page is a project page
        if not page.is_global:
            return Response(
                {"error": "Project pages cannot be published as workspace pages"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a deploy board for the page
        deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_identifier=pk, entity_name="page", workspace_id=page.workspace_id
        )

        nested_page_update.delay(
            page_id=pk, action=PageAction.PUBLISHED, slug=slug, user_id=request.user.id
        )
        # Return the deploy board
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.PAGE_PUBLISH)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Page,
        field="owned_by",
        level="WORKSPACE",
    )
    def patch(self, request, slug, pk):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
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
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def get(self, request, slug, pk):
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
        )
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Page,
        field="owned_by",
        level="WORKSPACE",
    )
    def delete(self, request, slug, pk):
        # Get the deploy board and un publish all the sub page as well.
        deploy_board = DeployBoard.objects.get(
            entity_identifier=pk, entity_name="page", workspace__slug=slug
        )
        # Delete the deploy board
        deploy_board.delete()

        nested_page_update.delay(
            page_id=pk,
            action=PageAction.UNPUBLISHED,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
