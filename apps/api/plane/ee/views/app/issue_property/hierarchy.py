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
from uuid import UUID

# Third party imports
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.ee.views.base import BaseAPIView
from plane.db.models import IssueType, Issue, Workspace
from plane.ee.permissions import WorkspaceEntityPermission
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.issue_type_hierarchy import validate_type_hierarchy


class WorkitemHierarchyEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def patch(self, request, slug):
        level = request.data.get("level")
        type_ids = request.data.get("type_ids", [])

        # Validate input
        if level is None or not isinstance(level, (int, float)) or level < 0:
            return Response(
                {"error": "A valid non-negative level is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(type_ids, list):
            return Response(
                {"error": "type_ids must be a list of UUIDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        # Get types currently at this level (to determine removals)
        existing_at_level = set(
            IssueType.objects.filter(
                workspace_id=workspace.id,
                level=level,
                is_epic=False,
            ).values_list("id", flat=True)
        )

        # Determine types to remove from this level (reset to 0)
        incoming_ids = set()
        for tid in type_ids:
            try:
                incoming_ids.add(UUID(str(tid)))
            except (ValueError, AttributeError):
                return Response(
                    {"type_id": tid, "error": "INVALID_UUID"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        types_to_remove = existing_at_level - incoming_ids
        types_to_add = incoming_ids

        # Validate that the incoming types exist in the workspace
        if types_to_add:
            found = set(
                IssueType.objects.filter(
                    workspace_id=workspace.id,
                    id__in=types_to_add,
                    is_epic=False,
                ).values_list("id", flat=True)
            )
            missing = types_to_add - found
            if missing:
                return Response(
                    {"type_ids": [str(m) for m in missing], "error": "NOT_FOUND"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Bulk-fetch parent and child type levels for all type_ids to avoid N+1 queries
        all_type_ids = types_to_add | types_to_remove

        # Map type_id -> parent's type level (only non-zero levels, since level 0 is skipped)
        parent_level_map = {}
        if all_type_ids:
            for type_id, parent_level in (
                Issue.objects.filter(
                    type_id__in=all_type_ids,
                    parent__isnull=False,
                    parent__type_id__isnull=False,
                    parent__type__level__gt=0,
                )
                .values_list("type_id", "parent__type__level")
                .distinct()
            ):
                if type_id not in parent_level_map:
                    parent_level_map[type_id] = parent_level

        # Map parent_type_id -> child's type level (only non-zero levels)
        child_level_map = {}
        if all_type_ids:
            for parent_type_id, child_level in (
                Issue.objects.filter(
                    parent__type_id__in=all_type_ids,
                    type_id__isnull=False,
                    type__level__gt=0,
                )
                .values_list("parent__type_id", "type__level")
                .distinct()
            ):
                if parent_type_id not in child_level_map:
                    child_level_map[parent_type_id] = child_level

        # Validate types being added to this level
        for type_id in types_to_add:
            parent_level = parent_level_map.get(type_id)
            if parent_level:
                is_valid, error_msg = validate_type_hierarchy(parent_level, level)
                if not is_valid:
                    return Response(
                        {
                            "type_id": str(type_id),
                            "message": error_msg,
                            "error": "PARENT_TYPE_HIERARCHY_VIOLATION",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            child_level = child_level_map.get(type_id)
            if child_level:
                is_valid, error_msg = validate_type_hierarchy(level, child_level)
                if not is_valid:
                    return Response(
                        {
                            "type_id": str(type_id),
                            "message": error_msg,
                            "error": "CHILD_TYPE_HIERARCHY_VIOLATION",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Validate hierarchy rules for types being removed (reset to level 0)
        for type_id in types_to_remove:
            parent_level = parent_level_map.get(type_id)
            if parent_level:
                is_valid, error_msg = validate_type_hierarchy(parent_level, 0)
                if not is_valid:
                    return Response(
                        {"type_id": str(type_id), "message": error_msg, "error": "PARENT_TYPE_HIERARCHY_VIOLATION"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            child_level = child_level_map.get(type_id)
            if child_level:
                is_valid, error_msg = validate_type_hierarchy(0, child_level)
                if not is_valid:
                    return Response(
                        {"type_id": str(type_id), "message": error_msg, "error": "CHILD_TYPE_HIERARCHY_VIOLATION"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Apply changes: reset removed types to level 0
        if types_to_remove:
            IssueType.objects.filter(
                id__in=types_to_remove,
                workspace_id=workspace.id,
            ).update(level=0)

        # Apply changes: set incoming types to the requested level
        if types_to_add:
            IssueType.objects.filter(
                id__in=types_to_add,
                workspace_id=workspace.id,
            ).update(level=level)

        return Response(status=status.HTTP_204_NO_CONTENT)



class WorkitemHierarchyValidationEndpoint(BaseAPIView):
    """
    Dry-run validation: given a type_id and a proposed new level, return the
    count of issues that would violate hierarchy rules (parent or child side).
    Does not apply any changes.
    """

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def post(self, request, slug):
        type_id = request.data.get("type_id")
        level = request.data.get("level")

        # --- input validation ---
        if level is None or not isinstance(level, (int, float)) or level < 0:
            return Response(
                {"error": "A valid non-negative level is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not type_id:
            return Response(
                {"error": "type_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            type_id = UUID(str(type_id))
        except (ValueError, AttributeError):
            return Response(
                {"error": "type_id must be a valid UUID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        # Ensure the type exists in this workspace
        if not IssueType.objects.filter(
            id=type_id,
            workspace_id=workspace.id,
            is_epic=False,
        ).exists():
            return Response(
                {"error": "Work item type not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- count issues that would break as a CHILD (their parent's level vs new level) ---
        # Issues of this type that have a typed parent
        parent_violation_count = 0
        parent_issues = Issue.objects.filter(
            type_id=type_id,
            parent__isnull=False,
            parent__type_id__isnull=False,
        ).values_list("id", "parent__type__level")

        for _issue_id, parent_level in parent_issues:
            is_valid, _ = validate_type_hierarchy(parent_level, level)
            if not is_valid:
                parent_violation_count += 1

        # --- count issues that would break as a PARENT (new level vs their children's level) ---
        # Child issues whose parent has this type and who themselves have a type
        child_violation_count = 0
        child_issues = Issue.objects.filter(
            parent__type_id=type_id,
            type_id__isnull=False,
        ).values_list("id", "type__level")

        for _issue_id, child_level in child_issues:
            is_valid, _ = validate_type_hierarchy(level, child_level)
            if not is_valid:
                child_violation_count += 1

        total = parent_violation_count + child_violation_count

        return Response(
            {
                "total_violations": total,
                "parent_violations": parent_violation_count,
                "child_violations": child_violation_count,
            },
            status=status.HTTP_200_OK,
        )
    

class WorkitemHierarchyRelationBreakEndpoint(BaseAPIView):
    """
    given a type_id and a proposed new level, validate the hierarchy rules and if not valid
    break the parent-child relationships that violate the rules by setting the parent to null.
    """

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def post(self, request, slug):
        type_id = request.data.get("type_id")
        level = request.data.get("level")

        # --- input validation ---
        if level is None or not isinstance(level, (int, float)) or level < 0:
            return Response(
                {"error": "A valid non-negative level is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not type_id:
            return Response(
                {"error": "type_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            type_id = UUID(str(type_id))
        except (ValueError, AttributeError):
            return Response(
                {"error": "type_id must be a valid UUID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        # Ensure the type exists in this workspace
        if not IssueType.objects.filter(
            id=type_id,
            workspace_id=workspace.id,
            is_epic=False,
        ).exists():
            return Response(
                {"error": "Work item type not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- count issues that would break as a CHILD (their parent's level vs new level) ---
        # Issues of this type that have a typed parent
        parent_violation_issues = []
        parent_issues = Issue.objects.filter(
            type_id=type_id,
            parent__isnull=False,
            parent__type_id__isnull=False,
        ).values_list("id", "parent__type__level", "parent_id", "project_id")

        for _issue_id, parent_level, _parent_id, _project_id in parent_issues:
            is_valid, _ = validate_type_hierarchy(parent_level, level)
            if not is_valid:
                parent_violation_issues.append((_issue_id, _parent_id, _project_id))

        # --- count issues that would break as a PARENT (new level vs their children's level) ---
        # Child issues whose parent has this type and who themselves have a type
        child_violation_issues = []
        child_issues = Issue.objects.filter(
            parent__type_id=type_id,
            type_id__isnull=False,
        ).values_list("id", "type__level", "parent_id", "project_id")

        for _issue_id, child_level, _parent_id, _project_id in child_issues:
            is_valid, _ = validate_type_hierarchy(level, child_level)
            if not is_valid:
                child_violation_issues.append((_issue_id, _parent_id, _project_id))

        parent_violation_ids = [i[0] for i in parent_violation_issues]
        child_violation_ids = [i[0] for i in child_violation_issues]

        # Break parent-child relationships for violating issues by setting parent to null
        parent_issues_updated = 0
        child_issues_updated = 0
        if parent_violation_ids:
            parent_issues_updated = Issue.objects.filter(id__in=parent_violation_ids).update(parent_id=None)
        if child_violation_ids:
            child_issues_updated = Issue.objects.filter(id__in=child_violation_ids).update(parent_id=None)

        # Record issue activity for each broken parent-child relationship
        epoch = int(timezone.now().timestamp())
        for _issue_id, _parent_id, _project_id in (
            parent_violation_issues + child_violation_issues
        ):
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent_hierarchy_break": None}),
                actor_id=str(request.user.id),
                issue_id=str(_issue_id),
                project_id=str(_project_id),
                current_instance=json.dumps({"parent_id": str(_parent_id)}),
                epoch=epoch,
            )

        return Response(
            {
                "total_violations": parent_issues_updated + child_issues_updated,
                "parent_violations": parent_issues_updated,
                "child_violations": child_issues_updated,
            },
            status=status.HTTP_200_OK,
        )
    