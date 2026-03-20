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
from django.db.models import OuterRef, Func, F, Q, Value, UUIDField, Subquery
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.request import Request

# Module imports
from .. import BaseAPIView
from plane.app.serializers import IssueSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, IssueLink, FileAsset, CycleIssue, IssueType
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.timezone_converter import user_timezone_converter
from plane.utils.issue_type_hierarchy import validate_parent_child_hierarchy
from collections import defaultdict
from plane.utils.host import base_host
from plane.utils.order_queryset import order_issue_queryset
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.app.serializers.sub_workitem import WorkitemSearchSerializer
from plane.utils.issue_search import search_issues


class SubIssuesEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @method_decorator(gzip_page)
    def get(self, request, slug, project_id, issue_id):
        sub_issues = (
            Issue.issue_objects.filter(parent_id=issue_id, workspace__slug=slug)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue_module__module_id__isnull=True)
                            & Q(issue_module__module__archived_at__isnull=True)
                            & Q(issue_module__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(state_group=F("state__group"))
            .order_by("-created_at")
        )

        # Ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        group_by = request.GET.get("group_by", False)

        if order_by_param:
            sub_issues, order_by_param = order_issue_queryset(sub_issues, order_by_param)

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)
        for sub_issue in sub_issues:
            result[sub_issue.state_group].append(str(sub_issue.id))

        sub_issues = sub_issues.values(
            "id",
            "name",
            "state_id",
            "state__group",
            "sort_order",
            "completed_at",
            "estimate_point",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
            "project_id",
            "parent_id",
            "cycle_id",
            "module_ids",
            "label_ids",
            "assignee_ids",
            "sub_issues_count",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "attachment_count",
            "link_count",
            "is_draft",
            "archived_at",
            "type_id",
        )
        datetime_fields = ["created_at", "updated_at"]
        sub_issues = user_timezone_converter(sub_issues, datetime_fields, request.user.user_timezone)
        # Grouping
        if group_by:
            result_dict = defaultdict(list)

            for issue in sub_issues:
                if group_by == "assignees__ids":
                    if issue["assignee_ids"]:
                        assignee_ids = issue["assignee_ids"]
                        for assignee_id in assignee_ids:
                            result_dict[str(assignee_id)].append(issue)
                    elif issue["assignee_ids"] == []:
                        result_dict["None"].append(issue)

                elif group_by:
                    result_dict[str(issue[group_by])].append(issue)

            return Response(
                {"sub_issues": result_dict, "state_distribution": result},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"sub_issues": sub_issues, "state_distribution": result},
            status=status.HTTP_200_OK,
        )

    # Assign multiple sub issues
    def post(self, request, slug, project_id, issue_id):
        parent_issue = Issue.issue_objects.select_related("type").get(pk=issue_id)
        sub_issue_ids = request.data.get("sub_issue_ids", [])

        if not len(sub_issue_ids):
            return Response(
                {"error": "Sub Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub_issues = Issue.issue_objects.filter(id__in=sub_issue_ids).select_related("type")

        # Check heirarchy if flag is enabled
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.WORKITEM_TYPE_HIERARCHY, user_id=request.user.id, slug=slug
        ):
            # Validate type hierarchy for each sub-issue
            for sub_issue in sub_issues:
                is_valid, error_msg = validate_parent_child_hierarchy(parent_issue, sub_issue)
                if not is_valid:
                    return Response(
                        {"error": error_msg},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        for sub_issue in sub_issues:
            sub_issue.parent = parent_issue

        _ = Issue.objects.bulk_update(sub_issues, ["parent"], batch_size=10)

        updated_sub_issues = Issue.issue_objects.filter(id__in=sub_issue_ids).annotate(state_group=F("state__group"))

        # Track the issue
        _ = [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent_id": str(issue_id)}),
                actor_id=str(request.user.id),
                issue_id=str(sub_issue_id),
                project_id=str(project_id),
                current_instance=json.dumps({"parent_id": str(sub_issue_id)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            for sub_issue_id in sub_issue_ids
        ]

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)
        for sub_issue in updated_sub_issues:
            result[sub_issue.state_group].append(str(sub_issue.id))

        # build reverse map: issue_id -> state_group for annotating serialized data
        work_item_state_group_map = {issue_id: group for group, ids in result.items() for issue_id in ids}

        serializer = IssueSerializer(updated_sub_issues, many=True)
        sub_work_item_data = serializer.data
        for issue_data in sub_work_item_data:
            issue_data["state__group"] = work_item_state_group_map.get(str(issue_data["id"]))

        return Response(
            {"sub_issues": sub_work_item_data, "state_distribution": result},
            status=status.HTTP_200_OK,
        )


class SubWorkitemSearchEndpoint(BaseAPIView):
    """Search for potential sub-workitems based on type hierarchy levels."""

    def get(self, request: Request, slug: str):
        type_id = request.GET.get("type_id", None)
        workitem_id = request.GET.get("workitem_id", None)
        project_id = request.GET.get("project_id", None)

        # Default to level 0 if no type_id or workitem_id is provided, which means we are looking for parent workitems
        # for a level 0 workitem
        current_level = 0

        # Keep track of the current workitem's parent ID to exclude it from potential sub-workitems 
        # to prevent circular references
        workitem_parent_id = None

        # Determine the current workitem's type level based on provided type_id or workitem_id
        if type_id:
            issue_type = IssueType.objects.filter(id=type_id, workspace__slug=slug).first()
            if not issue_type:
                return Response(
                    {"error": "Issue type not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            current_level = issue_type.level

        if workitem_id:
            # Get the current workitem with its type
            workitem = (
                Issue.issue_and_epics_objects.filter(
                    workspace__slug=slug,
                    id=workitem_id,
                )
                .select_related("type")
                .first()
            )
            workitem_parent_id = workitem.parent_id if workitem else None

            if not workitem:
                return Response(
                    {"error": "Workitem not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Determine the current workitem's type level
            current_level = workitem.type.level if workitem.type_id else None

        if current_level is not None:
            # Get type IDs that are valid for sub-workitems
            if current_level == 0:
                # Level 0 workitems can only have level 0 sub-workitems
                valid_type_ids = IssueType.objects.filter(
                    workspace__slug=slug,
                    level=current_level,
                ).values_list("id", flat=True)
            else:
                # Higher level workitems can have sub-workitems with lower levels
                valid_type_ids = IssueType.objects.filter(
                    workspace__slug=slug,
                    level=(current_level - 1),
                ).values_list("id", flat=True)

            # Build the base queryset
            issues = (
                Issue.issue_and_epics_objects.filter(
                    workspace__slug=slug,
                )
                .filter(type_id__in=valid_type_ids)
                .select_related("project", "state", "workspace")
                .exclude(id=workitem_id)
                .exclude(parent_id=workitem_id)
                .accessible_to(request.user.id, slug)
                .distinct()
                .order_by("-last_activity_at")
            )
        else:
            # If we don't have a current level, we consider all types as valid for sub-workitems
            issues = (
                Issue.issue_and_epics_objects.filter(
                    workspace__slug=slug,
                )
                .select_related("project", "state", "workspace")
                .exclude(id=workitem_id)
                .exclude(parent_id=workitem_id)
                .accessible_to(request.user.id, slug)
                .distinct()
                .order_by("-last_activity_at")
            )

        if project_id:
            issues = issues.filter(project_id=project_id)

        # Exclude the current workitem's parent to prevent circular references
        if workitem_parent_id:
            issues = issues.exclude(id=workitem_parent_id)

        # Apply search query

        query = request.query_params.get("search", "").strip('"')
        if query:
            issues = search_issues(query, issues)

        serializer = WorkitemSearchSerializer(issues[:30], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ParentWorkitemSearchEndpoint(BaseAPIView):
    """Search for potential parent workitems based on type hierarchy levels."""

    def get(self, request: Request, slug: str):
        type_id = request.GET.get("type_id", None)
        workitem_id = request.GET.get("workitem_id", None)
        project_id = request.GET.get("project_id", None)

        # Default to level 0 if no type_id or workitem_id is provided, which means we are looking for parent workitems
        # for a level 0 workitem
        current_level = 0

        # Keep track of the current workitem's children IDs to exclude them from potential parent workitems
        children_workitem_ids = []

        # Determine the current workitem's type level based on provided type_id or workitem_id
        if type_id:
            issue_type = IssueType.objects.filter(id=type_id, workspace__slug=slug).first()
            if not issue_type:
                return Response(
                    {"error": "Issue type not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            current_level = issue_type.level

        if workitem_id:
            # Get the current workitem with its type
            workitem = (
                Issue.issue_objects.filter(
                    workspace__slug=slug,
                    id=workitem_id,
                )
                .select_related("type")
                .first()
            )

            if not workitem:
                return Response(
                    {"error": "Workitem not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Get the current workitem's children IDs to exclude them from potential parent workitems
            children_workitem_ids = list(
                Issue.issue_objects.filter(parent_id=workitem_id).values_list("id", flat=True)
            )

            # Determine the current workitem's type level
            current_level = workitem.type.level if workitem.type_id else None

        # Get type IDs that are valid for parent workitems
        valid_type_ids = IssueType.objects.filter(
            workspace__slug=slug,
        )

        if current_level is not None:
            # Level 0 workitems cannot have parent workitems, so we only consider types for levels greater than 0
            if current_level == 0:
                valid_type_ids = valid_type_ids.filter(Q(level=current_level) | Q(level=current_level + 1)).values_list(
                    "id", flat=True
                )
            else:
                valid_type_ids = valid_type_ids.filter(level=current_level + 1).values_list("id", flat=True)

            # Higher level workitems can have parent workitems with higher levels
            valid_type_ids = valid_type_ids.values_list("id", flat=True)

            # Build the base queryset
            issues = (
                Issue.issue_and_epics_objects.filter(
                    workspace__slug=slug,
                    type_id__in=valid_type_ids,
                )
                .select_related("project", "state", "workspace")
                .exclude(id=workitem_id)
                .exclude(id__in=children_workitem_ids)
                .accessible_to(request.user.id, slug)
                .order_by("-last_activity_at")
            )
        else:
            # If we don't have a current level, we consider all types as valid for parent workitems
            issues = (
                Issue.issue_and_epics_objects.filter(
                    workspace__slug=slug,
                )
                .select_related("project", "state", "workspace")
                .exclude(id=workitem_id)
                .exclude(id__in=children_workitem_ids)
                .accessible_to(request.user.id, slug)
                .order_by("-last_activity_at")
            )

        if project_id:
            issues = issues.filter(project_id=project_id)

        # Apply search query
        query = request.query_params.get("search", "").strip('"')
        if query:
            issues = search_issues(query, issues)

        serializer = WorkitemSearchSerializer(issues[:30], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

