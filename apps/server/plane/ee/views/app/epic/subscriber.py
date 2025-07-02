# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.db.models import IssueSubscriber
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import EpicSubscriberSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions import ProjectEntityPermission, ProjectLitePermission


class EpicSubscriberViewSet(BaseViewSet):
    serializer_class = EpicSubscriberSerializer
    model = IssueSubscriber

    permission_classes = [ProjectEntityPermission]

    def get_permissions(self):
        if self.action in ["subscribe", "unsubscribe", "subscription_status"]:
            self.permission_classes = [ProjectLitePermission]
        else:
            self.permission_classes = [ProjectEntityPermission]

        return super(EpicSubscriberViewSet, self).get_permissions()

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("epic_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("epic_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.EPICS)
    def subscribe(self, request, slug, project_id, epic_id):
        if IssueSubscriber.objects.filter(
            issue_id=epic_id,
            subscriber=request.user,
            issue__type__is_epic=True,
            workspace__slug=slug,
            project=project_id,
        ).exists():
            return Response(
                {"message": "User already subscribed to the issue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscriber = IssueSubscriber.objects.create(
            issue_id=epic_id, subscriber_id=request.user.id, project_id=project_id
        )
        serializer = EpicSubscriberSerializer(subscriber)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.EPICS)
    def unsubscribe(self, request, slug, project_id, epic_id):
        issue_subscriber = IssueSubscriber.objects.get(
            project=project_id,
            subscriber=request.user,
            issue__type__is_epic=True,
            workspace__slug=slug,
            issue=epic_id,
        )
        issue_subscriber.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.EPICS)
    def subscription_status(self, request, slug, project_id, epic_id):
        issue_subscriber = IssueSubscriber.objects.filter(
            issue_id=epic_id,
            issue__type__is_epic=True,
            subscriber=request.user,
            workspace__slug=slug,
            project=project_id,
        ).exists()
        return Response({"subscribed": issue_subscriber}, status=status.HTTP_200_OK)
