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

import inspect
from functools import wraps

from pi import logger
from pi import settings

log = logger.getChild("controllers.access_controls")

ACCESS_CONTROLLED_TOOL_NAMES = settings.ACCESS_CONTROLLED_TOOL_NAMES
GUEST_ROLE = 5


def _filter_tools(tools):
    filtered = [t for t in tools if t.name not in ACCESS_CONTROLLED_TOOL_NAMES]
    removed = [t.name for t in tools if t.name in ACCESS_CONTROLLED_TOOL_NAMES]
    if removed:
        log.warning(f"Access control: Removed tools {removed} from the tool list")
    return filtered


def _extract_is_guest(func, all_args, kwargs):
    """Return pre-fetched is_guest bool if available in context or query_flow_store, else None.

    Returns:
        True  — confirmed guest; caller should filter tools.
        False — confirmed non-guest; caller should pass tools through.
        None  — not found in fast-path sources; caller should fall back to a live DB lookup.

    None (undetermined) is treated as fail-safe True by the async/sync wrappers.
    """
    try:
        sig = inspect.signature(func)
        bound = sig.bind(*all_args, **kwargs)
        bound.apply_defaults()
        ba = bound.arguments
        # Check context dict (build mode tool functions)
        context = ba.get("context") or {}
        if "is_guest" in context:
            val = context["is_guest"]
            # None means the flag was set but undetermined — fail-safe to guest
            return True if val is None else bool(val)
        # Check query_flow_store (kit.py _create_tools / _create_tools_for_ask_mode)
        qfs = ba.get("query_flow_store") or {}
        if "is_guest" in qfs:
            val = qfs["is_guest"]
            return True if val is None else bool(val)
    except Exception as e:
        log.warning(f"Access control: _extract_is_guest failed for {func.__name__}: {e}, applying fail-safe filter")
        return True  # fail-safe: unknown guest status → filter
    return None


def _extract_user_context(func, all_args, kwargs):
    """Extract user_id, workspace_id, and project_id from a function call using signature inspection.

    Handles both direct parameters (user_id=, workspace_id=, project_id=) and context dicts
    (context={"user_id": ..., "workspace_id": ..., "project_id": ...}).
    """
    try:
        sig = inspect.signature(func)
        bound = sig.bind(*all_args, **kwargs)
        bound.apply_defaults()
        ba = bound.arguments

        user_id = ba.get("user_id")
        workspace_id = ba.get("workspace_id")
        project_id = ba.get("project_id")

        # Fall back to context dict (used by _build_planning_method_tools, get_unified_retrieval_tools)
        context = ba.get("context") or {}
        user_id = user_id or context.get("user_id")
        workspace_id = workspace_id or context.get("workspace_id")
        project_id = project_id or context.get("project_id")

        return user_id, workspace_id, project_id
    except Exception as e:
        log.warning(f"Access control: Could not extract user context from {func.__name__}: {e}")
        return None, None, None


def access_control(func):
    """
    Decorator to enforce access control on tool-returning functions.

    Filters ACCESS_CONTROLLED_TOOL_NAMES only when the user is a guest (role=5).
    Non-guest users receive the full tool list unchanged.

    Falls back to filtering if user_id/workspace_id cannot be extracted or the DB
    is unreachable (fail-safe: deny rather than allow).

    Supports both sync and async decorated functions, including module-level functions
    (where the first positional arg is not a class instance).
    """
    if inspect.iscoroutinefunction(func):

        @wraps(func)
        async def wrapper(*args, **kwargs):
            tools = await func(*args, **kwargs)

            # Fast path: use pre-fetched is_guest flag if available (avoids DB lookup)
            is_guest = _extract_is_guest(func, args, kwargs)
            if is_guest is not None:
                if is_guest:
                    log.info(f"Access control: Pre-fetched guest flag for {func.__name__}, filtering tools")
                    return _filter_tools(tools)
                return tools

            # Fallback: live DB lookup
            from pi.app.api.v1.helpers.plane_sql_queries import get_user_project_role
            from pi.app.api.v1.helpers.plane_sql_queries import get_user_workspace_role

            user_id, workspace_id, project_id = _extract_user_context(func, args, kwargs)

            if not user_id or not workspace_id:
                log.warning(f"Access control: Missing user/workspace context in {func.__name__}, applying filter")
                return _filter_tools(tools)

            workspace_role = await get_user_workspace_role(str(user_id), str(workspace_id))
            if workspace_role is None or workspace_role == GUEST_ROLE:
                log.info(f"Access control: Guest workspace role ({workspace_role}) for user {user_id}, filtering tools")
                return _filter_tools(tools)

            if project_id:
                project_role = await get_user_project_role(str(user_id), str(project_id))
                if project_role is None or project_role == GUEST_ROLE:
                    log.info(f"Access control: Guest project role ({project_role}) for user {user_id}, filtering tools")
                    return _filter_tools(tools)

            return tools
    else:

        @wraps(func)
        def wrapper(*args, **kwargs):
            tools = func(*args, **kwargs)

            # Fast path: use pre-fetched is_guest flag if available (avoids DB lookup)
            is_guest = _extract_is_guest(func, args, kwargs)
            if is_guest is not None:
                if is_guest:
                    log.info(f"Access control: Pre-fetched guest flag for {func.__name__}, filtering tools")
                    return _filter_tools(tools)
                return tools

            # Fallback: live DB lookup
            from pi.app.api.v1.helpers.plane_sql_queries import get_user_project_role_sync
            from pi.app.api.v1.helpers.plane_sql_queries import get_user_workspace_role_sync

            user_id, workspace_id, project_id = _extract_user_context(func, args, kwargs)

            if not user_id or not workspace_id:
                log.warning(f"Access control: Missing user/workspace context in {func.__name__}, applying filter")
                return _filter_tools(tools)

            workspace_role = get_user_workspace_role_sync(str(user_id), str(workspace_id))
            if workspace_role is None or workspace_role == GUEST_ROLE:
                log.info(f"Access control: Guest workspace role ({workspace_role}) for user {user_id}, filtering tools")
                return _filter_tools(tools)

            if project_id:
                project_role = get_user_project_role_sync(str(user_id), str(project_id))
                if project_role is None or project_role == GUEST_ROLE:
                    log.info(f"Access control: Guest project role ({project_role}) for user {user_id}, filtering tools")
                    return _filter_tools(tools)

            return tools

    return wrapper
