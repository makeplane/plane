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


def get_type_level(issue):
    """Get the type level for an issue. Returns 0 if no type is set."""
    if issue.type_id and issue.type:
        return issue.type.level
    return 0


def validate_type_hierarchy(parent_level, child_level):
    """
    Validate that a parent-child relationship respects the type hierarchy
    using raw level values.

    Rules:
    - If the parent's type level is 0, the child must also be level 0.
    - If the parent's type level is > 0, the child's level must be strictly
      lower than the parent's level.

    Returns (is_valid, error_message) tuple.
    """
    if parent_level == 0:
        if child_level != 0:
            return (
                False,
                "A level 0 work item can only have level 0 sub-work items.",
            )
    else:
        if child_level >= parent_level:
            return (
                False,
                f"Sub-work item type level ({child_level}) must be lower "
                f"than the parent type level ({parent_level}).",
            )

        if parent_level - child_level > 1:
            return (
                False,
                f"Sub-work item type level ({child_level}) must be at most "
                f"1 level lower than the parent type level ({parent_level}).",
            )

    return (True, None)


def validate_parent_child_hierarchy(parent_issue, child_issue):
    """
    Validate that a parent-child relationship respects the type hierarchy
    using Issue model instances (must have `type` select_related).

    Returns (is_valid, error_message) tuple.
    """
    return validate_type_hierarchy(
        get_type_level(parent_issue),
        get_type_level(child_issue),
    )
