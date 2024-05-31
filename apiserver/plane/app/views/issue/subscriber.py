# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    IssueSubscriberSerializer,
    ProjectMemberLiteSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
)
from plane.db.models import (
    IssueSubscriber,
    ProjectMember,
    Issue,
)


class IssueSubscriberViewSet(BaseViewSet):
    serializer_class = IssueSubscriberSerializer
    model = IssueSubscriber

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_permissions(self):
        if self.action in ["subscribe", "unsubscribe", "subscription_status"]:
            self.permission_classes = [
                ProjectLitePermission,
            ]
        else:
            self.permission_classes = [
                ProjectEntityPermission,
            ]

        return super(IssueSubscriberViewSet, self).get_permissions()

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    def list(self, request, slug, project_id, issue_id):
        members = ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            is_active=True,
        ).select_related("member")
        serializer = ProjectMemberLiteSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, project_id, issue_id, subscriber_id):
        issue_subscriber = IssueSubscriber.objects.get(
            project=project_id,
            subscriber=subscriber_id,
            workspace__slug=slug,
            issue=issue_id,
        )
        issue_subscriber.delete()
        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )

    def subscribe(self, request, slug, project_id, issue_id):
        if IssueSubscriber.objects.filter(
            issue_id=issue_id,
            subscriber=request.user,
            workspace__slug=slug,
            project=project_id,
        ).exists():
            return Response(
                {"message": "User already subscribed to the issue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscriber = IssueSubscriber.objects.create(
            issue_id=issue_id,
            subscriber_id=request.user.id,
            project_id=project_id,
        )
        serializer = IssueSubscriberSerializer(subscriber)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def unsubscribe(self, request, slug, project_id, issue_id):
        issue_subscriber = IssueSubscriber.objects.get(
            project=project_id,
            subscriber=request.user,
            workspace__slug=slug,
            issue=issue_id,
        )
        issue_subscriber.delete()
        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )

    def subscription_status(self, request, slug, project_id, issue_id):
        issue_subscriber = IssueSubscriber.objects.filter(
            issue=issue_id,
            subscriber=request.user,
            workspace__slug=slug,
            project=project_id,
        ).exists()
        return Response(
            {"subscribed": issue_subscriber}, status=status.HTTP_200_OK
        )


class BulkSubscribeIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        )

        IssueSubscriber.objects.bulk_create(
            [
                IssueSubscriber(
                    subscriber_id=request.user.id,
                    issue=issue,
                    project_id=project_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
