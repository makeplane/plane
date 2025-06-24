import requests
import base64

from django.conf import settings
from django.utils import timezone

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
from plane.ee.models import PageUser
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.utils.url import normalize_url_path


class MovePageEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.MOVE_PAGES)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, model=Page, field="owned_by"
    )
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

        live_url = settings.LIVE_URL
        if not live_url:
            return {}

        # get the latest description from the live server
        url = normalize_url_path(
            f"{live_url}/live-document?documentId={page.id}&variant=document&workspaceSlug={slug}/"
        )

        # Send the payload to the live server
        response = requests.get(
            url,
            headers={
                "Content-Type": "application/json",
                "live-server-secret-key": settings.LIVE_SERVER_SECRET_KEY,
            },
        )

        response_json = response.json()

        description_binary = (
            base64.b64decode(response_json.get("description_binary"))
            if response_json.get("description_binary")
            else page.description_binary
        )
        description_html = (
            response_json.get("description_html")
            if response_json.get("description_html")
            else page.description_html
        )
        name = response_json.get("name") if response_json.get("name") else page.name
        description = (
            response_json.get("description")
            if response_json.get("description")
            else page.description
        )

        page.id = None
        page.parent_id = None
        page.owned_by_id = request.user.id
        page.created_by_id = request.user.id
        page.updated_by_id = request.user.id
        page.name = name
        page.description = description
        page.description_binary = description_binary
        page.description_html = description_html
        page.save()

        old_page = Page.objects.get(id=pk, workspace__slug=slug)

        new_page_id = page.id

        for project_id in project_ids:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=new_project_id,
                page_id=new_page_id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        # Get all the members for the new project
        new_project_members_list = ProjectMember.objects.filter(
            project_id=new_project_id
        ).values_list("member_id", flat=True)

        # Delete favorites for the members who are not part of the new project
        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=old_page.id,
            project_id=project_id,
            workspace__slug=slug,
        ).exclude(user_id__in=new_project_members_list).delete()

        # Update the project id of the members who are part of the project
        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=old_page.id,
            project_id=project_id,
            user_id__in=new_project_members_list,
        ).update(
            project_id=new_project_id,
            entity_identifier=new_page_id,
            updated_by_id=request.user.id,
            updated_at=timezone.now(),
        )

        # change the page version
        PageVersion.objects.filter(page_id=pk, workspace__slug=slug).update(
            page_id=new_page_id,
            updated_by_id=request.user.id,
            updated_at=timezone.now(),
        )

        # change the uploaded files in the page
        FileAsset.objects.filter(page_id=pk, project_id=project_id, workspace__slug=slug).update(
            page_id=new_page_id,
            updated_by_id=request.user.id,
            updated_at=timezone.now(),
        )

        # change the deployed board url for the page
        DeployBoard.objects.filter(
            entity_identifier=pk,
            project_id=project_id,
            entity_name="page",
            workspace__slug=slug,
        ).update(
            entity_identifier=new_page_id,
            updated_by_id=request.user.id,
            updated_at=timezone.now(),
        )

        # share the page with the new project
        PageUser.objects.filter(
            page_id=pk, project_id=project_id, workspace__slug=slug
        ).update(
            page_id=new_page_id,
            updated_by_id=request.user.id,
            updated_at=timezone.now(),
        )

        # fetch the old page
        old_page.moved_to_page = new_page_id
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
                "new_page_id": new_page_id,
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
