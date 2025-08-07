# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project, IssueType
from plane.ee.models import IssueProperty, PropertyTypeEnum, RelationTypeEnum
from plane.ee.serializers.api import IssuePropertyAPISerializer
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi.decorators import issue_property_docs


class IssuePropertyListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list` and `create` actions related to issue type properties.
    """

    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_property"

    type_logo_props = {
        PropertyTypeEnum.TEXT: {
            "in_use": "icon",
            "icon": {"name": "AlignLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DECIMAL: {
            "in_use": "icon",
            "icon": {"name": "Hash", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.OPTION: {
            "in_use": "icon",
            "icon": {"name": "CircleChevronDown", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.BOOLEAN: {
            "in_use": "icon",
            "icon": {"name": "ToggleLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DATETIME: {
            "in_use": "icon",
            "icon": {"name": "Calendar", "color": "#6d7b8a"},
        },
        f"{PropertyTypeEnum.RELATION}_{RelationTypeEnum.USER}": {
            "in_use": "icon",
            "icon": {"name": "UsersRound", "color": "#6d7b8a"},
        },
    }

    def get_logo_props(self, property_type, relation_type=None):
        """Get logo properties for issue property"""
        if property_type == PropertyTypeEnum.RELATION:
            return self.type_logo_props.get(
                f"{PropertyTypeEnum.RELATION}_{relation_type}"
            )
        return self.type_logo_props.get(property_type)

    # list issue properties and get issue property by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_docs(
        operation_id="list_issue_properties",
        description="List issue properties",
        summary="List issue properties",
        responses={
            200: OpenApiResponse(
                description="Issue properties",
                response=IssuePropertyAPISerializer(many=True),
            ),
        },
    )
    def get(self, request, slug, project_id, type_id):
        # list of issue properties
        issue_properties = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            issue_type__is_epic=False,
        )
        serializer = self.serializer_class(issue_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create issue property
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_docs(
        operation_id="create_issue_property",
        description="Create a new issue property",
        summary="Create a new issue property",
        request=OpenApiRequest(
            request=IssuePropertyAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyAPISerializer",
                    value={
                        "name": "Priority",
                        "description": "The priority of the issue",
                        "property_type": "OPTION",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for creating an issue property",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Issue property created",
                response=IssuePropertyAPISerializer,
            ),
            409: OpenApiResponse(
                description="Issue property with the same external id and external source already exists"
            ),
        },
    )
    def post(self, request, slug, project_id, type_id):
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id)
        issue_type = IssueType.objects.get(pk=type_id)

        # check if issue property with the same external id and external source already exists
        external_id = request.data.get("external_id")
        external_existing_issue_property = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            issue_type__is_epic=False,
            external_source=request.data.get("external_source"),
            external_id=request.data.get("external_id"),
        )
        if (
            external_id
            and request.data.get("external_source")
            and external_existing_issue_property.exists()
        ):
            issue_property = self.model.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_id=type_id,
                external_source=request.data.get("external_source"),
                external_id=external_id,
                issue_type__is_epic=False,
            ).first()
            return Response(
                {
                    "error": "Issue Property with the same external id and external source already exists",
                    "id": str(issue_property.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        data = request.data
        issue_property_serializer = self.serializer_class(data=data)
        issue_property_serializer.is_valid(raise_exception=True)
        issue_property_serializer.save(
            workspace=workspace,
            project=project,
            issue_type=issue_type,
            logo_props=self.get_logo_props(
                data.get("property_type"), data.get("relation_type")
            ),
        )

        # getting the issue property
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            pk=issue_property_serializer.data["id"],
            issue_type__is_epic=False,
        )
        serializer = self.serializer_class(issue_property)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IssuePropertyDetailAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue type properties.

    """

    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_property"

    type_logo_props = {
        PropertyTypeEnum.TEXT: {
            "in_use": "icon",
            "icon": {"name": "AlignLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DECIMAL: {
            "in_use": "icon",
            "icon": {"name": "Hash", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.OPTION: {
            "in_use": "icon",
            "icon": {"name": "CircleChevronDown", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.BOOLEAN: {
            "in_use": "icon",
            "icon": {"name": "ToggleLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DATETIME: {
            "in_use": "icon",
            "icon": {"name": "Calendar", "color": "#6d7b8a"},
        },
        f"{PropertyTypeEnum.RELATION}_{RelationTypeEnum.USER}": {
            "in_use": "icon",
            "icon": {"name": "UsersRound", "color": "#6d7b8a"},
        },
    }

    def get_logo_props(self, property_type, relation_type=None):
        """Get logo properties for issue property"""
        if property_type == PropertyTypeEnum.RELATION:
            return self.type_logo_props.get(
                f"{PropertyTypeEnum.RELATION}_{relation_type}"
            )
        return self.type_logo_props.get(property_type)

    # list issue properties and get issue property by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_docs(
        operation_id="retrieve_issue_property",
        description="Get issue property by id",
        summary="Get issue property by id",
        responses={
            200: OpenApiResponse(
                description="Issue properties", response=IssuePropertyAPISerializer
            ),
        },
    )
    def get(self, request, slug, project_id, type_id, property_id):
        # getting issue property by id
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            pk=property_id,
            issue_type__is_epic=False,
        )
        serializer = self.serializer_class(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # update issue property by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_docs(
        operation_id="update_issue_property",
        description="Update an issue property",
        summary="Update an issue property",
        request=OpenApiRequest(
            request=IssuePropertyAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyAPISerializer",
                    value={
                        "name": "Priority",
                        "description": "The priority of the issue",
                        "property_type": "OPTION",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for updating an issue property",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Issue property updated",
                response=IssuePropertyAPISerializer,
            ),
        },
    )
    def patch(self, request, slug, project_id, type_id, property_id):
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            pk=property_id,
            issue_type__is_epic=False,
        )

        data = request.data
        issue_property_serializer = self.serializer_class(
            issue_property, data=data, partial=True
        )
        issue_property_serializer.is_valid(raise_exception=True)
        issue_property_serializer.save()

        return Response(issue_property_serializer.data, status=status.HTTP_200_OK)

    # delete issue property by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_docs(
        operation_id="delete_issue_property",
        description="Delete an issue property",
        summary="Delete an issue property",
        responses={
            204: OpenApiResponse(description="Issue property deleted"),
        },
    )
    def delete(self, request, slug, project_id, type_id, property_id):
        issue_property = self.model.objects.get(
            workspace__slug=self.workspace_slug,
            project_id=self.project_id,
            issue_type_id=self.type_id,
            pk=self.property_id,
            issue_type__is_epic=False,
        )
        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
