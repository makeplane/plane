# Python imports
import json
import base64
from datetime import datetime
from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db import connection
from django.db.models import Exists, OuterRef, Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.http import StreamingHttpResponse

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission
from plane.app.serializers import (
    PageLogSerializer,
    PageSerializer,
    SubPageSerializer,
    PageDetailSerializer,
)
from plane.db.models import (
    Page,
    PageLog,
    UserFavorite,
    ProjectMember,
)

# Module imports
from ..base import BaseAPIView, BaseViewSet

from plane.bgtasks.page_transaction_task import page_transaction


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


class PageViewSet(BaseViewSet):
    serializer_class = PageSerializer
    model = Page
    permission_classes = [
        ProjectEntityPermission,
    ]
    search_fields = [
        "name",
    ]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(parent__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .distinct()
        )

    def create(self, request, slug, project_id):
        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
                "description_html": request.data.get(
                    "description_html", "<p></p>"
                ),
            },
        )

        if serializer.is_valid():
            serializer.save()
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            page = Page.objects.get(pk=serializer.data["id"])
            serializer = PageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, pk):
        try:
            page = Page.objects.get(
                pk=pk, workspace__slug=slug, project_id=project_id
            )

            if page.is_locked:
                return Response(
                    {"error": "Page is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            parent = request.data.get("parent", None)
            if parent:
                _ = Page.objects.get(
                    pk=parent, workspace__slug=slug, project_id=project_id
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

            serializer = PageDetailSerializer(
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

    def retrieve(self, request, slug, project_id, pk=None):
        page = self.get_queryset().filter(pk=pk).first()
        if page is None:
            return Response(
                {"error": "Page not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        else:
            return Response(
                PageDetailSerializer(page).data, status=status.HTTP_200_OK
            )

    def lock(self, request, slug, project_id, pk):
        page = Page.objects.filter(
            pk=pk, workspace__slug=slug, project_id=project_id
        ).first()

        page.is_locked = True
        page.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, project_id, pk):
        page = Page.objects.filter(
            pk=pk, workspace__slug=slug, project_id=project_id
        ).first()

        page.is_locked = False
        page.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        pages = PageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    def archive(self, request, slug, project_id, pk):
        page = Page.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )

        # only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
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

    def unarchive(self, request, slug, project_id, pk):
        page = Page.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )

        # only the owner or admin can un archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
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

    def destroy(self, request, slug, project_id, pk):
        page = Page.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )

        # only the owner and admin can delete the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
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
        _ = Page.objects.filter(
            parent_id=pk, project_id=project_id, workspace__slug=slug
        ).update(parent=None)

        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageFavoriteViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    model = UserFavorite

    def create(self, request, slug, project_id, pk):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            entity_identifier=pk,
            entity_type="page",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, slug, project_id, pk):
        page_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        )
        page_favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLogEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    serializer_class = PageLogSerializer
    model = PageLog

    def post(self, request, slug, project_id, page_id):
        serializer = PageLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, page_id=page_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, page_id, transaction):
        page_transaction = PageLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            page_id=page_id,
            transaction=transaction,
        )
        serializer = PageLogSerializer(
            page_transaction, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, page_id, transaction):
        transaction = PageLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            page_id=page_id,
            transaction=transaction,
        )
        # Delete the transaction object
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubPagesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @method_decorator(gzip_page)
    def get(self, request, slug, project_id, page_id):
        pages = (
            PageLog.objects.filter(
                page_id=page_id,
                project_id=project_id,
                workspace__slug=slug,
                entity_name__in=["forward_link", "back_link"],
            )
            .select_related("project")
            .select_related("workspace")
        )
        return Response(
            SubPageSerializer(pages, many=True).data, status=status.HTTP_200_OK
        )


class PagesDescriptionViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def retrieve(self, request, slug, project_id, pk):
        page = Page.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
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

    def partial_update(self, request, slug, project_id, pk):
        page = Page.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )

        base64_data = request.data.get("description_binary")

        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)

            # Store the updated binary data
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.save()
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})
