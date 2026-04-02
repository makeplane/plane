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

# Third Party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import DeployBoard, IssueType
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes, check_workspace_feature_flag


class ProjectWorkItemTypesEndpoint(BaseAPIView):
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

        if not check_workspace_feature_flag(feature_key=FeatureFlag.ISSUE_TYPES, slug=deploy_board.workspace.slug):
            return Response(
                {"error": "Payment required", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        project_id = (
            deploy_board.entity_identifier if deploy_board.entity_name == "project" else deploy_board.project_id
        )

        work_item_types = (
            IssueType.objects.filter(
                workspace__slug=deploy_board.workspace.slug,
                project_issue_types__project_id=project_id,
                project_issue_types__deleted_at__isnull=True,
                is_epic=False,
            )
            .values("id", "name", "logo_props")
            .distinct()
            .order_by("name")
        )

        return Response(work_item_types, status=status.HTTP_200_OK)
