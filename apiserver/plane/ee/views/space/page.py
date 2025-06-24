# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from django.db.models import OuterRef, Func, F, Prefetch

from plane.db.models import DeployBoard, Page, PageLog, Issue, IssueReaction, IssueVote
from plane.ee.serializers import (
    PagePublicSerializer,
    PagePublicMetaSerializer,
    SubPagePublicSerializer,
)
from plane.app.serializers import IssuePublicSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes


class PageMetaDataEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        try:
            deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")
        except DeployBoard.DoesNotExist:
            return Response(
                {"error": "Page is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug
        ):
            try:
                page_id = deploy_board.entity_identifier
                page = Page.objects.get(id=page_id)
            except Page.DoesNotExist:
                return Response(
                    {"error": "Page is not published"}, status=status.HTTP_404_NOT_FOUND
                )

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
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug
        ):
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
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug
        ):
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


class PagePublicIssuesEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug
        ):
            # Get the issue's embedded inside the page
            page_issues = PageLog.objects.filter(
                page_id=deploy_board.entity_identifier, entity_name="issue"
            ).values_list("entity_identifier", flat=True)

            issue_queryset = (
                Issue.issue_objects.annotate(
                    sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .filter(pk__in=page_issues)
                .select_related("project", "workspace", "state", "parent")
                .prefetch_related("assignees", "labels")
                .prefetch_related(
                    Prefetch(
                        "issue_reactions",
                        queryset=IssueReaction.objects.select_related("actor"),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "votes", queryset=IssueVote.objects.select_related("actor")
                    )
                )
            )
            serializer = IssuePublicSerializer(issue_queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
