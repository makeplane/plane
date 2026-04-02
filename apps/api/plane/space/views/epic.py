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
from django.db.models import Q

# Third Party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import DeployBoard, Issue
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes, check_workspace_feature_flag


class ProjectEpicsEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor).first()
        if not deploy_board:
            return Response({"error": "Invalid anchor"}, status=status.HTTP_404_NOT_FOUND)

        if deploy_board.entity_name == "view" and not check_workspace_feature_flag(
            feature_key=FeatureFlag.VIEW_PUBLISH, slug=deploy_board.workspace.slug
        ):
            return Response(
                {"error": "Payment required", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        if not check_workspace_feature_flag(feature_key=FeatureFlag.EPICS, slug=deploy_board.workspace.slug):
            return Response(
                {"error": "Payment required", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        project_id = (
            deploy_board.entity_identifier if deploy_board.entity_name == "project" else deploy_board.project_id
        )

        epics = (
            Issue.issue_and_epics_objects.filter(
                workspace__slug=deploy_board.workspace.slug,
                project_id=project_id,
            )
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .values("id", "name")
            .distinct()
            .order_by("name")
        )

        return Response(epics, status=status.HTTP_200_OK)
