# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from typing import Optional, Union

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.exceptions import ValidationError
from django.db.models import Case, CharField, F, Func, Q, Value, When
from django.db.models.fields import UUIDField
from django.db.models.functions import Cast
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue, Project
from plane.ee.bgtasks.issue_property_activity_task import issue_property_activity
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.utils.formula.work_item_properties import fetch_formula_values
from plane.ee.utils.issue_property_validators import (
    SAVE_MAPPER,
    VALIDATOR_MAPPER,
    property_savers,
    property_validators,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag


class EpicPropertyValueEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

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

    # ========== FORMULA PROPERTY ==========
    def get_formula_values(
        self,
        workspace_slug: str,
        project_id: Union[str, UUIDField],
        work_item_id: Union[str, UUIDField],
        property_ids: Optional[list] = None,
    ) -> Optional[dict]:
        # validate feature flag
        feature_flag = FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD
        if not check_workspace_feature_flag(feature_key=feature_flag, slug=workspace_slug):
            return None

        # validating the property type required for formula properties
        if property_ids:
            issue_property_formula_properties = IssueProperty.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                id__in=property_ids,
                issue_type_properties__issue_type__is_epic=True,
                property_type=PropertyTypeEnum.FORMULA,
            )
            if issue_property_formula_properties.count() != len(property_ids):
                return None

        # fetch formula values
        formula_values = fetch_formula_values(work_item_id=work_item_id, property_ids=property_ids)
        return formula_values

    # ========== FORMULA PROPERTY ==========

    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id, epic_id, epic_property_id=None):
        # Get a single epic property value
        if epic_property_id:
            # ========== FORMULA PROPERTY ==========
            formula_values = (
                self.get_formula_values(
                    workspace_slug=slug,
                    project_id=project_id,
                    work_item_id=epic_id,
                    property_ids=[epic_property_id],
                )
                or None
            )
            if formula_values:
                return Response(formula_values, status=status.HTTP_200_OK)
            # ========== FORMULA PROPERTY ==========

            epic_property_value = IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=epic_id,
                property_id=epic_property_id,
                property__issue_type_properties__issue_type__is_epic=True,
            )

            epic_property_value = self.query_annotator(epic_property_value).values("property_id", "value")

            return Response(epic_property_value, status=status.HTTP_200_OK)

        # Get all epic property values
        epic_property_values = IssuePropertyValue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=epic_id,
            property__is_active=True,
            property__issue_type_properties__issue_type__is_epic=True,
        )

        # Annotate the query
        epic_property_values = self.query_annotator(epic_property_values).values("property_id", "values")

        # Create dictionary of property_id and values
        response = {
            str(epic_property_value["property_id"]): epic_property_value["values"]
            for epic_property_value in epic_property_values
        }

        # ========== FORMULA PROPERTY ==========
        formula_values = self.get_formula_values(
            workspace_slug=slug,
            project_id=project_id,
            work_item_id=epic_id,
        )
        if formula_values:
            response.update(formula_values)
        # ========== FORMULA PROPERTY ==========

        return Response(response, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.EPICS)
    def post(self, request, slug, project_id, epic_id):
        try:
            # Create a new epic property value
            epic_property_values = request.data.get("property_values", {})

            # Get all the epic property ids
            epic_property_ids = list(epic_property_values.keys())

            # ========== FORMULA PROPERTY ==========
            # Check if any of the properties are formula properties (read-only)
            formula_properties = IssueProperty.objects.filter(
                id__in=epic_property_ids, property_type=PropertyTypeEnum.FORMULA
            ).values_list("id", "display_name")

            # if formula property is present, remove it from the issue property values
            if formula_properties:
                for uuid, _ in formula_properties:
                    epic_property_values.pop(str(uuid))
            # ========== FORMULA PROPERTY ==========

            # existing values
            existing_prop_queryset = IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=epic_id,
                property__issue_type_properties__issue_type__is_epic=True,
            )

            # Get all epic property values
            existing_prop_values = self.query_annotator(existing_prop_queryset).values("property_id", "values")

            # Get epic
            issue = Issue.objects.get(pk=epic_id)

            # Get epic Type
            epic_type_id = issue.type_id

            # Get Project
            project = Project.objects.get(pk=project_id)
            workspace_id = project.workspace_id

            # Get all epic properties (exclude formula properties)
            epic_properties = IssueProperty.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_properties__issue_type_id=epic_type_id,
                issue_type_properties__issue_type__is_epic=True,
                is_active=True,
            ).exclude(property_type=PropertyTypeEnum.FORMULA)

            # Validate the data
            property_validators(
                properties=epic_properties,
                property_values=epic_property_values,
                existing_prop_values=existing_prop_values,
            )

            # Save the data
            bulk_epic_property_values = property_savers(
                properties=epic_properties,
                property_values=epic_property_values,
                issue_id=epic_id,
                workspace_id=workspace_id,
                project_id=project_id,
                existing_prop_values=existing_prop_values,
            )

            # Delete the old values
            existing_prop_queryset.filter(property_id__in=epic_property_ids, issue__type_id=epic_type_id).delete()
            # Bulk create the epic property values
            IssuePropertyValue.objects.bulk_create(bulk_epic_property_values, batch_size=10)

            # Log the activity
            issue_property_activity.delay(
                existing_values={str(prop["property_id"]): prop["values"] for prop in existing_prop_values},
                requested_values=epic_property_values,
                issue_id=epic_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )
            return Response(status=status.HTTP_201_CREATED)
        except (ValidationError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.EPICS)
    def patch(self, request, slug, project_id, epic_id, property_id):
        try:
            issue = Issue.objects.get(pk=epic_id)

            if issue.archived_at is not None:
                return Response(
                    {"error": "Archived epic's properties cannot be updated"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Get the epic property
            epic_property = IssueProperty.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                pk=property_id,
                issue_type_properties__issue_type__is_epic=True,
            )

            # Check if this is a formula property (read-only)
            if epic_property.property_type == PropertyTypeEnum.FORMULA:
                return Response(
                    {"error": f"Formula property '{epic_property.display_name}' is read-only and cannot be edited"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_prop_queryset = IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=epic_id,
                property_id=property_id,
            )

            # Get all epic property values
            existing_prop_values = self.query_annotator(existing_prop_queryset).values("property_id", "values")

            # existing values
            existing_values = {str(prop["property_id"]): prop["values"] for prop in existing_prop_values}

            # Get the value
            values = request.data.get("values", [])

            # Check if the property is required
            if epic_property.is_required and (not values or not [v for v in values if v]):
                return Response(
                    {"error": epic_property.display_name + " is a required property"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate the values
            validator = VALIDATOR_MAPPER.get(epic_property.property_type)

            if validator:
                for value in values:
                    validator(property=epic_property, value=value)
            else:
                raise ValidationError("Invalid property type")

            # Save the values
            saver = SAVE_MAPPER.get(epic_property.property_type)
            if saver:
                # Save the data
                property_values = saver(
                    values=values,
                    issue_property=epic_property,
                    issue_id=epic_id,
                    existing_values=[],
                    workspace_id=epic_property.workspace_id,
                    project_id=epic_property.project_id,
                )
                # Delete the old values
                existing_prop_queryset.filter(property_id=property_id).delete()
                # Bulk create the epic property values
                IssuePropertyValue.objects.bulk_create(property_values, batch_size=10)

            else:
                raise ValidationError("Invalid property type")

            # Log the activity
            issue_property_activity.delay(
                existing_values=existing_values,
                requested_values={str(property_id): values},
                issue_id=epic_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except (ValidationError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
