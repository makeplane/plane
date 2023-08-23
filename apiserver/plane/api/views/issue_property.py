# Python imports
import uuid

# Django imports
from django.db.models import Q, F, Case, When, Value

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    IssuePropertySerializer,
    IssuePropertyValueSerializer,
    IssuePropertyReadSerializer,
)
from plane.db.models import (
    Workspace,
    IssueProperty,
    IssuePropertyValue,
    Project,
)
from plane.api.permissions import WorkSpaceAdminPermission


def is_valid_uuid(uuid_string):
    try:
        uuid_obj = uuid.UUID(uuid_string)
        return str(uuid_obj) == uuid_string
    except ValueError:
        return False


class IssuePropertyViewSet(BaseViewSet):
    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .prefetch_related("children")
        )

    def list(self, request, slug):
        try:
            project_id = request.GET.get("project", False)
            issue_properties = self.get_queryset().filter(
                parent__isnull=True, is_shared=True
            )

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

    def create(self, request, slug, project_id, issue_id):
        try:
            request_data = request.data.get("issue_properties", [])

            project = Project.objects.get(pk=project_id)
            workspace_id = project.workspace_id

            # Get all the issue_properties
            issue_properties = IssueProperty.objects.filter(
                pk__in=[prop for prop in request_data if is_valid_uuid(prop)],
                workspace__slug=slug,
            )

            bulk_issue_props = []
            for issue_property in issue_properties:
                # get the requested property
                if issue_property.type == "entity":
                    values_uuid = request_data.get(str(issue_property.id))
                    values = None
                else:
                    values = request_data.get(str(issue_property.id))
                    values_uuid = None
                if issue_property.is_multi:
                    if values is not None:
                        for value in values.split(","):
                            bulk_issue_props.append(
                                IssuePropertyValue(
                                    values=value,
                                    values_uuid=None,
                                    issue_property=issue_property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )
                    else:
                        for value in values_uuid.split(","):
                            bulk_issue_props.append(
                                IssuePropertyValue(
                                    values=None,
                                    values_uuid=value,
                                    issue_property=issue_property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )
                else:
                    bulk_issue_props.append(
                        IssuePropertyValue(
                            values=values,
                            values_uuid=values_uuid,
                            issue_property=issue_property,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            issue_id=issue_id,
                        )
                    )

            issue_property_values = IssuePropertyValue.objects.bulk_create(
                bulk_issue_props, batch_size=100, ignore_conflicts=True
            )
            serilaizer = IssuePropertyValueSerializer(issue_property_values, many=True)
            return Response(serilaizer.data, status=status.HTTP_201_CREATED)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project Does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def list(self, request, slug, project_id, issue_id):
        try:
            issue_properties = (
                IssueProperty.objects.filter(
                    workspace__slug=slug,
                    property_values__project_id=project_id,
                )
                .prefetch_related("children")
                .prefetch_related("property_values")
                .distinct()
            )
            serializer = IssuePropertyReadSerializer(issue_properties, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
