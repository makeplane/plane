# Python imports
from itertools import chain

# Django imports
from django.db.models import Prefetch, Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page


# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.db.models import IssueActivity, IssueComment, CommentReaction
from plane.payment.flags.flag_decorator import (
    check_workspace_feature_flag,
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import EpicCommentSerializer, EpicActivitySerializer


class EpicActivityEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @method_decorator(gzip_page)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id, epic_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        epic_activities = (
            IssueActivity.objects.filter(issue_id=epic_id)
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

        if not check_workspace_feature_flag(
            feature_key=FeatureFlag.EPICS, slug=slug, user_id=str(request.user.id)
        ):
            epic_activities = epic_activities.filter(~Q(field="type"))

        epic_comments = (
            IssueComment.objects.filter(issue_id=epic_id)
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
        epic_activities = EpicActivitySerializer(epic_activities, many=True).data
        epic_comments = EpicCommentSerializer(epic_comments, many=True).data

        if request.GET.get("activity_type", None) == "epic-property":
            return Response(epic_activities, status=status.HTTP_200_OK)

        if request.GET.get("activity_type", None) == "epic-comment":
            return Response(epic_comments, status=status.HTTP_200_OK)

        result_list = sorted(
            chain(epic_activities, epic_comments),
            key=lambda instance: instance["created_at"],
        )

        return Response(result_list, status=status.HTTP_200_OK)
