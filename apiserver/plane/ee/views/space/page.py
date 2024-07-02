# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from django.db.models import OuterRef, Func, F, Prefetch

from plane.db.models import (
    DeployBoard,
    Page,
    PageLog,
    Issue,
    IssueReaction,
    IssueVote,
)
from plane.ee.serializers import (
    PagePublicSerializer,
)
from plane.app.serializers import (
    IssuePublicSerializer,
)


class PagePublicEndpoint(BaseAPIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="page"
        )
        # Get the page object
        page = Page.objects.get(pk=deploy_board.entity_identifier)
        serializer = PagePublicSerializer(page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PagePublicIssuesEndpoint(BaseAPIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="page"
        )

        # Get the issue's embedded inside the page
        page_issues = PageLog.objects.filter(
            page_id=deploy_board.entity_identifier, entity_name="issue"
        ).values_list("entity_identifier", flat=True)

        issue_queryset = (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
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
                    "votes",
                    queryset=IssueVote.objects.select_related("actor"),
                )
            )
        )
        serializer = IssuePublicSerializer(issue_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
