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

# Third party imports
import json
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Django imports
from django.db.models import Prefetch
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity

## Enterprise imports
from plane.ee.serializers import (
    IntakeFormSettingsSerializer,
    IntakeFormFieldSerializer,
    IntakeWorkItemTypeFormCreateSerializer,
)
from plane.ee.views.base import BaseAPIView
from plane.ee.models import (
    IntakeForm,
    IntakeFormField,
    IssueProperty,
    IssuePropertyOption,
)
from plane.space.rate_limit import SpaceRateThrottle, AnchorBasedRateThrottle
from plane.db.models import APIToken, BotTypeEnum


class IntakeFormSettingsEndpoint(BaseAPIView):
    """
    This endpoint is used to get the intake form settings with the issue type and the intake form fields
    so the frontend can display the form fields and the options for the issue properties
    """

    use_read_replica = True

    permission_classes = [
        AllowAny,
    ]
    throttle_classes = [SpaceRateThrottle, AnchorBasedRateThrottle]

    def get(self, request, anchor: str):
        # Get the intake form from the anchor
        intake_form = IntakeForm.objects.filter(anchor=anchor).first()
        if not intake_form:
            return Response({"error": "Intake form not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get the intake form settings
        serializer = IntakeFormSettingsSerializer(intake_form)
        form_data = serializer.data

        # Get the intake form fields
        intake_form_fields = IntakeFormField.objects.filter(intake_form=intake_form).values_list(
            "work_item_property_id", flat=True
        )

        # Get the issue properties
        issue_properties = (
            IssueProperty.objects.filter(id__in=intake_form_fields)
            .prefetch_related(Prefetch("options", queryset=IssuePropertyOption.objects.all()))
            .order_by("sort_order")
        )
        issue_properties_serializer = IntakeFormFieldSerializer(issue_properties, many=True)
        issue_properties_data = issue_properties_serializer.data

        # Add the issue properties to the form data
        form_data["form_fields"] = issue_properties_data

        # Return the form data
        return Response(form_data, status=status.HTTP_200_OK)


class IntakeFormCreateWorkItemEndpoint(BaseAPIView):
    """
    This endpoint is used to create a new intake work item from the public form
    """

    use_read_replica = True

    permission_classes = [
        AllowAny,
    ]
    throttle_classes = [SpaceRateThrottle, AnchorBasedRateThrottle]

    def post(self, request, anchor: str):
        # Get the intake form from the anchor
        intake_form = IntakeForm.objects.filter(anchor=anchor).first()
        if not intake_form:
            return Response({"error": "Intake form not found"}, status=status.HTTP_404_NOT_FOUND)

        api_token = APIToken.objects.filter(
            workspace_id=intake_form.workspace_id,
            user__is_bot=True,
            user__bot_type=BotTypeEnum.INTAKE_BOT,
        ).first()

        if not api_token:
            return Response(
                {"message": "Intake bot not found", "code": "INTAKE_BOT_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the intake form settings
        serializer = IntakeWorkItemTypeFormCreateSerializer(
            data=request.data,
            context={
                "project_id": intake_form.project_id,
                "workspace_id": intake_form.workspace_id,
                "intake_id": intake_form.intake_id,
                "intake_form_id": intake_form.id,
                "work_item_type_id": intake_form.work_item_type_id,
                "created_by_id": api_token.user_id,
                "slug": intake_form.workspace.slug,
            },
        )
        if serializer.is_valid():
            intake_issue = serializer.save()

            # Create an Issue Activity
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(api_token.user_id),
                issue_id=str(intake_issue.issue_id),
                project_id=str(intake_form.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
                intake=str(intake_form.intake_id),
            )

            return Response(
                {"message": "Intake work item created successfully"},
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
