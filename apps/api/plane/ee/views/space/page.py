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
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from django.db.models import OuterRef

from plane.db.models import DeployBoard, Page, PageLog, Issue
from plane.ee.serializers import (
    PagePublicSerializer,
    PagePublicMetaSerializer,
    SubPagePublicSerializer,
)
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes


class PageMetaDataEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, anchor):
        try:
            deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")
        except DeployBoard.DoesNotExist:
            return Response({"error": "Page is not published"}, status=status.HTTP_404_NOT_FOUND)

        if check_workspace_feature_flag(feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug):
            try:
                page_id = deploy_board.entity_identifier
                page = Page.objects.get(id=page_id)
            except Page.DoesNotExist:
                return Response({"error": "Page is not published"}, status=status.HTTP_404_NOT_FOUND)

            serializer = PagePublicMetaSerializer(page)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class PagePublicEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug):
            # Get the page object
            page = Page.objects.get(pk=deploy_board.entity_identifier)
            serializer = PagePublicSerializer(page)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class SubPagePublicEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug):
            # Get the page object
            page = Page.objects.filter(
                parent_id=deploy_board.entity_identifier,
                workspace__slug=deploy_board.workspace.slug,
            ).annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="page",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=deploy_board.workspace.slug,
                ).values("anchor")
            )
            serializer = SubPagePublicSerializer(page, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class PagePublicEmbedEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, anchor):
        embed_type = request.query_params.get("embed_type", "issue")

        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        if check_workspace_feature_flag(feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug):
            # Validate embed_type against PageLog TYPE_CHOICES
            valid_embed_types = ["issue", "page"]
            if embed_type not in valid_embed_types:
                return Response(
                    {"error": "Invalid embed type"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Handle different embed types
            if embed_type == "issue":
                page_logs = (
                    PageLog.objects.filter(
                        page_id=deploy_board.entity_identifier, workspace_id=deploy_board.workspace_id
                    )
                    .filter(entity_name="issue")
                    .values_list("entity_identifier", flat=True)
                )
                issues = (
                    Issue.issue_objects.filter(id__in=list(page_logs), workspace_id=deploy_board.workspace_id)
                    .select_related("state")
                    .values(
                        "name",
                        "id",
                        "sequence_id",
                        "project__identifier",
                        "project_id",
                        "priority",
                        "state__group",
                        "state__name",
                        "state__color",
                        "type_id",
                    )
                )
                return Response(issues, status=status.HTTP_200_OK)

            else:
                return Response(
                    {"error": f"Embed type '{embed_type}' is not yet implemented"},
                    status=status.HTTP_501_NOT_IMPLEMENTED,
                )
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class PagePublicMentionEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, anchor):
        mention_type = request.query_params.get("mention_type", "issue_mention")

        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        if check_workspace_feature_flag(feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug):
            # Validate mention_type
            valid_mention_types = ["issue_mention", "user_mention"]
            if mention_type not in valid_mention_types:
                return Response(
                    {"error": "Invalid mention type"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Handle different mention types
            if mention_type == "issue_mention":
                page_logs = (
                    PageLog.objects.filter(
                        page_id=deploy_board.entity_identifier, workspace_id=deploy_board.workspace_id
                    )
                    .filter(entity_name="issue_mention")
                    .values_list("entity_identifier", flat=True)
                )
                issues = (
                    Issue.issue_objects.filter(id__in=list(page_logs), workspace_id=deploy_board.workspace_id)
                    .select_related("state")
                    .values(
                        "id",
                        "name",
                        "sequence_id",
                        "project__identifier",
                        "project_id",
                        "state__group",
                        "state__name",
                        "state__color",
                        "type_id",
                    )
                )
                return Response(issues, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": f"Mention type '{mention_type}' is not yet implemented"},
                    status=status.HTTP_501_NOT_IMPLEMENTED,
                )

        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
