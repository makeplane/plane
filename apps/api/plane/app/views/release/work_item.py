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
import copy

# Django imports
from django.db.models import Prefetch
from django.db.models import Q, Subquery, OuterRef, Count, Func, F, Value, UUIDField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.permissions import WorkspaceUserPermission, allow_permission, ROLE
from plane.db.models import (
    Workspace,
    Release,
    Issue,
    IssueAssignee,
    IssueLabel,
    ReleaseWorkItem,
    CycleIssue,
    IssueLink,
    FileAsset,
)
from plane.utils.paginator import GroupedOffsetPaginator
from plane.ee.models import MilestoneIssue
from django.db.models.functions import Coalesce
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)
from plane.app.serializers.sub_workitem import WorkitemSearchSerializer
from plane.utils.issue_search import search_issues


class ReleaseWorkItemEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    def get_queryset(self):
        return (
            Issue.objects.filter(
                release_work_items__release_id=self.kwargs.get("release_id"),
                release_work_items__deleted_at__isnull=True,
                workspace__slug=self.kwargs.get("slug"),
            )
            .select_related("state", "project", "parent")
            .prefetch_related(
                Prefetch(
                    "issue_assignee",
                    queryset=IssueAssignee.objects.filter(deleted_at__isnull=True).select_related("assignee"),
                ),
                Prefetch(
                    "label_issue",
                    queryset=IssueLabel.objects.filter(deleted_at__isnull=True).select_related("label"),
                ),
            )
            .order_by("-created_at")
        )

    def apply_annotations(self, issues):
        return (
            issues.annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=Subquery(
                    IssueLink.objects.filter(issue=OuterRef("id"))
                    .values("issue")
                    .annotate(count=Count("id"))
                    .values("count")
                )
            )
            .annotate(
                attachment_count=Subquery(
                    FileAsset.objects.filter(
                        issue_id=OuterRef("id"),
                        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    )
                    .values("issue_id")
                    .annotate(count=Count("id"))
                    .values("count")
                )
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                customer_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=True,
                            customer_request_issues__issue_id__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                customer_request_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_request_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(
                milestone_id=Subquery(
                    MilestoneIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("milestone_id")[
                        :1
                    ]
                )
            )
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id):
        issue_queryset = self.get_queryset()

        # queryset before applying annotations
        filtered_issue_queryset = copy.deepcopy(issue_queryset)

        issue_queryset = self.apply_annotations(issue_queryset)

        # Order by
        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)
        issue_queryset = issue_queryset_grouper(queryset=issue_queryset, group_by=group_by, sub_group_by=sub_group_by)

        if group_by:
            return self.paginate(
                request=request,
                order_by=order_by_param,
                queryset=issue_queryset,
                total_count_queryset=filtered_issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by, issues=issues, sub_group_by=sub_group_by, slug=slug, user_id=request.user.id
                ),
                paginator_cls=GroupedOffsetPaginator,
                group_by_fields=issue_group_values(field=group_by, slug=slug, queryset=issue_queryset),
                group_by_field_name=group_by,
                count_filter=Q(
                    Q(issue_intake__status=1)
                    | Q(issue_intake__status=-1)
                    | Q(issue_intake__status=2)
                    | Q(issue_intake__isnull=True),
                    archived_at__isnull=True,
                    is_draft=False,
                ),
            )
        else:
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                total_count_queryset=filtered_issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by, issues=issues, sub_group_by=sub_group_by, slug=slug, user_id=request.user.id
                ),
            )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        release = Release.objects.get(id=release_id, workspace=workspace)
        work_item_ids = request.data.get("work_item_ids", [])

        if not work_item_ids:
            return Response(
                {"error": "work_item_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_ids = ReleaseWorkItem.objects.filter(release=release, work_item_id__in=work_item_ids).values_list(
            "work_item_id", flat=True
        )

        existing_ids = [str(uid) for uid in existing_ids]
        new_ids = set(work_item_ids) - set(existing_ids)

        ReleaseWorkItem.objects.filter(release=release, workspace_id=workspace.id).exclude(
            work_item_id__in=work_item_ids
        ).delete()

        valid_work_item_ids = []
        if new_ids:
            for work_item_id in new_ids:
                if Issue.objects.filter(workspace_id=workspace.id, id=work_item_id).exists():
                    valid_work_item_ids.extend([work_item_id])

        if valid_work_item_ids:
            ReleaseWorkItem.objects.bulk_create(
                [
                    ReleaseWorkItem(
                        release=release,
                        work_item_id=wid,
                        workspace_id=workspace.id,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                    )
                    for wid in valid_work_item_ids
                ],
                batch_size=10,
            )

        return Response(
            {"message": "Work items added successfully"},
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, release_id):
        work_item_ids = request.data.get("work_item_ids", [])

        if not work_item_ids:
            return Response(
                {"error": "work_item_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ReleaseWorkItem.objects.filter(
            release_id=release_id,
            work_item_id__in=work_item_ids,
            workspace__slug=slug,
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseWorkItemSearchEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id):
        query = request.query_params.get("search", None)

        issues = (
            (
                Issue.issue_objects.filter(
                    Q(workspace__slug=slug),
                    Q(issue_intake__status=1)
                    | Q(issue_intake__status=-1)
                    | Q(issue_intake__status=2)
                    | Q(issue_intake__isnull=True),
                )
            )
            .select_related("project", "state", "workspace")
            .exclude(release_work_items__release_id=release_id)
            .accessible_to(request.user.id, slug)
            .order_by("-last_activity_at")
        )

        if query:
            issues = search_issues(query, issues)

        serializer = WorkitemSearchSerializer(issues[:20], many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
