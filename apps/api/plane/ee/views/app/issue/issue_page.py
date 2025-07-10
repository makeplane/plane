# Module imports
from plane.app.views.base import BaseAPIView

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

# Module imports
from plane.ee.models import WorkItemPage
from plane.db.models import Page, Workspace
from plane.ee.serializers import WorkItemPageSerializer
from plane.app.permissions import ProjectLitePermission
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class IssuePageViewSet(BaseAPIView):
    permission_classes = [ProjectLitePermission]

    def filter_work_item_pages(self, slug, project_id, issue_id):
        return WorkItemPage.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id
        )

    @check_feature_flag(FeatureFlag.LINK_PAGES)
    def post(self, request, slug, project_id, issue_id):
        workspace = Workspace.objects.get(slug=slug)
        pages_ids = request.data.get("pages_ids", [])

        # Filtering pages that are in the workspace and the user is part of
        valid_page_ids = Page.objects.filter(
            Q(
                projects__id=project_id,
            )
            | Q(is_global=True),
            workspace_id=workspace.id,
            id__in=pages_ids,
        ).values_list("id", flat=True)

        # Bulk create only the given pages
        self.filter_work_item_pages(slug, project_id, issue_id).delete()
        work_item_pages = WorkItemPage.objects.bulk_create(
            [
                WorkItemPage(
                    workspace_id=workspace.id,
                    project_id=project_id,
                    issue_id=issue_id,
                    created_by_id=request.user.id,
                    page_id=page_id,
                )
                for page_id in valid_page_ids
            ],
        )

        work_item_pages_ids = [work_item_page.id for work_item_page in work_item_pages]

        work_item_pages = (
            self.filter_work_item_pages(slug, project_id, issue_id)
            .filter(id__in=work_item_pages_ids)
            .select_related("page")
        )

        serializer = WorkItemPageSerializer(work_item_pages, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.LINK_PAGES)
    def get(self, request, slug, project_id, issue_id, page_id=None):
        work_item_pages = self.filter_work_item_pages(slug, project_id, issue_id)
        serializer = WorkItemPageSerializer(work_item_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.LINK_PAGES)
    def delete(self, request, slug, project_id, issue_id, page_id):
        work_item_page = self.filter_work_item_pages(slug, project_id, issue_id).get(
            page_id=page_id
        )
        work_item_page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageSearchViewSet(BaseAPIView):
    permission_classes = [ProjectLitePermission]

    @check_feature_flag(FeatureFlag.LINK_PAGES)
    def get(self, request, slug, project_id):
        is_global = request.query_params.get("is_global", False)
        search = request.query_params.get("search", "")

        pages = (
            Page.objects.filter(workspace__slug=slug)
            .filter(moved_to_page__isnull=True)
            .filter(archived_at__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
        )

        if is_global == "true":
            pages = pages.filter(Q(is_global=True) | Q(projects__id=project_id))
        else:
            pages = pages.filter(projects__id=project_id)
        # Add search functionality
        if search:
            pages = pages.filter(name__icontains=search)

        pages = pages.values("id", "name", "logo_props", "is_global")
        return Response(pages, status=status.HTTP_200_OK)
