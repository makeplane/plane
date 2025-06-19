# Python imports
import json
import base64
from datetime import datetime, timedelta

# Django imports
from django.db.models import Exists, OuterRef, Q, Subquery, Count, F, Func
from django.utils import timezone
from django.http import StreamingHttpResponse
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.serializers import (
    WorkspacePageSerializer,
    WorkspacePageLiteSerializer,
    WorkspacePageDetailSerializer,
    WorkspacePageVersionSerializer,
    WorkspacePageVersionDetailSerializer,
)
from plane.db.models import (
    Page,
    Workspace,
    DeployBoard,
    PageVersion,
    UserFavorite,
    WorkspaceMember,
    UserRecentVisit,
)
from plane.ee.models import PageUser
from plane.utils.error_codes import ERROR_CODES
from plane.payment.flags.flag import FeatureFlag
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.bgtasks.page_version_task import page_version
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_descendants import get_all_parent_ids
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.ee.utils.page_events import PageAction
from plane.ee.permissions.page import WorkspacePagePermission


class WorkspacePageViewSet(BaseViewSet):
    serializer_class = WorkspacePageSerializer
    model = Page
    permission_classes = [WorkspacePagePermission]
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        user_pages = PageUser.objects.filter(
            user_id=self.request.user.id,
            workspace__slug=self.kwargs.get("slug"),
        ).values_list("page_id", flat=True)
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(is_global=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0) | Q(id__in=user_pages))
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                anchor=Subquery(
                    DeployBoard.objects.filter(
                        entity_name="page",
                        entity_identifier=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    ).values("anchor")[:1]
                )
            )
            .annotate(
                shared_access=Subquery(
                    PageUser.objects.filter(
                        page_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                        user_id=self.request.user.id,
                    ).values("access")[:1]
                )
            )
            .annotate(
                is_shared=Exists(
                    PageUser.objects.filter(
                        page_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .distinct()
        )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspacePageSerializer(
            data=request.data,
            context={
                "owned_by_id": request.user.id,
                "description_html": request.data.get("description_html", "<p></p>"),
                "workspace_id": workspace.id,
            },
        )

        if serializer.is_valid():
            serializer.save(is_global=True)
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            if serializer.data.get("parent_id"):
                nested_page_update.delay(
                    page_id=serializer.data["id"],
                    action=PageAction.SUB_PAGE,
                    slug=slug,
                    user_id=request.user.id,
                )
            page = self.get_queryset().filter(pk=serializer.data["id"]).first()
            if page.parent_id and page.parent.access == Page.PRIVATE_ACCESS:
                page.owned_by_id = page.parent.owned_by_id
                page.save()
            serializer = WorkspacePageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        try:
            page = Page.objects.get(pk=pk, workspace__slug=slug)

            if page.is_locked:
                return Response(
                    {"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            parent = request.data.get("parent_id", None)
            if parent:
                _ = Page.objects.get(pk=parent, workspace__slug=slug)

            if "parent_id" in request.data:
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.MOVED_INTERNALLY,
                    slug=slug,
                    user_id=request.user.id,
                    extra={
                        "old_parent_id": page.parent_id,
                        "new_parent_id": parent,
                        "access": request.data.get("access", page.access),
                    },
                )

            # Only update access if the page owner is the requesting  user
            if (
                page.access != request.data.get("access", page.access)
                and page.owned_by_id != request.user.id
            ):
                return Response(
                    {
                        "error": "Access cannot be updated since this page is owned by someone else"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = WorkspacePageDetailSerializer(
                page, data=request.data, partial=True
            )
            page_description = page.description_html
            if serializer.is_valid():
                serializer.save()
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.UNSHARED,
                    slug=slug,
                    user_id=request.user.id,
                )
                # capture the page transaction
                if request.data.get("description_html"):
                    page_transaction.delay(
                        new_value=request.data,
                        old_value=json.dumps(
                            {"description_html": page_description},
                            cls=DjangoJSONEncoder,
                        ),
                        page_id=pk,
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Page.DoesNotExist:
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def retrieve(self, request, slug, pk=None):
        page = self.get_queryset().filter(pk=pk).first()

        if not page:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if page.parent_id and (
            not check_workspace_feature_flag(
                feature_key=FeatureFlag.NESTED_PAGES,
                slug=slug,
                user_id=str(request.user.id),
            )
        ):
            return Response(
                {"error": "You are not authorized to access this page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        else:
            recent_visited_task.delay(
                slug=slug,
                entity_name="workspace_page",
                entity_identifier=pk,
                user_id=request.user.id,
            )
            return Response(
                WorkspacePageDetailSerializer(page).data, status=status.HTTP_200_OK
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def lock(self, request, slug, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        page.is_locked = True
        page.save()
        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.LOCKED,
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unlock(self, request, slug, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        page.is_locked = False
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNLOCKED,
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def access(self, request, slug, pk):
        access = request.data.get("access", 0)
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        # Only update access if the page owner is the requesting user
        if (
            page.access != request.data.get("access", page.access)
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.access = access
        page.save()
        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.MADE_PUBLIC if access == 0 else PageAction.MADE_PRIVATE,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def list(self, request, slug):
        search = request.query_params.get("search")
        page_type = request.query_params.get("type", "public")

        user_pages = PageUser.objects.filter(
            Q(user_id=self.request.user.id) | Q(page__owned_by_id=self.request.user.id),
            workspace__slug=self.kwargs.get("slug"),
        ).values_list("page_id", flat=True)

        sub_pages_count = (
            Page.objects.filter(parent=OuterRef("id"))
            .filter(archived_at__isnull=True)
            .order_by()
            .values("parent")
            .annotate(count=Count("id"))
            .values("count")[:1]
        )

        filters = Q()
        if search:
            filters &= Q(name__icontains=search)
        if page_type == "private":
            filters &= Q(access=1) & ~Q(id__in=user_pages)
        elif page_type == "archived":
            filters &= Q(archived_at__isnull=False)
        elif page_type == "public":
            if search:
                filters &= Q(access=0)
            else:
                filters &= Q(parent__isnull=True, access=0)
        elif page_type == "shared":
            filters &= Q(id__in=user_pages, parent__isnull=True, access=1)

        queryset = (
            self.get_queryset()
            .annotate(sub_pages_count=Subquery(sub_pages_count))
            .filter(filters)
        )

        pages = WorkspacePageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def archive(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        # only the owner or admin can archive the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.archived_at = datetime.now()
        page.save()

        deploy_board = DeployBoard.objects.filter(
            entity_name="page",
            entity_identifier=pk,
            workspace__slug=slug,
        ).first()

        if deploy_board:
            deploy_board.delete()
            nested_page_update.delay(
                page_id=str(pk),
                action=PageAction.UNPUBLISHED,
                slug=slug,
                user_id=request.user.id,
            )

        # archive the sub pages
        nested_page_update.delay(
            page_id=str(pk),
            action=PageAction.ARCHIVED,
            slug=slug,
            user_id=request.user.id,
        )

        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unarchive(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        # check if the parent page is still archived, if its archived then throw error.
        parent_page = Page.objects.filter(pk=page.parent_id).first()
        if parent_page and parent_page.archived_at:
            return Response(
                {"error": "The parent page should be restored first"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # only the owner or admin can un archive the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page.archived_at = None
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNARCHIVED,
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def destroy(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # only the owner or admin can delete the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.delete()
        # Delete the deploy board
        DeployBoard.objects.filter(
            entity_name="page", entity_identifier=pk, workspace__slug=slug
        ).delete()
        # Delete the page from user recent's visit
        UserRecentVisit.objects.filter(
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="workspace_page",
        ).delete(soft=False)

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.DELETED,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def sub_pages(self, request, slug, page_id):
        pages = Page.all_objects.filter(
            workspace__slug=slug, parent_id=page_id
        ).annotate(
            sub_pages_count=Page.objects.filter(parent=OuterRef("id"))
            .filter(archived_at__isnull=True)
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        serializer = WorkspacePageLiteSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def parent_pages(self, request, slug, page_id):
        page_ids = get_all_parent_ids(page_id)
        pages = Page.objects.filter(workspace__slug=slug, id__in=page_ids)

        # Convert queryset to a dictionary keyed by id
        page_map = {str(page.id): page for page in pages}

        # Rebuild ordered list based on page_ids
        ordered_pages = [page_map[str(pid)] for pid in page_ids if str(pid) in page_map]

        serializer = WorkspacePageLiteSerializer(ordered_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageDuplicateEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, pk):
        page = Page.objects.get(id=pk, workspace__slug=slug)

        # check for permission
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # update the descendants pages with the current page
        nested_page_update.delay(
            page_id=pk,
            action=PageAction.DUPLICATED,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePagesDescriptionViewSet(BaseViewSet):
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def retrieve(self, request, slug, pk):
        page = (
            Page.objects.filter(pk=pk, workspace__slug=slug)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .first()
        )
        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(
            stream_data(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if page.is_locked:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_LOCKED"],
                    "error_message": "PAGE_LOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_ARCHIVED"],
                    "error_message": "PAGE_ARCHIVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Serialize the existing instance
        existing_instance = json.dumps(
            {"description_html": page.description_html}, cls=DjangoJSONEncoder
        )

        # Get the base64 data from the request
        base64_data = request.data.get("description_binary")

        # If base64 data is provided
        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_value=request.data, old_value=existing_instance, page_id=pk
                )
            # Store the updated binary data
            page.name = request.data.get("name", page.name)
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.description = request.data.get("description")
            page.save()
            # Return a success response
            page_version.delay(
                page_id=page.id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})


class WorkspacePageVersionEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, page_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = PageVersion.objects.get(
                workspace__slug=slug, page_id=page_id, pk=pk
            )
            # Serialize the page version
            serializer = WorkspacePageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug, page_id=page_id
        )
        # Serialize the page versions
        serializer = WorkspacePageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageFavoriteEndpoint(BaseAPIView):
    model = UserFavorite

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        _ = UserFavorite.objects.create(
            entity_identifier=pk,
            entity_type="page",
            user=request.user,
            workspace_id=workspace.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def delete(self, request, slug, pk):
        page_favorite = UserFavorite.objects.get(
            project__isnull=True,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePageRestoreEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, page_id, pk):
        page_version = PageVersion.objects.get(pk=pk, page_id=page_id)

        # Get the latest sub pages data
        latest_sub_pages = Page.all_objects.filter(
            parent_id=page_id, workspace__slug=slug, deleted_at__isnull=True
        ).values_list("id", flat=True)
        latest_sub_pages = set(str(i) for i in latest_sub_pages)

        # Get the version's sub pages data
        version_sub_pages = page_version.sub_pages_data
        version_sub_page_ids = [
            str(sub_page["id"])
            for sub_page in version_sub_pages
            if sub_page["deleted_at"] is None
        ]

        # Find pages that need to be restored (in old version but deleted in latest)
        pages_to_restore = set(version_sub_page_ids) - set(latest_sub_pages)

        # Find pages that need to be deleted (in latest but not in old version)
        pages_to_delete = set(latest_sub_pages) - set(version_sub_page_ids)

        # get the datetime at which the page was deleted and restore the page at that time with their children
        pages_to_restore = Page.all_objects.filter(id__in=pages_to_restore)

        for page in pages_to_restore:
            # Restore the parent page first
            deleted_at_time = page.deleted_at
            page.deleted_at = None
            page.parent_id = page_id
            page.save()

            if deleted_at_time:
                # Get all descendant pages using the recursive function
                descendant_pages = Page.objects.raw(
                    """
                    WITH RECURSIVE descendants AS (
                        SELECT id FROM pages WHERE parent_id = %s AND deleted_at BETWEEN %s AND %s
                        UNION ALL
                        SELECT pages.id FROM pages, descendants 
                        WHERE pages.parent_id = descendants.id 
                        AND pages.deleted_at BETWEEN %s AND %s
                    )
                    SELECT id FROM descendants;
                    """,
                    [
                        page.id,
                        deleted_at_time,
                        deleted_at_time + timedelta(minutes=2),
                        deleted_at_time,
                        deleted_at_time + timedelta(minutes=2),
                    ],
                )

                # Get list of descendant page IDs
                descendant_page_ids = [str(row.id) for row in descendant_pages]

                # restore the descendant pages by bulk update
                Page.all_objects.filter(id__in=descendant_page_ids).update(
                    deleted_at=None, updated_at=timezone.now(), updated_by=request.user
                )
                # restore the corresponding version of the descendant pages
                PageVersion.all_objects.filter(
                    page_id__in=descendant_page_ids + [str(page.id)],
                    workspace__slug=slug,
                ).update(
                    deleted_at=None, updated_at=timezone.now(), updated_by=request.user
                )

        # delete the pages that need to be deleted
        if pages_to_delete:
            pages_to_delete_ids = list(pages_to_delete)

            # Get all nested children recursively using raw SQL (whose deleted at is null)
            nested_children = Page.objects.raw(
                """
                WITH RECURSIVE nested_children AS (
                    SELECT id, parent_id
                    FROM pages
                    WHERE parent_id = ANY(%s) AND deleted_at IS NULL

                    UNION

                    SELECT p.id, p.parent_id
                    FROM pages p
                    INNER JOIN nested_children nc ON p.parent_id = nc.id
                    WHERE p.deleted_at IS NULL
                )
                SELECT id FROM nested_children
                """,
                [pages_to_delete_ids],
            )

            nested_child_ids = [str(row.id) for row in nested_children]
            pages_to_delete_ids.extend(nested_child_ids)

            Page.objects.filter(id__in=pages_to_delete_ids).delete()

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.RESTORED,
            slug=slug,
            user_id=request.user.id,
            extra={
                "deleted_page_ids": [
                    str(deleted_page) for deleted_page in pages_to_delete
                ],
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
