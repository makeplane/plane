from plane.ee.views.base import BaseAPIView
from plane.db.models import (
    FileAsset,
    ProjectPage,
    Page,
    ProjectMember,
    PageVersion,
    DeployBoard,
    UserFavorite,
)
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction

# Third party imports
from rest_framework import status
from rest_framework.response import Response


class MovePageEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.MOVE_PAGES)
    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=Page)
    def post(self, request, slug, project_id, pk):
        new_project_id = request.data.get("new_project_id")
        if not new_project_id:
            return Response(
                {"error": "new_project_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page = Page.objects.filter(id=pk, workspace__slug=slug).first()

        parent_id = page.parent_id

        project_ids = ProjectPage.objects.filter(page_id=pk).values_list(
            "project_id", flat=True
        )

        page.id = None
        page.parent_id = None
        page.name = f"{page.name}"
        page.owned_by_id = request.user.id
        page.created_by_id = request.user.id
        page.updated_by_id = request.user.id
        page.save()

        old_page = Page.objects.get(id=pk, workspace__slug=slug)

        for project_id in project_ids:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=new_project_id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        # Get all the members for the new project
        new_project_members_list = ProjectMember.objects.filter(
            project_id=new_project_id
        ).values_list("member_id", flat=True)

        # Delete favorites for the members who are not part of the new project
        UserFavorite.objects.filter(
            entity_type="page", entity_identifier=old_page.id, project_id=project_id
        ).exclude(user_id__in=new_project_members_list).delete()

        # Update the project id of the members who are part of the project
        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=old_page.id,
            project_id=project_id,
            user_id__in=new_project_members_list,
        ).update(project_id=new_project_id, entity_identifier=page.id)

        # change the page version
        PageVersion.objects.filter(page_id=pk).update(page_id=page.id)

        # change the uploaded files in the page
        FileAsset.objects.filter(page_id=pk, project_id=new_project_id).update(
            page_id=page.id
        )

        # change the deployed board url for the page
        DeployBoard.objects.filter(
            entity_identifier=pk, project_id=project_id, entity_name="page"
        ).update(entity_identifier=page.id)

        # fetch the old page
        old_page.moved_to_page = page.id
        old_page.moved_to_project = new_project_id
        old_page.save()

        # update the descendants pages
        nested_page_update.delay(
            page_id=pk,
            action=PageAction.MOVED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
            extra={
                "new_project_id": new_project_id,
                "parent_id": parent_id,
                "new_page_id": page.id,
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
