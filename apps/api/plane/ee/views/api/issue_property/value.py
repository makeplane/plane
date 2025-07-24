# Django imports
from django.db.models import F, Value, Case, When
from django.db.models import Q, CharField, Func
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum
from plane.ee.serializers.api import IssuePropertyValueAPISerializer
from plane.ee.utils.external_issue_property_validator import (
    externalIssuePropertyValueValidator,
    externalIssuePropertyValueSaver,
)
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi.decorators import issue_property_value_docs


class IssuePropertyValueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, and `update`
    actions related to issue property values.

    """

    model = IssuePropertyValue
    serializer_class = IssuePropertyValueAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_property_value"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def issue_id(self):
        return self.kwargs.get("issue_id", None)

    @property
    def property_id(self):
        return self.kwargs.get("property_id", None)

    @property
    def value_id(self):
        return self.kwargs.get("value_id", None)

    def query_annotator(self, query):
        return query.values("property_id").annotate(
            values=ArrayAgg(
                Case(
                    When(
                        property__property_type__in=[
                            PropertyTypeEnum.TEXT,
                            PropertyTypeEnum.URL,
                            PropertyTypeEnum.EMAIL,
                            PropertyTypeEnum.FILE,
                        ],
                        then=F("value_text"),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DATETIME,
                        then=Func(
                            F("value_datetime"),
                            function="TO_CHAR",
                            template="%(function)s(%(expressions)s, 'YYYY-MM-DD')",
                            output_field=CharField(),
                        ),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DECIMAL,
                        then=Cast(F("value_decimal"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.BOOLEAN,
                        then=Cast(F("value_boolean"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.RELATION,
                        then=Cast(F("value_uuid"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.OPTION,
                        then=Cast(F("value_option"), output_field=CharField()),
                    ),
                    default=Value(""),  # Default value if none of the conditions match
                    output_field=CharField(),
                ),
                filter=Q(property_id=F("property_id")),
                distinct=True,
            )
        )

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="list_issue_property_values",
        summary="List issue property values",
        description="List issue property values",
        responses={
            200: OpenApiResponse(
                description="Issue property values",
                response=IssuePropertyValueAPISerializer,
            ),
        },
    )
    def get(self, request, slug, project_id, issue_id, property_id):
        if (
            self.workspace_slug
            and self.project_id
            and self.issue_id
            and self.property_id
        ):
            # list of issue properties values
            issue_property_values = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_id=self.issue_id,
                property_id=self.property_id,
                property__issue_type__is_epic=False,
            )
            issue_property_values = self.query_annotator(issue_property_values).values(
                "property_id", "values"
            )
            return Response(issue_property_values, status=status.HTTP_200_OK)

    # create issue property option
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="create_issue_property_value",
        summary="Create/update an issue property value",
        description="Create/update an issue property value",
        request=OpenApiRequest(
            request=IssuePropertyValueAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyValueAPISerializer",
                    value={
                        "values": [
                            {
                                "value": "1234567890",
                                "external_id": "1234567890",
                                "external_source": "github",
                            }
                        ]
                    },
                    description="Example request for creating an issue property value",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Issue property value created",
                response=IssuePropertyValueAPISerializer,
            ),
            400: OpenApiResponse(
                description="Value is required",
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    def post(self, request, slug, project_id, issue_id, property_id):
        if (
            self.workspace_slug
            and self.project_id
            and self.issue_id
            and self.property_id
        ):
            workspace = Workspace.objects.get(slug=self.workspace_slug)
            issue_property = IssueProperty.objects.get(pk=self.property_id)

            # existing issue property values
            existing_issue_property_values = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_id=self.issue_id,
                property_id=self.property_id,
                property__issue_type__is_epic=False,
            )

            issue_property_values = request.data.get("values", [])

            if not issue_property_values:
                return Response(
                    {"error": "Value is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # validate the property value
            bulk_external_issue_property_values = []
            for value in issue_property_values:
                # check if ant external id and external source is provided
                property_value = value.get("value", None)

                if property_value:
                    externalIssuePropertyValueValidator(
                        issue_property=issue_property, value=property_value
                    )

                    # check if issue property with the same external id and external source already exists
                    property_external_id = value.get("external_id", None)
                    property_external_source = value.get("external_source", None)

                    # Save the values
                    bulk_external_issue_property_values.append(
                        externalIssuePropertyValueSaver(
                            workspace_id=workspace.id,
                            project_id=self.project_id,
                            issue_id=self.issue_id,
                            issue_property=issue_property,
                            value=property_value,
                            external_id=property_external_id,
                            external_source=property_external_source,
                        )
                    )

            #  remove the existing issue property values
            existing_issue_property_values.delete()

            # Bulk create the issue property values
            self.model.objects.bulk_create(
                bulk_external_issue_property_values, batch_size=10
            )

            # fetching the created issue property values
            issue_property_values = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_id=self.issue_id,
                property=issue_property,
                property__issue_type__is_epic=False,
            )
            issue_property_values = self.query_annotator(issue_property_values).values(
                "property_id", "values"
            )

            return Response(issue_property_values, status=status.HTTP_201_CREATED)
