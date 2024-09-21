# Python imports
import json
import base64
from datetime import datetime
from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db import connection
from django.db.models import Exists, OuterRef, Q
from django.http import StreamingHttpResponse

# Third party imports
from rest_framework import status
from rest_framework.response import Response


# Module imports
from plane.app.permissions import WorkspaceEntityPermission
from plane.ee.serializers import (
    WorkspacePageSerializer,
    WorkspacePageDetailSerializer,
    WorkspacePageVersionSerializer,
    WorkspacePageVersionDetailSerializer,
)
from plane.db.models import (
    Page,
    UserFavorite,
    ProjectMember,
    Workspace,
    DeployBoard,
    PageVersion,
)

from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.bgtasks.page_version_task import page_version
from plane.bgtasks.page_transaction_task import page_transaction
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.error_codes import ERROR_CODES


def unarchive_archive_page_and_descendants(page_id, archived_at):
    # Your SQL query
    sql = """
    WITH RECURSIVE descendants AS (
        SELECT id FROM pages WHERE id = %s
        UNION ALL
        SELECT pages.id FROM pages, descendants WHERE pages.parent_id = descendants.id
    )
    UPDATE pages SET archived_at = %s WHERE id IN (SELECT id FROM descendants);
    """

    # Execute the SQL query
    with connection.cursor() as cursor:
        cursor.execute(sql, [page_id, archived_at])


class WorkspacePageViewSet(BaseViewSet):
    serializer_class = WorkspacePageSerializer
    model = Page
    permission_classes = [
        WorkspaceEntityPermission,
    ]
    search_fields = [
        "name",
    ]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(is_global=True)
            .filter(parent__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .prefetch_related("projects")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="page",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
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
                "description_html": request.data.get(
                    "description_html", "<p></p>"
                ),
                "workspace_id": workspace.id,
            },
        )

        if serializer.is_valid():
            serializer.save(is_global=True)
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            page = self.get_queryset().filter(pk=serializer.data["id"]).first()
            serializer = WorkspacePageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        try:
            page = Page.objects.get(
                pk=pk,
                workspace__slug=slug,
            )

            if page.is_locked:
                return Response(
                    {"error": "Page is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            parent = request.data.get("parent", None)
            if parent:
                _ = Page.objects.get(
                    pk=parent,
                    workspace__slug=slug,
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
                # capture the page transaction
                if request.data.get("description_html"):
                    page_transaction.delay(
                        new_value=request.data,
                        old_value=json.dumps(
                            {
                                "description_html": page_description,
                            },
                            cls=DjangoJSONEncoder,
                        ),
                        page_id=pk,
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
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
        if page is None:
            return Response(
                {"error": "Page not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        else:
            return Response(
                WorkspacePageDetailSerializer(page).data,
                status=status.HTTP_200_OK,
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def lock(self, request, slug, pk):
        page = Page.objects.filter(
            pk=pk,
            workspace__slug=slug,
        ).first()

        page.is_locked = True
        page.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unlock(self, request, slug, pk):
        page = Page.objects.filter(
            pk=pk,
            workspace__slug=slug,
        ).first()

        page.is_locked = False
        page.save()

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
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def list(self, request, slug):
        queryset = self.get_queryset()
        pages = WorkspacePageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def archive(self, request, slug, pk):
        page = Page.objects.get(
            pk=pk,
            workspace__slug=slug,
        )

        # only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                role__lte=15,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unarchive_archive_page_and_descendants(pk, datetime.now())

        return Response(
            {"archived_at": str(datetime.now())},
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unarchive(self, request, slug, pk):
        page = Page.objects.get(
            pk=pk,
            workspace__slug=slug,
        )

        # only the owner or admin can un archive the page
        if (
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                role__lte=15,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # if parent page is archived then the page will be un archived breaking the hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(pk, None)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def destroy(self, request, slug, pk):
        page = Page.objects.get(
            pk=pk,
            workspace__slug=slug,
        )

        # only the owner and admin can delete the page
        if (
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                role__gt=20,
            ).exists()
            or request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner and admin can delete the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # remove parent from all the children
        _ = Page.objects.filter(parent_id=pk, workspace__slug=slug).update(
            parent=None
        )

        page.delete()
        # Delete the deploy board
        DeployBoard.objects.filter(
            entity_name="page",
            entity_identifier=pk,
            workspace__slug=slug,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePagesDescriptionViewSet(BaseViewSet):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def retrieve(self, request, slug, pk):
        page = Page.objects.get(
            pk=pk,
            workspace__slug=slug,
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
        response["Content-Disposition"] = (
            'attachment; filename="page_description.bin"'
        )
        return response

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

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
            {
                "description_html": page.description_html,
            },
            cls=DjangoJSONEncoder,
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
                    new_value=request.data,
                    old_value=existing_instance,
                    page_id=pk,
                )
            # Store the updated binary data
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
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
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, page_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = PageVersion.objects.get(
                workspace__slug=slug,
                page_id=page_id,
                pk=pk,
            )
            # Serialize the page version
            serializer = WorkspacePageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug,
            page_id=page_id,
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
