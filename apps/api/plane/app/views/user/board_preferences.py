# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Per-user board preferences endpoint.

``GET  /api/users/me/board-preferences/``  -> {"settings": {...}, "version": n}
``PATCH /api/users/me/board-preferences/`` merges the given keys and returns the same shape.

Keys:
- ``global_board``: {"enabled": bool, "template": {layout, display_filters,
  display_properties, filters} | null, "project_filters": {<project_id>: <filter expression> | null}}.
  PATCH merges ``global_board`` one level deep, and ``project_filters`` per project
  (a null value removes that project's entry; ``project_filters: null`` clears them all).
- ``auto_collapse_empty_groups``: bool.

A user who never wrote a setting has no row; GET returns the defaults (all off).
Every write bumps ``version``, so a client can tell whether its copy is stale.
"""

# Python imports
import copy
import json
import uuid

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import UserBoardPreference

MAX_SETTINGS_BYTES = 256 * 1024
MAX_PROJECT_FILTERS = 1000
TEMPLATE_KEYS = ("layout", "display_filters", "display_properties", "filters")


def default_settings():
    return {
        "global_board": {"enabled": False, "template": None, "project_filters": {}},
        "auto_collapse_empty_groups": False,
    }


def _with_defaults(stored):
    merged = default_settings()
    if not isinstance(stored, dict):
        return merged
    board = stored.get("global_board")
    if isinstance(board, dict):
        merged["global_board"].update(board)
        if not isinstance(merged["global_board"].get("project_filters"), dict):
            merged["global_board"]["project_filters"] = {}
    if isinstance(stored.get("auto_collapse_empty_groups"), bool):
        merged["auto_collapse_empty_groups"] = stored["auto_collapse_empty_groups"]
    return merged


class _Invalid(Exception):
    pass


def _is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


def _validate_template(template):
    if template is None:
        return None
    if not isinstance(template, dict):
        raise _Invalid("global_board.template must be an object or null")
    out = {}
    for key, value in template.items():
        if key not in TEMPLATE_KEYS:
            raise _Invalid(f"unknown template key: {key}")
        if key == "layout":
            if value is not None and not isinstance(value, str):
                raise _Invalid("template.layout must be a string or null")
        elif value is not None and not isinstance(value, dict):
            raise _Invalid(f"template.{key} must be an object or null")
        out[key] = value
    return out


def _apply_patch(current, data):
    """Return a new settings dict with ``data`` merged into ``current``. Raises _Invalid."""
    if not isinstance(data, dict) or not data:
        raise _Invalid("expected a non-empty object")
    result = copy.deepcopy(current)
    for key, value in data.items():
        if key == "auto_collapse_empty_groups":
            if not isinstance(value, bool):
                raise _Invalid("auto_collapse_empty_groups must be a boolean")
            result[key] = value
        elif key == "global_board":
            if not isinstance(value, dict):
                raise _Invalid("global_board must be an object")
            board = result["global_board"]
            for sub_key, sub_value in value.items():
                if sub_key == "enabled":
                    if not isinstance(sub_value, bool):
                        raise _Invalid("global_board.enabled must be a boolean")
                    board["enabled"] = sub_value
                elif sub_key == "template":
                    board["template"] = _validate_template(sub_value)
                elif sub_key == "project_filters":
                    if sub_value is None:
                        board["project_filters"] = {}
                        continue
                    if not isinstance(sub_value, dict):
                        raise _Invalid("global_board.project_filters must be an object")
                    filters = board["project_filters"]
                    for project_id, expression in sub_value.items():
                        if not _is_uuid(project_id):
                            raise _Invalid("global_board.project_filters keys must be project ids")
                        if expression is None:
                            filters.pop(project_id, None)
                        elif isinstance(expression, dict):
                            filters[project_id] = expression
                        else:
                            raise _Invalid("global_board.project_filters values must be objects or null")
                    if len(filters) > MAX_PROJECT_FILTERS:
                        raise _Invalid("too many project filters")
                else:
                    raise _Invalid(f"unknown global_board key: {sub_key}")
        else:
            raise _Invalid(f"unknown setting: {key}")
    if len(json.dumps(result)) > MAX_SETTINGS_BYTES:
        raise _Invalid("settings too large")
    return result


class UserBoardPreferencesEndpoint(BaseAPIView):
    def get(self, request):
        row = UserBoardPreference.objects.filter(user=request.user).first()
        if row is None:
            return Response({"settings": default_settings(), "version": 0}, status=status.HTTP_200_OK)
        return Response({"settings": _with_defaults(row.settings), "version": row.version}, status=status.HTTP_200_OK)

    def patch(self, request):
        user_id = request.user.id
        try:
            with transaction.atomic():
                row, _ = UserBoardPreference.objects.select_for_update().get_or_create(user_id=user_id)
                merged = _apply_patch(_with_defaults(row.settings), request.data)
                row.settings = merged
                row.version = row.version + 1
                row.save(update_fields=["settings", "version", "updated_at"])
                version = row.version
        except _Invalid as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"settings": merged, "version": version}, status=status.HTTP_200_OK)
