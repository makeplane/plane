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

# Django imports
from django.db.models import Prefetch

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import (
    Intake,
)
from plane.ee.models import IntakeForm, IntakeFormField
from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers.app.intake import IntakeFormSerializer, IntakeFormReadSerializer


class IntakeFormWorkitemTypeEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_INTAKE_FORM)
    def get(self, request, slug, project_id, pk=None):
        # Get all the intake items for the project
        if pk:
            intake_form = (
                IntakeForm.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    pk=pk,
                )
                .prefetch_related(
                    Prefetch(
                        "intake_form_fields",
                        queryset=IntakeFormField.objects.only("work_item_property"),
                        to_attr="fields",
                    )
                )
                .first()
            )
            serializer = IntakeFormReadSerializer(intake_form)
            return Response(serializer.data, status=status.HTTP_200_OK)

        intake_forms = IntakeForm.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        ).prefetch_related(
            Prefetch(
                "intake_form_fields",
                queryset=IntakeFormField.objects.only("work_item_property"),
                to_attr="fields",
            )
        )
        serializer = IntakeFormReadSerializer(intake_forms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_INTAKE_FORM)
    def post(self, request, slug, project_id):
        intake = Intake.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        ).first()
        if not intake:
            return Response(
                {"error": "Intake does not exist for this project, enable it through the project settings"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the request data
        serializer = IntakeFormSerializer(data=request.data, context={"project_id": project_id, "request": request})
        if serializer.is_valid():
            serializer.save(intake_id=intake.id)
            intake_form = (
                IntakeForm.objects.filter(id=serializer.instance.id)
                .prefetch_related(
                    Prefetch(
                        "intake_form_fields",
                        queryset=IntakeFormField.objects.only("work_item_property"),
                        to_attr="fields",
                    )
                )
                .first()
            )
            serializer = IntakeFormReadSerializer(intake_form)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_INTAKE_FORM)
    def patch(self, request, slug, project_id, pk):
        intake_form = IntakeForm.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
        )
        if not intake_form:
            return Response({"error": "Intake form does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = IntakeFormSerializer(intake_form, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            intake_form = (
                IntakeForm.objects.filter(id=serializer.instance.id)
                .prefetch_related(
                    Prefetch(
                        "intake_form_fields",
                        queryset=IntakeFormField.objects.only("work_item_property"),
                        to_attr="fields",
                    )
                )
                .first()
            )
            serializer = IntakeFormReadSerializer(intake_form)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_INTAKE_FORM)
    def delete(self, request, slug, project_id, pk):
        intake_form = IntakeForm.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
        )
        intake_form.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
