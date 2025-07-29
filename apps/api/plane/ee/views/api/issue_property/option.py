# Django imports
from django.db import models

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project
from plane.ee.models import IssueProperty, IssuePropertyOption
from plane.ee.serializers.api import IssuePropertyOptionAPISerializer
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi.decorators import issue_property_option_docs


class IssuePropertyOptionListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list` and `create` actions related to issue property options.
    """

    model = IssuePropertyOption
    serializer_class = IssuePropertyOptionAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_property_option"

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_option_docs(
        operation_id="list_issue_property_options",
        summary="List issue property options",
        description="List issue property options",
        responses={
            200: OpenApiResponse(
                description="Issue property options",
                response=IssuePropertyOptionAPISerializer,
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    def get(self, request, slug, project_id, property_id):
        # list of issue properties
        issue_properties = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            property_id=property_id,
            property__issue_type__is_epic=False,
        )
        serializer = self.serializer_class(issue_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create issue property option
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_option_docs(
        operation_id="create_issue_property_option",
        summary="Create a new issue property option",
        description="Create a new issue property option",
        request=OpenApiRequest(
            request=IssuePropertyOptionAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyOptionAPISerializer",
                    value={
                        "name": "High",
                        "description": "The highest priority",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for creating an issue property option",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Issue property option created",
                response=IssuePropertyOptionAPISerializer,
            ),
            400: OpenApiResponse(
                description="Issue Property type is not OPTION",
            ),
            409: OpenApiResponse(
                description="Issue Property with the same external id and external source already exists",
            ),
        },
    )
    def post(self, request, slug, project_id, property_id):
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id)
        issue_property = IssueProperty.objects.get(pk=property_id)

        # crating the issue property options if the property type is OPTION
        if issue_property.property_type == "OPTION":
            # check if ant external id and external source is provided
            external_id = request.data.get("external_id")
            external_existing_property_option = self.model.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                property_id=property_id,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
                property__issue_type__is_epic=False,
            )
            if (
                external_id
                and request.data.get("external_source")
                and external_existing_property_option.exists()
            ):
                issue_property_option = self.model.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    property_id=property_id,
                    external_source=request.data.get("external_source"),
                    external_id=external_id,
                    property__issue_type__is_epic=False,
                ).first()
                return Response(
                    {
                        "error": "Issue Property with the same external id and external source already exists",
                        "id": str(issue_property_option.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            # validate if ant default property option is already available
            default_option_exists = self.model.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                property_id=property_id,
                is_default=True,
                property__issue_type__is_epic=False,
            )
            if (
                default_option_exists.exists()
                and "is_default" in request.data
                and request.data["is_default"]
            ):
                return Response(
                    {"error": "Default option already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # getting the last sort order from the database
            last_sort_order = self.model.objects.filter(
                project=project,
                property=issue_property,
                property__issue_type__is_epic=False,
            ).aggregate(largest=models.Max("sort_order"))["largest"]

            # Set the sort order for the new option
            if last_sort_order is not None:
                sort_order = last_sort_order + 10000
            else:
                sort_order = 10000

            data = request.data
            property_option_serializer = self.serializer_class(data=data)
            property_option_serializer.is_valid(raise_exception=True)
            property_option_serializer.save(
                workspace=workspace,
                project=project,
                property=issue_property,
                sort_order=sort_order,
            )
            # getting the issue property
            property_option = self.model.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                property_id=property_id,
                pk=property_option_serializer.data["id"],
                property__issue_type__is_epic=False,
            )
            serializer = self.serializer_class(property_option)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"error": "Issue Property type is not OPTION"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class IssuePropertyOptionDetailAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue property options.

    """

    model = IssuePropertyOption
    serializer_class = IssuePropertyOptionAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_property_option"

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_option_docs(
        operation_id="retrieve_issue_property_option",
        summary="Get issue property option by id",
        description="Get issue property option by id",
        responses={
            200: OpenApiResponse(
                description="Issue property options",
                response=IssuePropertyOptionAPISerializer,
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    def get(self, request, slug, project_id, property_id, option_id):

        # getting issue property by id
        issue_property = self.model.objects.get(
            workspace__slug=self.workspace_slug,
            project_id=self.project_id,
            property_id=self.property_id,
            pk=self.option_id,
            property__issue_type__is_epic=False,
        )
        serializer = self.serializer_class(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # update issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_option_docs(
        operation_id="update_issue_property_option",
        summary="Update an issue property option",
        description="Update an issue property option",
        request=OpenApiRequest(
            request=IssuePropertyOptionAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyOptionAPISerializer",
                    value={
                        "name": "High",
                        "description": "The highest priority",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for updating an issue property option",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Issue property option updated",
                response=IssuePropertyOptionAPISerializer,
            ),
            400: OpenApiResponse(
                description="Default option already exists",
            ),
            404: OpenApiResponse(description="Issue property option not found"),
        },
    )
    def patch(self, request, slug, project_id, property_id, option_id):
        # validate if ant default property option is already available
        default_option_exists = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            property_id=property_id,
            is_default=True,
            property__issue_type__is_epic=False,
        )
        if (
            default_option_exists.exists()
            and "is_default" in request.data
            and request.data["is_default"]
        ):
            return Response(
                {"error": "Default option already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_option = self.model.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            property_id=property_id,
            pk=option_id,
            property__issue_type__is_epic=False,
        )

        data = request.data
        property_option_serializer = self.serializer_class(
            property_option, data=data, partial=True
        )
        property_option_serializer.is_valid(raise_exception=True)
        property_option_serializer.save()

        return Response(property_option_serializer.data, status=status.HTTP_200_OK)

    # delete issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_option_docs(
        operation_id="delete_issue_property_option",
        summary="Delete an issue property option",
        description="Delete an issue property option",
        responses={
            204: OpenApiResponse(description="Issue property option deleted"),
            404: OpenApiResponse(description="Issue property option not found"),
        },
    )
    def delete(self, request, slug, project_id, property_id, option_id):
        property_option = self.model.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            property_id=property_id,
            pk=option_id,
            property__issue_type__is_epic=False,
        )
        property_option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
