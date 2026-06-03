# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Canonical god-mode menu permission registry (route-group enforcement).

Every URL under /api/instances/ must resolve to a menu key through
PREFIX_MENU_MAP or sit in the shared allowlist — anything else is denied
for scoped admins (fail-closed). Scoping by URL prefix (one entry per
router group in license/urls.py) instead of per-view annotation keeps a
single source of truth and covers endpoints whose view class lives
outside license/api/views (e.g. the Swing SSO test endpoint).

The frontend sidebar mirrors PERMISSION_KEYS — keep both in sync.
"""

# The 12 grantable menu keys. NOTE: general/email/ai/image/authentication
# config screens all persist through the single InstanceConfigurationEndpoint,
# so they are enforceable only as the grouped "settings" key — there is no
# standalone "authentication" permission.
PERMISSION_KEYS = [
    "settings",
    "workspace",
    "users",
    "departments",
    "staff",
    "monitoring",
    "task-categories",
    "help-center",
    "job-positions",
    "calendar",
    "usage-monitor",
    "administrators",
]

ALL_PERMISSION_KEYS = list(PERMISSION_KEYS)

INSTANCE_API_ROOT = "/api/instances/"

# (url-prefix relative to INSTANCE_API_ROOT, menu key) — longest-prefix match.
PREFIX_MENU_MAP = [
    ("admins/", "administrators"),
    ("configurations/", "settings"),
    ("email-credentials-check/", "settings"),
    ("swing-sso/", "settings"),
    ("workspace-slug-check/", "workspace"),
    ("workspaces/", "workspace"),
    ("bulk-import-projects/", "workspace"),
    ("bulk-import-modules/", "workspace"),
    ("users/", "users"),
    ("departments/", "departments"),
    ("staff/", "staff"),
    ("task-categories/", "task-categories"),
    ("help/", "help-center"),
    ("job-positions/", "job-positions"),
    ("calendar/", "calendar"),
    ("monitoring/", "monitoring"),
    ("usage-monitor/", "usage-monitor"),
]

# Identity/session endpoints any instance admin may reach regardless of
# granted menus (prefix match, checked before menu resolution).
SHARED_PREFIXES = [
    "admins/me/",
    "admins/session/",
    "admins/sign-in/",
    "admins/sign-up/",
    "admins/sign-out/",
    "admins/sign-up-screen-visited/",
]

# Exact relative-path mappings checked before the prefix walk. The root
# ("" = /api/instances/) is the instance-settings PATCH target; mapping it
# as a prefix would catch-all every path and defeat fail-closed. Root GET
# stays public via the view's own AllowAny.
EXACT_MENU_MAP = {"": "settings"}


def _relative_instance_path(path):
    """Return the path relative to /api/instances/, or None if outside it."""
    if not path.startswith(INSTANCE_API_ROOT):
        return None
    return path[len(INSTANCE_API_ROOT) :]


def is_shared_path(path):
    relative = _relative_instance_path(path)
    if relative is None:
        return False
    return any(relative.startswith(prefix) for prefix in SHARED_PREFIXES)


def required_menu_for_path(path):
    """Longest-prefix match of the path against PREFIX_MENU_MAP.

    Returns the menu key, or None when the path is outside /api/instances/
    or matches no route group (callers must treat None as deny for scoped
    admins — fail-closed).
    """
    relative = _relative_instance_path(path)
    if relative is None:
        return None
    if relative in EXACT_MENU_MAP:
        return EXACT_MENU_MAP[relative]
    best_menu = None
    best_length = -1
    for prefix, menu in PREFIX_MENU_MAP:
        if relative.startswith(prefix) and len(prefix) > best_length:
            best_menu = menu
            best_length = len(prefix)
    return best_menu
