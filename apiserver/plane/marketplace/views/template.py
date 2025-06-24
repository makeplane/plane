import uuid

from django.db.models import QuerySet

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import filters
from plane.ee.models import TemplateCategory, Template
from plane.ee.views.base import BaseAPIView
from django_filters.rest_framework.filterset import FilterSet
from ..serializers import (
    TemplateCategorySerializer,
    PublishedTemplateSerializer,
    PublishedTemplateDetailSerializer,
    PublishedTemplateMetaSerializer,
)


class TemplateCategoryEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = TemplateCategory
    serializer_class = TemplateCategorySerializer

    def get(self, request: Request) -> Response:
        template_categories: QuerySet[TemplateCategory] = self.model.objects.filter(
            is_active=True
        )
        serialised_template_categories = self.serializer_class(
            template_categories, many=True
        )
        return Response(serialised_template_categories.data, status=status.HTTP_200_OK)


class PublishedTemplateFilter(FilterSet):
    category = filters.CharFilter(field_name="categories__name")

    class Meta:
        model = Template
        fields = ["template_type", "is_verified", "company_name", "category"]


class PublishedTemplateEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = Template
    serializer_class = PublishedTemplateSerializer
    detail_serializer_class = PublishedTemplateDetailSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter)
    filterset_class = PublishedTemplateFilter
    search_fields = ["name", "description_stripped", "company_name", "categories__name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self) -> QuerySet[Template]:
        queryset = self.model.objects.filter(
            is_published=True,
            template_type=Template.TemplateType.PROJECT,
        ).prefetch_related("attachments", "categories")

        # Filter by category name if provided
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(categories__name=category)
        return queryset

    def get(self, request: Request, short_id: str | None = None) -> Response:
        order_by = request.query_params.get("order_by", "-created_at")
        queryset = self.get_queryset()
        if order_by.lstrip("-") in self.ordering_fields:
            queryset = queryset.order_by(order_by)

        filtered_queryset = self.filter_queryset(queryset)

        if short_id:
            template = filtered_queryset.get(short_id=short_id)
            serialised_template = self.detail_serializer_class(template)
            return Response(serialised_template.data, status=status.HTTP_200_OK)

        return self.paginate(
            request=request,
            queryset=filtered_queryset,
            on_results=lambda templates: self.serializer_class(
                templates, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class PublishedTemplateMetaEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    model = Template
    serializer_class = PublishedTemplateMetaSerializer

    def get_queryset(self) -> QuerySet[Template]:
        queryset = self.model.objects.filter(
            is_published=True,
            template_type=Template.TemplateType.PROJECT,
        )
        return queryset

    def get(self, request: Request, short_id: str) -> Response:
        template = self.get_queryset().get(short_id=short_id)
        serialised_template = self.serializer_class(template)
        return Response(serialised_template.data, status=status.HTTP_200_OK)
