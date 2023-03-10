# Django imports
from django.db.models import Prefetch

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import ViewSerializer, IssueSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import (
    View,
    Issue,
    IssueBlocker,
    IssueLink,
    CycleIssue,
    ModuleIssue,
)


class ViewViewSet(BaseViewSet):
    serializer_class = ViewSerializer
    model = View
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )


class ViewIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, view_id):
        try:
            view = View.objects.get(pk=view_id)
            queries = view.query

            issues = (
                Issue.objects.filter(
                    **queries, project_id=project_id, workspace__slug=slug
                )
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
                .prefetch_related(
                    Prefetch(
                        "blocked_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "blocked_by", "block"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "blocker_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "block", "blocked_by"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "issue_cycle",
                        queryset=CycleIssue.objects.select_related("cycle", "issue"),
                    ),
                )
                .prefetch_related(
                    Prefetch(
                        "issue_module",
                        queryset=ModuleIssue.objects.select_related(
                            "module", "issue"
                        ).prefetch_related("module__members"),
                    ),
                )
                .prefetch_related(
                    Prefetch(
                        "issue_link",
                        queryset=IssueLink.objects.select_related(
                            "issue"
                        ).select_related("created_by"),
                    )
                )
            )

            serializer = IssueSerializer(issues, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except View.DoesNotExist:
            return Response(
                {"error": "View does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
