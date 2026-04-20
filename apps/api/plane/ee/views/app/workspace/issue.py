# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json

# Django imports
from django.utils import timezone
from django.views.decorators.gzip import gzip_page
from django.utils.decorators import method_decorator
from django.db.models import Prefetch, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.app.serializers import IssueListDetailSerializer
from plane.utils.issue_filters import issue_filters
from plane.permissions import can, WorkspacePermissions, WorkitemPermissions, permission_engine, PermissionContext
from plane.utils.order_queryset import order_issue_queryset
from plane.bgtasks.issue_activities_task import issue_activity
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.db.models import (
    IssueAssignee,
    IssueLabel,
    ModuleIssue,
    Issue,
    IssueRelation,
)
from plane.utils.filters import ComplexFilterBackend
from plane.utils.pql import PQLFilterBackend
from plane.utils.filters import IssueFilterSet


class WorkspaceIssueDetailEndpoint(BaseAPIView):
    use_read_replica = True

    filter_backends = (
        ComplexFilterBackend,
        PQLFilterBackend,
    )
    filterset_class = IssueFilterSet

    def _get_project_permission_filters(self):
        """
        Get project permission filters based on the new permission system.
        Uses permission_engine to determine per-project access:
        - Unconditional workitem:view → see all issues in that project
        - Conditional workitem:view+creator → see only own issues
        - No workitem:view → project excluded
        """
        from plane.db.models import ProjectMember

        user = self.request.user
        # Get all active project memberships for this user in the workspace
        project_memberships = ProjectMember.objects.filter(
            member=user,
            is_active=True,
            project__workspace__slug=self.kwargs.get("slug"),
            project__archived_at__isnull=True,
        ).values_list("project_id", flat=True)

        # Check workitem:view per project
        unconditional_projects = []
        creator_only_projects = []

        for project_id in project_memberships:
            result = permission_engine.check(
                user=user,
                permission=WorkitemPermissions.VIEW,
                context=PermissionContext.project(
                    project_id=project_id,
                    workspace_id=getattr(self.request, "workspace_id", None),
                ),
                defer_conditions=True,
            )
            if result.allowed:
                if result.conditions and "creator" in result.conditions:
                    creator_only_projects.append(project_id)
                else:
                    unconditional_projects.append(project_id)

        return Q(project_id__in=unconditional_projects) | Q(
            project_id__in=creator_only_projects,
            created_by=user,
        )

    def _validate_order_by_field(self, order_by_param):
        """
        Validate if the order_by parameter is a valid sortable field.
        Returns a tuple of (is_valid, sanitized_field)
        """
        # Remove the minus sign for validation
        field_name = order_by_param.lstrip("-")

        # Define valid sortable fields
        valid_fields = {
            # Direct fields
            "name",
            "sequence_id",
            "sort_order",
            "start_date",
            "target_date",
            "completed_at",
            "archived_at",
            "is_draft",
            "created_at",
            "updated_at",
            "point",
            # Related fields
            "state__name",
            "state__group",
            "type__name",
            "parent__name",
            "created_by__first_name",
            "updated_by__first_name",
            "estimate_point__name",
            # Many-to-many fields (handled specially in order_issue_queryset)
            "labels__name",
            "assignees__first_name",
            "issue_module__module__name",
            # Computed fields (annotated in get_queryset)
            "sub_issues_count",
            "attachment_count",
            "link_count",
            # Special fields handled by order_issue_queryset
            "priority",
            "state__group",
        }

        if field_name in valid_fields:
            return order_by_param
        else:
            return "-created_at"

    def get_queryset(self):
        return Issue.issue_objects.filter(workspace__slug=self.kwargs.get("slug"))

    def apply_annotations(self, issues):
        return (
            issues.select_related("state")
            .prefetch_related(
                Prefetch(
                    "issue_assignee",
                    queryset=IssueAssignee.objects.all(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "label_issue",
                    queryset=IssueLabel.objects.all(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_module",
                    queryset=ModuleIssue.objects.all(),
                )
            )
            .accessible_to(self.request.user.id, self.kwargs.get("slug"))
        )

    @method_decorator(gzip_page)
    @check_feature_flag(FeatureFlag.GLOBAL_VIEWS_TIMELINE)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # Create a mutable copy of query params to remove sub_issue
        query_params = request.query_params.copy()
        sub_issue = query_params.get("sub_issue", "false")
        query_params.pop("sub_issue", None)

        filters = issue_filters(query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        queryset = self.get_queryset()

        if sub_issue is not None and sub_issue == "false":
            # If sub_issue is false, show the issues which are attached to epic as well.
            queryset = queryset.filter(Q(parent__isnull=True) | Q(parent__type__is_epic=True))

        # Apply filtering from filterset
        queryset = self.filter_queryset(queryset)

        # Validate the order_by_param
        order_by_param = self._validate_order_by_field(order_by_param)

        issue_queryset = queryset.filter(**filters)

        # Get common project permission filters
        permission_filters = self._get_project_permission_filters()

        # Apply project permission filters to the issue queryset
        issue_queryset = issue_queryset.filter(permission_filters)

        # Applying annotations to the issue queryset
        issue_queryset = self.apply_annotations(issue_queryset)

        # Add additional prefetch based on expand parameter
        if self.expand:
            if "issue_relation" in self.expand:
                issue_queryset = issue_queryset.prefetch_related(
                    Prefetch(
                        "issue_relation",
                        queryset=IssueRelation.objects.select_related("related_issue"),
                    )
                )
            if "issue_related" in self.expand:
                issue_queryset = issue_queryset.prefetch_related(
                    Prefetch(
                        "issue_related",
                        queryset=IssueRelation.objects.select_related("issue"),
                    )
                )

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )
        return self.paginate(
            request=request,
            order_by=order_by_param,
            queryset=(issue_queryset),
            on_results=lambda issue_queryset: IssueListDetailSerializer(
                issue_queryset,
                many=True,
                fields=self.fields,
                expand=self.expand,
                context={"slug": slug, "user_id": str(request.user.id)},
            ).data,
        )


class WorkspaceIssueBulkUpdateDateEndpoint(BaseAPIView):
    """
    This endpoint is used to update the start and target date of the issues in the gantt
    layout in the workspace level
    """

    use_read_replica = True

    def validate_dates(self, current_start, current_target, new_start, new_target):
        """
        Validate that start date is before target date.
        """
        from datetime import datetime

        start = new_start or current_start
        target = new_target or current_target

        # Convert string dates to datetime objects if they're strings
        if isinstance(start, str):
            start = datetime.strptime(start, "%Y-%m-%d").date()
        if isinstance(target, str):
            target = datetime.strptime(target, "%Y-%m-%d").date()

        if start and target and start > target:
            return False
        return True

    @check_feature_flag(FeatureFlag.GLOBAL_VIEWS_TIMELINE)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def post(self, request, slug):
        updates = request.data.get("updates", [])

        issue_ids = [update["id"] for update in updates]
        epoch = int(timezone.now().timestamp())

        # get all the project ids from the payload
        project_ids = [update["project_id"] for update in updates]

        # Per-project permission check: verify user has workitem:edit in each project
        workspace_id = getattr(request, "workspace_id", None)
        for project_id in set(project_ids):
            result = permission_engine.check(
                user=request.user,
                permission=WorkitemPermissions.EDIT,
                context=PermissionContext.project(
                    project_id=project_id,
                    workspace_id=workspace_id,
                ),
            )
            if not result:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    f"You do not have permission to edit issues in project {project_id}."
                )

        # Fetch all relevant issues in a single query
        issues = list(
            Issue.objects.filter(
                id__in=issue_ids,
                project_id__in=project_ids,
                workspace__slug=slug,
            )
        )

        issues_dict = {str(issue.id): issue for issue in issues}
        issues_to_update = []

        for update in updates:
            issue_id = update["id"]
            issue = issues_dict.get(issue_id)

            if not issue:
                continue

            start_date = update.get("start_date")
            target_date = update.get("target_date")
            validate_dates = self.validate_dates(issue.start_date, issue.target_date, start_date, target_date)
            if not validate_dates:
                return Response(
                    {"message": "Start date cannot exceed target date"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if start_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"start_date": update.get("start_date")}),
                    current_instance=json.dumps({"start_date": str(issue.start_date)}),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(issue.project_id),
                    epoch=epoch,
                )
                issue.start_date = start_date
                issues_to_update.append(issue)

            if target_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"target_date": update.get("target_date")}),
                    current_instance=json.dumps({"target_date": str(issue.target_date)}),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(issue.project_id),
                    epoch=epoch,
                )
                issue.target_date = target_date
                issues_to_update.append(issue)

        # Bulk update issues
        Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])

        return Response({"message": "Issues updated successfully"}, status=status.HTTP_200_OK)


class WorkspaceIssueRetrieveEndpoint(BaseAPIView):
    use_read_replica = True

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, issue_id):
        issue = (
            Issue.issue_objects.filter(id=issue_id, workspace__slug=slug)
            .select_related("state", "project")
            .values(
                "id",
                "name",
                "sequence_id",
                "project__identifier",
                "project_id",
                "state__group",
                "state__name",
                "type_id",
            )
            .first()
        )

        if not issue:
            return Response({"error": "Work item not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(issue, status=status.HTTP_200_OK)
