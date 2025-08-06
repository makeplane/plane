# Python imports
import random

# Django imports
from django.db import transaction
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project, IssueType, ProjectIssueType, Issue
from plane.api.serializers import IssueTypeAPISerializer, ProjectIssueTypeAPISerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.helpers import get_boolean_value
from plane.utils.openapi.decorators import issue_type_docs


class IssueTypeListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list` and `create` actions related to issue types.
    """

    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_type"

    logo_icons = [
        "Activity",
        "AlertCircle",
        "Archive",
        "Bell",
        "Calendar",
        "Camera",
        "Check",
        "Clock",
        "Code",
        "Database",
        "Download",
        "Edit",
        "File",
        "Folder",
        "Globe",
        "Heart",
        "Home",
        "Mail",
        "Search",
        "User",
    ]

    logo_backgrounds = [
        "#EF5974",
        "#FF7474",
        "#FC964D",
        "#1FA191",
        "#6DBCF5",
        "#748AFF",
        "#4C49F8",
        "#5D407A",
        "#999AA0",
    ]

    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_type"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def type_id(self):
        return self.kwargs.get("type_id", None)

    def generate_logo_prop(self):
        return {
            "in_use": "icon",
            "icon": {
                "name": self.logo_icons[random.randint(0, len(self.logo_icons) - 1)],
                "background_color": self.logo_backgrounds[
                    random.randint(0, len(self.logo_backgrounds) - 1)
                ],
            },
        }

    def get_queryset(self):
        return self.model.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_issue_types__project_id=self.kwargs.get("project_id"),
            is_epic=False,
        )

    # list issue types and get issue type by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_type_docs(
        operation_id="list_issue_types",
        description="List all issue types for a project",
        summary="List issue types",
        responses={
            200: OpenApiResponse(
                description="Issue types", response=IssueTypeAPISerializer
            ),
            404: OpenApiResponse(description="Issue type not found"),
        },
    )
    def get(self, request, slug, project_id):
        # list of issue types
        issue_types = self.get_queryset()
        serializer = self.serializer_class(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create issue type
    @issue_type_docs(
        operation_id="create_issue_type",
        description="Create a new issue type for a project",
        summary="Create a new issue type",
        request=OpenApiRequest(
            request=IssueTypeAPISerializer,
            examples=[
                OpenApiExample(
                    "IssueTypeAPISerializer",
                    value={
                        "name": "Bug",
                        "description": "A bug is a problem with the software that prevents it from working as expected.",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for creating an issue type",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Issue type created", response=IssueTypeAPISerializer
            ),
            409: OpenApiResponse(
                description="Issue type with the same external id and external source already exists"
            ),
        },
    )
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id):
        with transaction.atomic():
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id)

            # check if issue type with the same external id and external source already exists
            # return the issue type id if it exists
            external_id = request.data.get("external_id")
            external_source = request.data.get("external_source")
            external_existing_issue_type = (
                self.get_queryset()
                .filter(external_id=external_id, external_source=external_source)
                .first()
            )

            if external_id and external_source and external_existing_issue_type:
                return Response(
                    {
                        "error": "Work item type with the same external id and external source already exists",
                        "id": str(external_existing_issue_type.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            # creating issue type
            issue_type_serializer = self.serializer_class(data=request.data)
            issue_type_serializer.is_valid(raise_exception=True)
            issue_type_serializer.save(
                workspace=workspace, logo_props=self.generate_logo_prop()
            )

            # adding the issue type to the project
            project_issue_type_serializer = ProjectIssueTypeAPISerializer(
                data={"issue_type": issue_type_serializer.data["id"]}
            )
            project_issue_type_serializer.is_valid(raise_exception=True)
            project_issue_type_serializer.save(project=project, level=0)

            # getting the issue type
            issue_type = self.get_queryset().get(pk=issue_type_serializer.data["id"])
            serializer = self.serializer_class(issue_type)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class IssueTypeDetailAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue types.

    """

    logo_icons = [
        "Activity",
        "AlertCircle",
        "Archive",
        "Bell",
        "Calendar",
        "Camera",
        "Check",
        "Clock",
        "Code",
        "Database",
        "Download",
        "Edit",
        "File",
        "Folder",
        "Globe",
        "Heart",
        "Home",
        "Mail",
        "Search",
        "User",
    ]

    logo_backgrounds = [
        "#EF5974",
        "#FF7474",
        "#FC964D",
        "#1FA191",
        "#6DBCF5",
        "#748AFF",
        "#4C49F8",
        "#5D407A",
        "#999AA0",
    ]

    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_type"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def type_id(self):
        return self.kwargs.get("type_id", None)

    def generate_logo_prop(self):
        return {
            "in_use": "icon",
            "icon": {
                "name": self.logo_icons[random.randint(0, len(self.logo_icons) - 1)],
                "background_color": self.logo_backgrounds[
                    random.randint(0, len(self.logo_backgrounds) - 1)
                ],
            },
        }

    def get_queryset(self):
        return self.model.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_issue_types__project_id=self.kwargs.get("project_id"),
            is_epic=False,
        )

    # list issue types and get issue type by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_type_docs(
        operation_id="retrieve_issue_type",
        summary="Retrieve an issue type by id",
        description="Retrieve an issue type by id",
        responses={
            200: OpenApiResponse(
                description="Issue types", response=IssueTypeAPISerializer
            ),
            404: OpenApiResponse(description="Issue type not found"),
        },
    )
    def get(self, request, slug, project_id, type_id):
        issue_type = self.get_queryset().get(pk=type_id)
        issue_type = self.get_queryset().annotate(
            project_ids=Coalesce(
                Subquery(
                    ProjectIssueType.objects.filter(
                        issue_type=OuterRef("pk"), workspace__slug=slug
                    )
                    .values("issue_type")
                    .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                    .values("project_ids")
                ),
                [],
            )
        )
        serializer = self.serializer_class(issue_type, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # update issue type by id
    @issue_type_docs(
        operation_id="update_issue_type",
        summary="Update an issue type",
        description="Update an issue type",
        request=OpenApiRequest(
            request=IssueTypeAPISerializer,
            examples=[
                OpenApiExample(
                    "IssueTypeAPISerializer",
                    value={
                        "name": "Bug",
                        "description": "A bug is a problem with the software that prevents it from working as expected.",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for updating an issue type",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Issue type updated", response=IssueTypeAPISerializer
            ),
            409: OpenApiResponse(
                description="Issue type with the same external id and external source already exists"
            ),
        },
    )
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def patch(self, request, slug, project_id, type_id):
        with transaction.atomic():
            issue_type = self.get_queryset().get(pk=type_id)
            data = request.data

            # check if the issue type is the default issue type and if the is_active field is being updated to false
            if (
                issue_type.is_default
                and get_boolean_value(request.data.get("is_active")) is False
            ):
                return Response(
                    {
                        "error": "Default work item type's is_active field cannot be false"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            issue_type_serializer = self.serializer_class(
                issue_type, data=data, partial=True
            )
            issue_type_serializer.is_valid(raise_exception=True)

            # check if issue type with the same external id and external source already exists
            external_id = request.data.get("external_id")
            external_source = request.data.get("external_source")
            external_existing_issue_type = (
                self.get_queryset()
                .filter(external_id=external_id, external_source=external_source)
                .first()
            )

            # don't allow updating the external id if it already exists in another issue type
            # checking if the external id is being updated to a different issue type
            if external_id and external_existing_issue_type.id != issue_type.id:
                return Response(
                    {
                        "error": "Work item type with the same external id and external source already exists",
                        "id": str(issue_type.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            issue_type_serializer.save()
            return Response(issue_type_serializer.data, status=status.HTTP_200_OK)

    # delete issue type by id
    @issue_type_docs(
        operation_id="delete_issue_type",
        summary="Delete an issue type",
        description="Delete an issue type",
        responses={
            204: OpenApiResponse(description="Issue type deleted"),
            400: OpenApiResponse(
                description="Default work item type cannot be deleted"
            ),
        },
    )
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def delete(self, request, slug, project_id, type_id):
        issue_type = self.get_queryset().get(pk=type_id)

        # check if the issue type is the default issue type
        if issue_type.is_default:
            return Response(
                {"error": "Default work item type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check if the issue type is being used in any issues
        if Issue.objects.filter(project_id=project_id, type_id=type_id).exists():
            return Response(
                {"error": "Work item type with existing issues cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
