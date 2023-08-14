# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseViewSet
from plane.api.serializers import (
    CustomPropertySerializer,
    CustomPropertyAttributeSerializer,
    CustomPropertyValueSerializer,
)
from plane.db.models import CustomProperty, CustomPropertyAttribute, CustomPropertyValue
from plane.api.permissions import ProjectEntityPermission


class CustomPropertyViewSet(BaseViewSet):
    serializer_class = CustomPropertySerializer
    model = CustomProperty
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
        )


class CustomPropertyAttributeViewSet(BaseViewSet):
    serializer_class = CustomPropertyAttributeSerializer
    model = CustomPropertyAttribute
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
        )


class CustomPropertyValueViewSet(BaseViewSet):
    serializer_class = CustomPropertyValueSerializer
    model = CustomPropertyValue

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )
