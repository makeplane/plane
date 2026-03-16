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

# Django imports
from django.db.models import Prefetch

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
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseWorkItemEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id):
        work_items = (
            Issue.objects.filter(
                release_work_items__release_id=release_id,
                release_work_items__deleted_at__isnull=True,
                workspace__slug=slug,
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

        results = []
        for item in work_items:
            results.append(
                {
                    "id": str(item.id),
                    "name": item.name,
                    "state_id": str(item.state_id) if item.state_id else None,
                    "state_group": item.state.group if item.state else None,
                    "priority": item.priority,
                    "project_id": str(item.project_id) if item.project_id else None,
                    "parent_id": str(item.parent_id) if item.parent_id else None,
                    "sequence_id": item.sequence_id,
                    "sort_order": item.sort_order,
                    "start_date": item.start_date,
                    "target_date": item.target_date,
                    "assignee_ids": [str(a.assignee_id) for a in item.issue_assignee.all()],
                    "label_ids": [str(la.label_id) for la in item.label_issue.all()],
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
            )

        return Response(results, status=status.HTTP_200_OK)

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
