# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseViewSet
from plane.api.serializers import (
    IssuePropertySerializer,
    IssuePropertyAttributeSerializer,
    IssuePropertyValueSerializer,
)
from plane.db.models import IssueProperty, IssuePropertyAttribute, IssuePropertyValue
from plane.api.permissions import ProjectEntityPermission


class IssuePropertyViewSet(BaseViewSet):
    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
        )


class IssuePropertyAttributeViewSet(BaseViewSet):
    serializer_class = IssuePropertyAttributeSerializer
    model = IssuePropertyAttribute
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
        )


class IssuePropertyValueViewSet(BaseViewSet):
    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )
