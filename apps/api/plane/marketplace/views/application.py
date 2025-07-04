# Standard library imports
from typing import Optional

# Third-party imports
from django.db.models import QuerySet
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.request import Request

# Local imports
from plane.authentication.models import Application, ApplicationCategory
from plane.ee.views.base import BaseAPIView
from ..serializers import (
    PublishedApplicationSerializer,
    ApplicationCategorySerializer,
    ApplicationTemplateMetaSerializer,
)


class PublishedApplicationEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = Application
    serializer_class = PublishedApplicationSerializer

    def get_queryset(self) -> QuerySet[Application]:
        return (
            self.model.objects.filter(published_at__isnull=False)
            .select_related("logo_asset")
            .prefetch_related("attachments", "categories")
        )

    def get(self, request: Request, pk: Optional[str] = None) -> Response:
        if pk:
            application: Application = self.get_queryset().get(id=pk)
            serialised_application = PublishedApplicationSerializer(application)
            return Response(serialised_application.data, status=status.HTTP_200_OK)

        applications: QuerySet[Application] = self.get_queryset()
        serialised_applications = PublishedApplicationSerializer(
            applications, many=True
        )
        return Response(serialised_applications.data, status=status.HTTP_200_OK)


class PublishedApplicationBySlugEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = Application
    serializer_class = PublishedApplicationSerializer

    def get_queryset(self) -> QuerySet[Application]:
        return (
            self.model.objects.filter(published_at__isnull=False)
            .select_related("logo_asset")
            .prefetch_related("attachments", "categories")
        )

    def get(self, request: Request, slug: Optional[str] = None) -> Response:
        application: Application = self.get_queryset().get(slug=slug)
        serialised_application = PublishedApplicationSerializer(application)
        return Response(serialised_application.data, status=status.HTTP_200_OK)


class ApplicationCategoryEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = ApplicationCategory
    serializer_class = ApplicationCategorySerializer

    def get(self, request: Request) -> Response:
        application_categories: QuerySet[ApplicationCategory] = (
            self.model.objects.filter(is_active=True)
        )
        serialised_application_categories = self.serializer_class(
            application_categories, many=True
        )
        return Response(
            serialised_application_categories.data, status=status.HTTP_200_OK
        )


class PublishedApplicationMetaEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = Application
    serializer_class = ApplicationTemplateMetaSerializer

    def get_queryset(self) -> QuerySet[Application]:
        queryset = self.model.objects.filter(published_at__isnull=False)

        return queryset

    def get(self, request: Request, slug: str) -> Response:
        application = self.get_queryset().get(slug=slug)
        serialised_application = self.serializer_class(application)
        return Response(serialised_application.data, status=status.HTTP_200_OK)
