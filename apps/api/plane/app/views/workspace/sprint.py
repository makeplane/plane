# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceEntityPermission, allow_permission, ROLE
from plane.app.serializers import (
    WorkspaceSprintAutomationMemberSerializer,
    WorkspaceSprintAutomationSerializer,
    WorkspaceSprintAutomationWriteSerializer,
    WorkspaceSprintIssueSerializer,
    WorkspaceSprintSerializer,
    WorkspaceSprintWriteSerializer,
)
from plane.bgtasks.workspace_sprint_task import process_workspace_sprint_automation
from plane.db.models import (
    Issue,
    ProjectMember,
    Workspace,
    WorkspaceMember,
    WorkspaceSprint,
    WorkspaceSprintAutomation,
    WorkspaceSprintAutomationMember,
    WorkspaceSprintIssue,
)
from plane.app.views.base import BaseAPIView, BaseViewSet


def is_workspace_admin(slug, user):
    return WorkspaceMember.objects.filter(
        workspace__slug=slug,
        member=user,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


def accessible_automation_filter(user):
    return (
        Q(access=WorkspaceSprintAutomation.PUBLIC_ACCESS)
        | Q(created_by=user)
        | Q(automation_members__member=user, automation_members__deleted_at__isnull=True)
    )


SPRINT_AUTOMATION_PROCESS_FIELDS = {
    "enabled",
    "start_date",
    "sprint_duration_days",
    "timezone",
    "name_template",
    "auto_create_next",
}


class WorkspaceSprintViewSet(BaseViewSet):
    serializer_class = WorkspaceSprintSerializer
    model = WorkspaceSprint
    permission_classes = [WorkspaceEntityPermission]

    def get_serializer_class(self):
        return WorkspaceSprintWriteSerializer if self.action in ["create", "update", "partial_update"] else WorkspaceSprintSerializer

    def get_queryset(self):
        queryset = (
            WorkspaceSprint.objects.filter(workspace__slug=self.workspace_slug)
            .select_related("workspace", "owned_by", "automation")
            .annotate(
                total_issues=Count(
                    "sprint_issues",
                    filter=Q(
                        sprint_issues__deleted_at__isnull=True,
                        sprint_issues__issue__deleted_at__isnull=True,
                        sprint_issues__issue__archived_at__isnull=True,
                        sprint_issues__issue__is_draft=False,
                    ),
                )
            )
            .order_by("sort_order", "-created_at")
        )
        if not is_workspace_admin(self.workspace_slug, self.request.user):
            queryset = queryset.filter(
                Q(automation__isnull=True)
                | Q(automation__access=WorkspaceSprintAutomation.PUBLIC_ACCESS)
                | Q(automation__created_by=self.request.user)
                | Q(automation__automation_members__member=self.request.user, automation__automation_members__deleted_at__isnull=True)
            ).distinct()

        archived = self.request.GET.get("archived", "false")
        automation_id = self.request.GET.get("automation_id")

        if archived == "true":
            queryset = queryset.filter(archived_at__isnull=False)
        else:
            queryset = queryset.filter(archived_at__isnull=True)

        if automation_id:
            queryset = queryset.filter(automation_id=automation_id)

        return queryset

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = serializer.save(workspace=workspace, owned_by=request.user)
        return Response(WorkspaceSprintSerializer(sprint).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, pk):
        sprint = self.get_queryset().get(pk=pk)
        serializer = self.get_serializer(sprint, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sprint = serializer.save()
        return Response(WorkspaceSprintSerializer(sprint).data, status=status.HTTP_200_OK)

    def update(self, request, slug, pk):
        sprint = self.get_queryset().get(pk=pk)
        serializer = self.get_serializer(sprint, data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = serializer.save()
        return Response(WorkspaceSprintSerializer(sprint).data, status=status.HTTP_200_OK)


class WorkspaceSprintAutomationViewSet(BaseViewSet):
    serializer_class = WorkspaceSprintAutomationSerializer
    model = WorkspaceSprintAutomation
    permission_classes = [WorkspaceEntityPermission]

    def get_serializer_class(self):
        return (
            WorkspaceSprintAutomationWriteSerializer
            if self.action in ["create", "update", "partial_update"]
            else WorkspaceSprintAutomationSerializer
        )

    def get_queryset(self):
        archived = self.request.GET.get("archived", "false")
        queryset = (
            WorkspaceSprintAutomation.objects.filter(workspace__slug=self.workspace_slug)
            .select_related("workspace", "created_by")
            .prefetch_related("automation_members")
            .annotate(
                active_sprints_count=Count(
                    "sprints",
                    filter=Q(sprints__deleted_at__isnull=True, sprints__archived_at__isnull=True),
                )
            )
            .order_by("sort_order", "-created_at")
        )
        if archived == "true":
            queryset = queryset.filter(archived_at__isnull=False)
        else:
            queryset = queryset.filter(archived_at__isnull=True)

        if is_workspace_admin(self.workspace_slug, self.request.user):
            return queryset
        return queryset.filter(accessible_automation_filter(self.request.user)).distinct()

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        automation = serializer.save(workspace=workspace)
        process_workspace_sprint_automation(automation)
        return Response(WorkspaceSprintAutomationSerializer(automation).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, pk):
        automation = self.get_queryset().get(pk=pk)
        serializer = self.get_serializer(automation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        automation = serializer.save()
        if set(request.data.keys()) & SPRINT_AUTOMATION_PROCESS_FIELDS:
            process_workspace_sprint_automation(automation)
        return Response(WorkspaceSprintAutomationSerializer(automation).data, status=status.HTTP_200_OK)

    def update(self, request, slug, pk):
        automation = self.get_queryset().get(pk=pk)
        serializer = self.get_serializer(automation, data=request.data)
        serializer.is_valid(raise_exception=True)
        automation = serializer.save()
        process_workspace_sprint_automation(automation)
        return Response(WorkspaceSprintAutomationSerializer(automation).data, status=status.HTTP_200_OK)


class WorkspaceSprintAutomationArchiveEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, automation_id):
        automation = WorkspaceSprintAutomation.objects.get(
            workspace__slug=slug,
            pk=automation_id,
            archived_at__isnull=True,
        )
        automation.archived_at = timezone.now()
        automation.save(update_fields=["archived_at", "updated_at"])
        return Response(WorkspaceSprintAutomationSerializer(automation).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, automation_id):
        automation = WorkspaceSprintAutomation.objects.get(
            workspace__slug=slug,
            pk=automation_id,
            archived_at__isnull=False,
        )
        automation.archived_at = None
        automation.save(update_fields=["archived_at", "updated_at"])
        return Response(WorkspaceSprintAutomationSerializer(automation).data, status=status.HTTP_200_OK)


class WorkspaceSprintArchiveEndpoint(BaseAPIView):
    def get_queryset(self):
        queryset = (
            WorkspaceSprint.objects.filter(workspace__slug=self.workspace_slug, archived_at__isnull=False)
            .select_related("workspace", "owned_by", "automation")
            .annotate(
                total_issues=Count(
                    "sprint_issues",
                    filter=Q(
                        sprint_issues__deleted_at__isnull=True,
                        sprint_issues__issue__deleted_at__isnull=True,
                        sprint_issues__issue__archived_at__isnull=True,
                        sprint_issues__issue__is_draft=False,
                    ),
                )
            )
            .order_by("-archived_at")
        )
        if is_workspace_admin(self.workspace_slug, self.request.user):
            return queryset
        return queryset.filter(
            Q(automation__isnull=True)
            | Q(automation__access=WorkspaceSprintAutomation.PUBLIC_ACCESS)
            | Q(automation__created_by=self.request.user)
            | Q(automation__automation_members__member=self.request.user, automation__automation_members__deleted_at__isnull=True)
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        automation_id = request.GET.get("automation_id")
        queryset = self.get_queryset()
        if automation_id:
            queryset = queryset.filter(automation_id=automation_id)
        return Response(WorkspaceSprintSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, sprint_id):
        sprint = WorkspaceSprint.objects.get(workspace__slug=slug, pk=sprint_id, archived_at__isnull=True)
        sprint.archived_at = timezone.now()
        sprint.save(update_fields=["archived_at", "updated_at"])
        return Response({"archived_at": str(sprint.archived_at)}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, sprint_id):
        sprint = WorkspaceSprint.objects.get(workspace__slug=slug, pk=sprint_id, archived_at__isnull=False)
        sprint.archived_at = None
        sprint.save(update_fields=["archived_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

class WorkspaceSprintIssueViewSet(BaseViewSet):
    serializer_class = WorkspaceSprintIssueSerializer
    model = WorkspaceSprintIssue
    permission_classes = [WorkspaceEntityPermission]

    def get_queryset(self):
        return WorkspaceSprintIssue.objects.filter(
            workspace__slug=self.workspace_slug,
            sprint_id=self.kwargs.get("sprint_id"),
        ).select_related("workspace", "project", "sprint", "issue", "issue__state", "issue__project")

    def _get_sprint(self, slug, sprint_id):
        queryset = WorkspaceSprint.objects.filter(workspace__slug=slug, pk=sprint_id, archived_at__isnull=True)
        if not is_workspace_admin(slug, self.request.user):
            queryset = queryset.filter(
                Q(automation__isnull=True)
                | Q(automation__access=WorkspaceSprintAutomation.PUBLIC_ACCESS)
                | Q(automation__created_by=self.request.user)
                | Q(automation__automation_members__member=self.request.user, automation__automation_members__deleted_at__isnull=True)
            ).distinct()
        return queryset.get()

    def _get_issue_for_write(self, slug, issue_id, user):
        issue = Issue.issue_objects.select_related("workspace", "project").get(workspace__slug=slug, pk=issue_id)
        if not ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=issue.project_id,
            member=user,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            is_active=True,
        ).exists():
            return None
        return issue

    def list(self, request, slug, sprint_id):
        self._get_sprint(slug, sprint_id)
        queryset = self.get_queryset()
        return Response(self.serializer_class(queryset, many=True).data, status=status.HTTP_200_OK)

    def create(self, request, slug, sprint_id):
        issue_id = request.data.get("issue_id")
        if not issue_id:
            return Response({"error": "issue_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        sprint = self._get_sprint(slug, sprint_id)
        issue = self._get_issue_for_write(slug, issue_id, request.user)
        if issue is None:
            return Response({"error": "Issue is not accessible"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            WorkspaceSprintIssue.objects.filter(issue=issue, deleted_at__isnull=True).delete()
            sprint_issue = WorkspaceSprintIssue.objects.create(
                workspace=sprint.workspace,
                project=issue.project,
                sprint=sprint,
                issue=issue,
            )

        return Response(self.serializer_class(sprint_issue).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, sprint_id, issue_id):
        sprint_issue = self.get_queryset().get(issue_id=issue_id)
        issue = self._get_issue_for_write(slug, issue_id, request.user)
        if issue is None:
            return Response({"error": "Issue is not accessible"}, status=status.HTTP_403_FORBIDDEN)

        sprint_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceSprintAutomationMemberEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, automation_id):
        automation = WorkspaceSprintAutomation.objects.get(workspace__slug=slug, pk=automation_id)
        if (
            automation.access == WorkspaceSprintAutomation.PRIVATE_ACCESS
            and not is_workspace_admin(slug, request.user)
            and automation.created_by_id != request.user.id
            and not WorkspaceSprintAutomationMember.objects.filter(
                automation=automation,
                member=request.user,
                deleted_at__isnull=True,
            ).exists()
        ):
            return Response({"error": "Sprint group is not accessible"}, status=status.HTTP_403_FORBIDDEN)

        members = WorkspaceSprintAutomationMember.objects.filter(
            automation=automation,
            deleted_at__isnull=True,
        ).select_related("member")
        return Response(WorkspaceSprintAutomationMemberSerializer(members, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, automation_id):
        automation = WorkspaceSprintAutomation.objects.get(workspace__slug=slug, pk=automation_id)
        if not is_workspace_admin(slug, request.user) and automation.created_by_id != request.user.id:
            return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)

        member_ids = request.data.get("member_ids", [])
        if not isinstance(member_ids, list):
            return Response({"error": "member_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        valid_member_ids = set(
            WorkspaceMember.objects.filter(
                workspace__slug=slug,
                member_id__in=member_ids,
                is_active=True,
            ).values_list("member_id", flat=True)
        )

        WorkspaceSprintAutomationMember.objects.filter(automation=automation).exclude(member_id__in=valid_member_ids).delete()
        existing_member_ids = set(
            WorkspaceSprintAutomationMember.objects.filter(
                automation=automation,
                member_id__in=valid_member_ids,
                deleted_at__isnull=True,
            ).values_list("member_id", flat=True)
        )
        WorkspaceSprintAutomationMember.objects.bulk_create(
            [
                WorkspaceSprintAutomationMember(
                    automation=automation,
                    workspace=automation.workspace,
                    member_id=member_id,
                )
                for member_id in valid_member_ids - existing_member_ids
            ],
            ignore_conflicts=True,
        )

        members = WorkspaceSprintAutomationMember.objects.filter(
            automation=automation,
            deleted_at__isnull=True,
        ).select_related("member")
        return Response(WorkspaceSprintAutomationMemberSerializer(members, many=True).data, status=status.HTTP_200_OK)


# Canonical squad names with backwards-compatible automation classes above.
WorkspaceSprintSquadViewSet = WorkspaceSprintAutomationViewSet
WorkspaceSprintSquadArchiveEndpoint = WorkspaceSprintAutomationArchiveEndpoint
WorkspaceSprintSquadMemberEndpoint = WorkspaceSprintAutomationMemberEndpoint
