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
from django.db.models import Count, F, Q

# Third Party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import DeployBoard
from plane.ee.models import Milestone
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes, check_workspace_feature_flag


class ProjectMilestonesEndpoint(BaseAPIView):
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

        if not check_workspace_feature_flag(feature_key=FeatureFlag.MILESTONES, slug=deploy_board.workspace.slug):
            return Response(
                {"error": "Payment required", "error_code": ErrorCodes.PAYMENT_REQUIRED.value},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        project_id = (
            deploy_board.entity_identifier if deploy_board.entity_name == "project" else deploy_board.project_id
        )

        milestones = (
            Milestone.objects.filter(
                workspace__slug=deploy_board.workspace.slug,
                project_id=project_id,
            )
            .annotate(name=F("title"))
            .annotate(
                total_issues_count=Count(
                    "milestone_issues",
                    filter=Q(milestone_issues__deleted_at__isnull=True),
                    distinct=True,
                ),
                completed_issues_count=Count(
                    "milestone_issues",
                    filter=Q(
                        milestone_issues__deleted_at__isnull=True,
                        milestone_issues__issue__state__group="completed",
                    ),
                    distinct=True,
                ),
                cancelled_issues_count=Count(
                    "milestone_issues",
                    filter=Q(
                        milestone_issues__deleted_at__isnull=True,
                        milestone_issues__issue__state__group="cancelled",
                    ),
                    distinct=True,
                ),
            )
            .values("id", "name", "total_issues_count", "completed_issues_count", "cancelled_issues_count")
            .order_by("target_date", "created_at")
        )

        return Response(
            [
                {
                    "id": milestone["id"],
                    "name": milestone["name"],
                    "progress": {
                        "total_items": milestone["total_issues_count"],
                        "completed_items": milestone["completed_issues_count"],
                        "cancelled_items": milestone["cancelled_issues_count"],
                    },
                }
                for milestone in milestones
            ],
            status=status.HTTP_200_OK,
        )
