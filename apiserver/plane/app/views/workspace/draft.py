# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    F,
    Q,
    UUIDField,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    IssueCreateSerializer,
    DraftIssueCreateSerializer,
    DraftIssueSerializer,
    DraftIssueDetailSerializer,
)
from plane.db.models import (
    Issue,
    DraftIssue,
    Workspace,
)
from .. import BaseViewSet


class WorkspaceDraftIssueViewSet(BaseViewSet):

    model = DraftIssue

    @method_decorator(gzip_page)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list(self, request, slug):
        issues = (
            DraftIssue.objects.filter(workspace__slug=slug)
            .filter(created_by=request.user)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "draft_issue_module__module"
            )
            .annotate(cycle_id=F("draft_issue_cycle__cycle_id"))
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "draft_issue_module__module_id",
                        distinct=True,
                        filter=~Q(draft_issue_module__module_id__isnull=True)
                        & Q(
                            draft_issue_module__module__archived_at__isnull=True
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
        )

        serializer = DraftIssueSerializer(issues, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        serializer = DraftIssueCreateSerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER],
        creator=True,
        model=Issue,
        level="WORKSPACE",
    )
    def partial_update(self, request, slug, pk):
        issue = (
            DraftIssue.objects.filter(workspace__slug=slug)
            .filter(pk=pk)
            .filter(created_by=request.user)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "draft_issue_module__module"
            )
            .annotate(cycle_id=F("draft_issue_cycle__cycle_id"))
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "draft_issue_module__module_id",
                        distinct=True,
                        filter=~Q(draft_issue_module__module_id__isnull=True)
                        & Q(
                            draft_issue_module__module__archived_at__isnull=True
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .first()
        )

        if not issue:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueCreateSerializer(
            issue, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Issue,
        level="WORKSPACE",
    )
    def retrieve(self, request, slug, pk=None):
        issue = (
            DraftIssue.objects.filter(workspace__slug=slug)
            .filter(pk=pk)
            .filter(created_by=request.user)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "draft_issue_module__module"
            )
            .annotate(cycle_id=F("draft_issue_cycle__cycle_id"))
            .filter(pk=pk)
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "draft_issue_module__module_id",
                        distinct=True,
                        filter=~Q(draft_issue_module__module_id__isnull=True)
                        & Q(
                            draft_issue_module__module__archived_at__isnull=True
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        ).first()

        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DraftIssueDetailSerializer(issue)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=Issue,
        level="WORKSPACE",
    )
    def destroy(self, request, slug, pk=None):
        draft_issue = DraftIssue.objects.get(workspace__slug=slug, pk=pk)
        draft_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
