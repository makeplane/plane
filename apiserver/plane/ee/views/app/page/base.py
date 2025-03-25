from plane.ee.views.base import BaseAPIView
from plane.db.models import FileAsset, ProjectPage, Page, ProjectMember
from plane.app.permissions import allow_permission, ROLE
from plane.ee.bgtasks.move_page import move_page
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


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

        # check if the user is admin or member of the project
        if ProjectMember.objects.filter(
            project_id=new_project_id,
            member_id=request.user.id,
            workspace__slug=slug,
            role__lt=15,
        ).exists():
            return Response(
                {"error": "You do not have permission to move the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update the project id for the project pages
        ProjectPage.objects.filter(page_id=pk).update(project_id=new_project_id)

        # Update the project id for the file assets
        FileAsset.objects.filter(page_id=pk, project_id=project_id).update(
            project_id=new_project_id
        )

        # Background job to handle favorites
        move_page.delay(pk, project_id, new_project_id)

        return Response(status=status.HTTP_204_NO_CONTENT)
