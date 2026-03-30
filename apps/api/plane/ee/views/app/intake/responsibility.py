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
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import Intake
from plane.ee.serializers import IntakeResponsibilitySerializer
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import IntakeResponsibility
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IntakeResponsibilityEndpoint(BaseAPIView):
    use_read_replica = True

    serializer_class = IntakeResponsibilitySerializer
    model = IntakeResponsibility

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.INTAKE_RESPONSIBILITY)
    def post(self, request, slug, project_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake:
            return Response(
                {"error": "Intake not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IntakeResponsibilitySerializer(
            data=request.data,
            context={"intake": intake, "project_id": project_id, "user_id": request.user.id, "slug": slug},
        )
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.INTAKE_RESPONSIBILITY)
    def delete(self, request, slug, project_id, user_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake:
            return Response(
                {"error": "Intake not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        responsibility = IntakeResponsibility.objects.get(intake=intake, user_id=user_id)
        responsibility.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    @check_feature_flag(FeatureFlag.INTAKE_RESPONSIBILITY)
    def get(self, request, slug, project_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake:
            return Response(
                {"error": "Intake not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Return all user IDs assigned responsibility for this intake
        responsibility = IntakeResponsibility.objects.filter(intake=intake).values_list("user_id", flat=True)
        return Response(responsibility, status=status.HTTP_200_OK)
