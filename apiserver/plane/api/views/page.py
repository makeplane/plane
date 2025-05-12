# Python imports
import json
from .base import BaseAPIView

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.bgtasks.page_transaction_task import page_transaction
from plane.app.serializers import PageSerializer, PageDetailSerializer
from plane.db.models import Page, PageLog
from plane.app.permissions import ProjectEntityPermission


class PageAPIEndpoint(BaseAPIView):
    serializer_class = PageSerializer
    model = Page
    search_fields = ["name"]
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return Page.objects.filter(
            Q(owned_by=self.request.user) | Q(access=0),
            workspace__slug=self.kwargs.get("slug"),
            projects__project_projectmember__member=self.request.user,
            projects__project_projectmember__is_active=True,
            projects__archived_at__isnull=True,
            parent__isnull=True,
        )

    def get(self, request, slug, project_id, pk=None):
        external_id = request.GET.get("external_id")
        external_source = request.GET.get("external_source")

        if external_id and external_source:
            page = Page.objects.get(
                external_id=external_id,
                external_source=external_source,
                workspace__slug=slug,
                project_id=project_id,
            )

            return Response(PageDetailSerializer(page).data, status=status.HTTP_200_OK)

        if pk:
            page = self.get_queryset().filter(pk=pk).first()
            if page is None:
                return Response(
                    {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
                )
            else:
                issue_ids = PageLog.objects.filter(
                    page_id=pk, entity_name="issue"
                ).values_list("entity_identifier", flat=True)
                data = PageDetailSerializer(page).data
                data["issue_ids"] = issue_ids
                return Response(data, status=status.HTTP_200_OK)

        pages = self.get_queryset().filter(projects__id=project_id)

        # Serialize the list of pages
        serializer = PageDetailSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id):
        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
                "description": request.data.get("description", {}),
                "description_binary": request.data.get("description_binary", None),
                "description_html": request.data.get("description_html", "<p></p>"),
            },
        )

        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                page = Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_id=request.data.get("external_id"),
                    external_source=request.data.get("external_source"),
                ).first()
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(page.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            serializer.save()
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            page = self.get_queryset().get(pk=serializer.data["id"])
            serializer = PageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
