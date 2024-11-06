# Python imports
from itertools import chain

# Django imports
from django.db.models import (
    Prefetch,
    Q,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.serializers import (
    IssueActivitySerializer,
    IssueCommentSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
    allow_permission,
    ROLE,
)
from plane.db.models import (
    IssueActivity,
    IssueComment,
    CommentReaction,
)


class IssueActivityEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @method_decorator(gzip_page)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def get(self, request, slug, project_id, issue_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        issue_activities = (
            IssueActivity.objects.filter(issue_id=issue_id)
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .filter(**filters)
            .select_related("actor", "workspace", "issue", "project")
        ).order_by("created_at")
        issue_comments = (
            IssueComment.objects.filter(issue_id=issue_id)
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .filter(**filters)
            .order_by("created_at")
            .select_related("actor", "issue", "project", "workspace")
            .prefetch_related(
                Prefetch(
                    "comment_reactions",
                    queryset=CommentReaction.objects.select_related("actor"),
                )
            )
        )
        issue_activities = IssueActivitySerializer(
            issue_activities, many=True
        ).data
        issue_comments = IssueCommentSerializer(issue_comments, many=True).data

        if request.GET.get("activity_type", None) == "issue-property":
            return Response(issue_activities, status=status.HTTP_200_OK)

        if request.GET.get("activity_type", None) == "issue-comment":
            return Response(issue_comments, status=status.HTTP_200_OK)

        result_list = sorted(
            chain(issue_activities, issue_comments),
            key=lambda instance: instance["created_at"],
        )

        return Response(result_list, status=status.HTTP_200_OK)
