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
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import (
    InitiativeActivitySerializer,
    InitiativeCommentSerializer,
)
from plane.app.permissions import (
    WorkSpaceBasePermission,
    allow_permission,
    ROLE,
)
from plane.ee.models import (
    InitiativeActivity,
    InitiativeComment,
    InitiativeCommentReaction,
)
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag

class InitiativeActivityEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    @method_decorator(gzip_page)
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        level="WORKSPACE",
    )
    def get(self, request, slug, initiative_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        initiative_activities = (
            InitiativeActivity.objects.filter(
                workspace__slug=slug, initiative_id=initiative_id
            )
            .filter(~Q(field__in=["comment", "vote", "reaction", "draft"]))
            .filter(**filters)
            .select_related("actor", "workspace", "initiative")
        ).order_by("created_at")

        initiative_comments = (
            InitiativeComment.objects.filter(
                workspace__slug=slug, initiative_id=initiative_id
            )
            .filter(**filters)
            .order_by("created_at")
            .select_related("actor", "initiative", "workspace")
            .prefetch_related(
                Prefetch(
                    "initiative_reactions",
                    queryset=InitiativeCommentReaction.objects.select_related(
                        "actor"
                    ),
                )
            )
        )
        initiative_activities = InitiativeActivitySerializer(
            initiative_activities, many=True
        ).data
        initiative_comments = InitiativeCommentSerializer(
            initiative_comments, many=True
        ).data

        if request.GET.get("activity_type", None) == "initiative-property":
            return Response(initiative_activities, status=status.HTTP_200_OK)

        if request.GET.get("activity_type", None) == "initiative-comment":
            return Response(initiative_comments, status=status.HTTP_200_OK)

        result_list = sorted(
            chain(initiative_activities, initiative_comments),
            key=lambda instance: instance["created_at"],
        )

        return Response(result_list, status=status.HTTP_200_OK)
