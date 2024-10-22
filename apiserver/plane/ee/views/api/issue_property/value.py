# Django imports
from django.db.models import F, Value, Case, When
from django.db.models import (
    Q,
    CharField,
    Func,
)
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project, Issue
from plane.ee.models import (
    IssueProperty,
    IssuePropertyValue,
    PropertyTypeEnum,
)
from plane.ee.serializers.api import IssuePropertyValueAPISerializer
from plane.ee.utils.external_issue_property_validator import (
    externalIssuePropertyValueValidator,
    externalIssuePropertyValueSaver,
)
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


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
                        then=Cast(
                            F("value_decimal"), output_field=CharField()
                        ),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.BOOLEAN,
                        then=Cast(
                            F("value_boolean"), output_field=CharField()
                        ),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.RELATION,
                        then=Cast(F("value_uuid"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.OPTION,
                        then=Cast(F("value_option"), output_field=CharField()),
                    ),
                    default=Value(
                        ""
                    ),  # Default value if none of the conditions match
                    output_field=CharField(),
                ),
                filter=Q(property_id=F("property_id")),
                distinct=True,
            ),
        )

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def get(
        self,
        request,
        slug,
        project_id,
        issue_id,
        property_id=None,
        value_id=None,
    ):
        if (
            self.workspace_slug
            and self.project_id
            and self.issue_id
            and self.property_id
        ):
            # list of issue properties values
            if self.property_id is None:
                issue_property_values = self.model.objects.filter(
                    workspace__slug=self.workspace_slug,
                    project_id=self.project_id,
                    issue_id=self.issue_id,
                    property__is_active=True,
                )
                issue_property_values = self.query_annotator(
                    issue_property_values
                ).values("property_id", "values")
                return Response(
                    issue_property_values, status=status.HTTP_200_OK
                )

            # getting issue property values by property_id
            issue_property_values = self.model.objects.get(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_id=self.issue_id,
                property_id=self.property_id,
                property__is_active=True,
            )
            issue_property_values = self.query_annotator(
                issue_property_values
            ).values("property_id", "values")
            return Response(issue_property_values, status=status.HTTP_200_OK)

    # create issue property option
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(self, request, slug, project_id, issue_id, property_id):
        if (
            self.workspace_slug
            and self.project_id
            and self.issue_id
            and self.property_id
        ):
            workspace = Workspace.objects.get(slug=self.workspace_slug)
            issue_property = IssueProperty.objects.get(pk=self.property_id)

            issue_property_values = request.data.get("values", [])

            if not issue_property_values:
                return Response(
                    {"error": "Value is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # existing issue property values
            existing_issue_property_values = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_id=self.issue_id,
                property=issue_property,
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
                    property_external_source = value.get(
                        "external_source", None
                    )

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
            )
            issue_property_values = self.query_annotator(
                issue_property_values
            ).values("property_id", "values")

            return Response(
                issue_property_values, status=status.HTTP_201_CREATED
            )

    # update issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def patch(
        self, request, slug, project_id, issue_id, property_id, value_id
    ):
        if (
            self.workspace_slug
            and self.project_id
            and self.issue_id
            and self.property_id
            and self.option_id
        ):
            issue_property_value = self.model.objects.get(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_property_id=self.property_id,
                pk=self.option_id,
            )

            data = request.data
            issue_property_value_serializer = self.serializer_class(
                issue_property_value, data=data, partial=True
            )
            issue_property_value_serializer.is_valid(raise_exception=True)

            # check if issue type with the same external id and external source already exists
            external_id = request.data.get("external_id")
            external_existing_issue_property_value = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_property_id=self.property_id,
                external_source=request.data.get(
                    "external_source", issue_property_value.external_source
                ),
                external_id=external_id,
            )
            if (
                external_id
                and (issue_property_value.external_id != external_id)
                and external_existing_issue_property_value.exists()
            ):
                return Response(
                    {
                        "error": "Issue property with the same external id and external source already exists",
                        "id": str(issue_property_value.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            issue_property_value_serializer.save()

            return Response(
                issue_property_value_serializer.data,
                status=status.HTTP_200_OK,
            )

    # delete issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def delete(self, request, slug, project_id, property_id, value_id):
        if (
            self.workspace_slug
            and self.project_id
            and self.property_id
            and self.value_id
        ):
            property_option = self.model.objects.get(
                workspace__slug=self.workspace_slug,
                project_id=self.project_id,
                issue_property_id=self.property_id,
                pk=self.value_id,
            )
            property_option.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
