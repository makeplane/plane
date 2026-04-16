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
from django.db.models import Q
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


class WorkitemHierarchyBulkUpdateEndpoint(BaseAPIView):
    """
    Validate and apply a proposed hierarchy_levels mapping {type_id: level, ...}.
    If any existing parent-child relationships would violate hierarchy rules,
    returns the violations as a 400. Otherwise applies the level updates.
    """

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def post(self, request, slug):
        hierarchy_levels = request.data

        # --- input validation ---
        if not isinstance(hierarchy_levels, dict) or not hierarchy_levels:
            return Response(
                {
                    "error": "hierarchy_levels must be a non-empty mapping of type_id to level.",
                    "error_code": "INVALID_INPUT",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposed_changes = {}
        for raw_tid, lvl in hierarchy_levels.items():
            if not isinstance(lvl, (int, float)) or lvl < 0:
                return Response(
                    {
                        "error": f"Invalid level for type_id {raw_tid}. Must be a non-negative number.",
                        "error_code": "INVALID_LEVEL",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                proposed_changes[UUID(str(raw_tid))] = lvl
            except (ValueError, AttributeError):
                return Response(
                    {"error": f"{raw_tid} is not a valid UUID.", "error_code": "INVALID_UUID"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        workspace = Workspace.objects.get(slug=slug)
        changed_type_ids = set(proposed_changes.keys())

        # Verify all proposed types exist in the workspace
        found = set(
            IssueType.objects.filter(
                workspace_id=workspace.id,
                id__in=changed_type_ids,
            ).values_list("id", flat=True)
        )
        missing = changed_type_ids - found
        if missing:
            return Response(
                {"type_ids": [str(m) for m in missing], "error": "NOT_FOUND", "error_code": "NOT_FOUND"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build proposed level map: start with current levels, overlay proposed changes
        proposed_level_map = dict(
            IssueType.objects.filter(
                workspace_id=workspace.id,
            ).values_list("id", "level")
        )
        proposed_level_map.update(proposed_changes)

        # Query all affected parent-child edges in a single query:
        # edges where at least one side has a type being changed,
        # and both sides have a type assigned.
        edges = (
            Issue.objects.filter(
                parent__isnull=False,
                type_id__isnull=False,
                parent__type_id__isnull=False,
            )
            .filter(Q(type_id__in=changed_type_ids) | Q(parent__type_id__in=changed_type_ids))
            .values_list("id", "type_id", "parent__type_id")
        )

        # Validate each edge against the proposed levels.
        # Track per-type violation counts so the frontend knows which types break.
        # violations_by_type: {type_id: {"parent": count, "child": count}}
        violations_by_type = {}
        for _issue_id, child_type_id, parent_type_id in edges:
            parent_level = proposed_level_map.get(parent_type_id)
            child_level = proposed_level_map.get(child_type_id)

            is_valid, _ = validate_type_hierarchy(parent_level, child_level)
            if not is_valid:
                # Attribute the violation to the type(s) being changed on this edge.
                for tid in (child_type_id, parent_type_id):
                    if tid in changed_type_ids:
                        entry = violations_by_type.setdefault(str(tid), {"parent_violations": 0, "child_violations": 0})
                        if tid == child_type_id:
                            entry["parent_violations"] += 1
                        else:
                            entry["child_violations"] += 1

        # If there are violations, return them as a 400
        if violations_by_type:
            return Response(
                {"error": violations_by_type, "error_code": "HIERARCHY_VIOLATION"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # No violations — apply the level updates
        for type_id, level in proposed_changes.items():
            IssueType.objects.filter(
                id=type_id,
                workspace_id=workspace.id,
            ).update(level=level)

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkitemHierarchyRelationBreakEndpoint(BaseAPIView):
    """
    Given a proposed hierarchy_levels mapping {type_id: level, ...}, find all
    parent-child relationships that would violate the rules and break them by
    setting parent to null. Then apply the level updates.
    """

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def post(self, request, slug):
        hierarchy_levels = request.data

        # --- input validation ---
        if not isinstance(hierarchy_levels, dict) or not hierarchy_levels:
            return Response(
                {
                    "error": "hierarchy_levels must be a non-empty mapping of type_id to level.",
                    "error_code": "INVALID_INPUT",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposed_changes = {}
        for raw_tid, lvl in hierarchy_levels.items():
            if not isinstance(lvl, (int, float)) or lvl < 0:
                return Response(
                    {
                        "error": f"Invalid level for type_id {raw_tid}. Must be a non-negative number.",
                        "error_code": "INVALID_LEVEL",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                proposed_changes[UUID(str(raw_tid))] = lvl
            except (ValueError, AttributeError):
                return Response(
                    {"error": f"{raw_tid} is not a valid UUID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        workspace = Workspace.objects.get(slug=slug)
        changed_type_ids = set(proposed_changes.keys())

        # Verify all proposed types exist in the workspace
        found = set(
            IssueType.objects.filter(
                workspace_id=workspace.id,
                id__in=changed_type_ids,
            ).values_list("id", flat=True)
        )
        missing = changed_type_ids - found
        if missing:
            return Response(
                {"type_ids": [str(m) for m in missing], "error": "NOT_FOUND"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build proposed level map: current levels + proposed overrides
        proposed_level_map = dict(
            IssueType.objects.filter(
                workspace_id=workspace.id,
            ).values_list("id", "level")
        )
        proposed_level_map.update(proposed_changes)

        # Query all affected parent-child edges (need parent_id and project_id for activity logging)
        edges = (
            Issue.objects.filter(
                parent__isnull=False,
                type_id__isnull=False,
                parent__type_id__isnull=False,
            )
            .filter(Q(type_id__in=changed_type_ids) | Q(parent__type_id__in=changed_type_ids))
            .values_list("id", "type_id", "parent__type_id", "parent_id", "project_id")
        )

        # Collect violating issues
        violation_issues = []
        for issue_id, child_type_id, parent_type_id, parent_id, project_id in edges:
            parent_level = proposed_level_map.get(parent_type_id)
            child_level = proposed_level_map.get(child_type_id)

            is_valid, _ = validate_type_hierarchy(parent_level, child_level)
            if not is_valid:
                violation_issues.append((issue_id, parent_id, project_id))

        # Break parent-child relationships for violating issues
        violation_ids = [v[0] for v in violation_issues]
        issues_updated = 0
        if violation_ids:
            issues_updated = Issue.objects.filter(id__in=violation_ids).update(parent_id=None)

        # Record issue activity for each broken relationship
        if violation_issues:
            epoch = int(timezone.now().timestamp())
            for issue_id, parent_id, project_id in violation_issues:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"parent_hierarchy_break": None}),
                    actor_id=str(request.user.id),
                    issue_id=str(issue_id),
                    project_id=str(project_id),
                    current_instance=json.dumps({"parent_id": str(parent_id)}),
                    epoch=epoch,
                )

        return Response(
            {"total_violations": issues_updated},
            status=status.HTTP_200_OK,
        )
