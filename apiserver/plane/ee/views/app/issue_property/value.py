# Django imports
from django.db.models import F, Value, Case, When
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import (
    Q,
    CharField,
)
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum
from plane.db.models import Issue
from plane.db.models import Project
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.utils.issue_property_validators import (
    property_validators,
    property_savers,
)
from plane.ee.bgtasks.issue_property_activity_task import (
    issue_property_activity,
)


class IssuePropertyValueEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

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
                        then=Cast(
                            F("value_datetime"), output_field=CharField()
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

    def get(self, request, slug, project_id, issue_id, issue_property_id=None):
        # Get a single issue property value
        if issue_property_id:
            issue_property_value = IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                property_id=issue_property_id,
            )

            issue_property_value = self.query_annotator(
                issue_property_value
            ).values("property_id", "value")

            return Response(issue_property_value, status=status.HTTP_200_OK)

        # Get all issue property values
        issue_property_values = IssuePropertyValue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            property__is_active=True,
        )

        # Annotate the query
        issue_property_values = self.query_annotator(
            issue_property_values
        ).values("property_id", "values")

        # Create dictionary of property_id and values
        response = {
            str(issue_property_value["property_id"]): issue_property_value[
                "values"
            ]
            for issue_property_value in issue_property_values
        }

        return Response(response, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, issue_id):
        try:
            # Create a new issue property value
            issue_property_values = request.data.get("property_values", {})

            # Get all the issue property ids
            issue_property_ids = list(issue_property_values.keys())

            # existing values
            existing_prop_queryset = IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
            )

            # Get all issue property values
            existing_prop_values = self.query_annotator(
                existing_prop_queryset
            ).values("property_id", "values")

            # Get issue
            issue = Issue.objects.get(pk=issue_id)

            # Get Issue Type
            issue_type_id = issue.type_id

            # Get Project
            project = Project.objects.get(pk=project_id)
            workspace_id = project.workspace_id

            # Get all issue properties
            issue_properties = IssueProperty.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_id=issue_type_id,
            )

            # Validate the data
            property_validators(
                properties=issue_properties,
                property_values=issue_property_values,
                existing_prop_values=existing_prop_values,
            )

            # Save the data
            bulk_issue_property_values = property_savers(
                properties=issue_properties,
                property_values=issue_property_values,
                issue_id=issue_id,
                workspace_id=workspace_id,
                project_id=project_id,
                existing_prop_values=existing_prop_values,
            )

            # Delete the old values
            existing_prop_queryset.filter(
                property_id__in=issue_property_ids
            ).delete()
            # Bulk create the issue property values
            IssuePropertyValue.objects.bulk_create(
                bulk_issue_property_values, batch_size=10
            )

            # Log the activity
            issue_property_activity.delay(
                existing_values={
                    str(prop["property_id"]): prop["values"]
                    for prop in existing_prop_values
                },
                requested_values=issue_property_values,
                issue_id=issue_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )
            return Response(status=status.HTTP_201_CREATED)
        except (ValidationError, ValueError) as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
