# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helper for enforcing ProjectFieldPermission toggles on issue mutations.

Lock semantics for date fields:
  - Empty → Value : ALLOWED (setting a date for the first time)
  - Value → Value : BLOCKED when toggle is False
  - Value → Empty : BLOCKED when toggle is False

Delete gate:
  - BLOCKED when allow_member_delete_work_item is False and user is not admin.
"""

from datetime import date, datetime

from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE

# Maps request payload key → ProjectFieldPermission field name
DATE_FIELD_PERMISSION_MAP = {
    "completed_at": "allow_member_modify_completed_date",
    "target_date": "allow_member_modify_target_date",
    "start_date": "allow_member_modify_start_date",
}


def _is_admin(user_role_project: int | None, user_role_workspace: int | None) -> bool:
    """Return True if the user is admin at project OR workspace level."""
    return user_role_project == ROLE.ADMIN.value or user_role_workspace == ROLE.ADMIN.value


def _normalize_date_value(value):
    """Coerce ISO strings to datetime/date so payload vs ORM compare correctly."""
    if value is None or value == "":
        return None
    if isinstance(value, (datetime, date)):
        return value
    if isinstance(value, str):
        parsed = parse_datetime(value) or parse_date(value)
        return parsed if parsed is not None else value
    return value


def _date_changed(old_value, new_value) -> bool:
    return _normalize_date_value(old_value) != _normalize_date_value(new_value)


def check_work_item_field_permission(
    user_role_project: int | None,
    user_role_workspace: int | None,
    project_field_permission,  # ProjectFieldPermission instance or None
    request_payload: dict,
    current_instance,  # Issue model instance (old state for diffing)
    action: str = "update",  # "update" | "delete"
) -> Response | None:
    """Validate field-level permissions for issue mutations.

    Returns a 403 Response if the action is blocked, otherwise None (allow).

    Args:
        user_role_project: The requesting user's project membership role value (int) or None.
        user_role_workspace: The requesting user's workspace membership role value (int) or None.
        project_field_permission: ProjectFieldPermission instance (may be None → all locked).
        request_payload: Dict of fields being updated (request.data).
        current_instance: Existing Issue ORM instance before update.
        action: "update" or "delete".
    """
    # Admins bypass all field restrictions
    if _is_admin(user_role_project, user_role_workspace):
        return None

    if action == "delete":
        # If no permission row exists, default is False → block member delete
        allow_delete = getattr(project_field_permission, "allow_member_delete_work_item", False)
        if not allow_delete:
            return Response(
                {"error": "You are not allowed to delete work items in this project."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    # --- Update action: check each date field in the payload ---
    if project_field_permission is None:
        # No row exists → all toggles default False → check each date field
        for field_key in DATE_FIELD_PERMISSION_MAP:
            if field_key in request_payload:
                old_value = getattr(current_instance, field_key, None)
                new_value = request_payload.get(field_key)
                # Only block if current value is non-null (modify or clear)
                if old_value is not None and _date_changed(old_value, new_value):
                    return Response(
                        {"error": f"Members are not allowed to modify '{field_key}' in this project."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
        return None

    for field_key, perm_attr in DATE_FIELD_PERMISSION_MAP.items():
        if field_key not in request_payload:
            continue

        is_allowed = getattr(project_field_permission, perm_attr, False)
        if is_allowed:
            continue

        old_value = getattr(current_instance, field_key, None)
        new_value = request_payload.get(field_key)

        # Empty → Value: allowed (setting for first time)
        if old_value is None and _normalize_date_value(new_value) is not None:
            continue

        # Value → anything else: blocked (unless it's a true no-op)
        if old_value is not None and _date_changed(old_value, new_value):
            return Response(
                {"error": f"Members are not allowed to modify '{field_key}' in this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

    return None
