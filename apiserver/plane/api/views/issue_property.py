# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    IssuePropertySerializer,
    IssuePropertyValueSerializer,
)
from plane.db.models import (
    Workspace,
    IssueProperty,
    IssuePropertyValue,
)
from plane.api.permissions import WorkSpaceAdminPermission


class IssuePropertyViewSet(BaseViewSet):
    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return super().get_queryset().filter(
            workspace__slug=self.kwargs.get("slug")
        ).prefetch_related("children")

    def list(self, request, slug):
        try:
            project_id = request.GET.get("project", False)
            issue_properties = self.get_queryset().filter(parent__isnull=True, shared=True)

            if project_id:
                issue_properties = issue_properties.filter(project_id=project_id)

            serializer = IssuePropertySerializer(issue_properties, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = IssuePropertySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssuePropertyValueViewSet(BaseViewSet):
    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
            issue_property_id=self.kwargs.get("issue_property_id"),
        )


    def create(self, request, slug, issue_id):
        try:
            requested_issue_properties = request.data.get("issue_properties", [])

            # Get all the issue_properties
            issue_property_ids = [issue_property.get("property_id") for issue_property in requested_issue_properties]
            issue_properties = IssueProperty.objects.filter(pk__in=issue_property_ids)

            for issue_property in issue_properties:
                # get the requested property
                requested_properties = [requested_issue_property for requested_issue_property in requested_issue_properties if str(requested_issue_property.get(""))]
                # text

                # number

                # checkbox

                # select

                # Multi-Select

                # Date

                # timestamp

                # relation

                # files

                # url

                # email

                pass

            return Response(status=status.HTTP_201_CREATED)            
        except Exception as e:
            capture_exception(e)
            return Response({"error": "Something went wrong please try again later"}, status=status.HTTP_400_BAD_REQUEST)


