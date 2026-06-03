# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Menu registry invariants (fail-closed coverage).

Build-failing guarantees:
- every URL pattern reachable under /api/instances/ resolves to a
  PREFIX_MENU_MAP/EXACT_MENU_MAP entry or a shared prefix — an unmapped
  route would silently deny scoped admins (or worse, be forgotten);
- no resolved view still enforces the bare pre-RBAC InstanceAdminPermission;
- frontend permission keys (apps/admin sidebar registry) mirror the
  backend PERMISSION_KEYS exactly.
"""

import re
import uuid
from pathlib import Path

import pytest
from django.urls.resolvers import URLPattern, URLResolver

from plane.license import urls as license_urls
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.menu_registry import (
    EXACT_MENU_MAP,
    PERMISSION_KEYS,
    PREFIX_MENU_MAP,
    is_shared_path,
    required_menu_for_path,
)

REPO_ROOT = Path(__file__).resolve().parents[5]
FRONTEND_CORE_TS = REPO_ROOT / "apps" / "admin" / "hooks" / "use-sidebar-menu" / "core.ts"

# Substitutions to turn a route pattern into a concrete example path.
_PARAM_RE = re.compile(r"<(?:[^:>]+:)?([^>]+)>")
_PARAM_SAMPLES = {"slug": "example-slug", "locale": "en"}


def _example_path(route: str) -> str:
    def _sub(match):
        name = match.group(1)
        return _PARAM_SAMPLES.get(name, str(uuid.uuid4()))

    return _PARAM_RE.sub(_sub, route)


def _walk_patterns(patterns, prefix=""):
    """Yield (route, view_callback) for every URL pattern, recursively."""
    for entry in patterns:
        if isinstance(entry, URLResolver):
            yield from _walk_patterns(entry.url_patterns, prefix + str(entry.pattern))
        elif isinstance(entry, URLPattern):
            yield prefix + str(entry.pattern), entry.callback


@pytest.mark.unit
class TestRouteGroupCoverage:
    def test_every_instance_route_is_mapped_or_shared(self):
        unmapped = []
        for route, _callback in _walk_patterns(license_urls.urlpatterns):
            path = f"/api/instances/{_example_path(route)}"
            if is_shared_path(path):
                continue
            if required_menu_for_path(path) is None:
                unmapped.append(route)
        assert unmapped == [], (
            f"Routes under /api/instances/ with no menu mapping (fail-closed "
            f"denial for scoped admins — add to PREFIX_MENU_MAP or SHARED_PREFIXES): {unmapped}"
        )

    def test_no_view_still_uses_bare_instance_admin_permission(self):
        offenders = []
        for route, callback in _walk_patterns(license_urls.urlpatterns):
            view_class = getattr(callback, "view_class", None) or getattr(callback, "cls", None)
            if view_class is None:
                continue
            permission_classes = getattr(view_class, "permission_classes", [])
            if InstanceAdminPermission in permission_classes:
                offenders.append(f"{route} -> {view_class.__name__}")
        assert offenders == [], f"Views still enforcing the pre-RBAC all-admin permission: {offenders}"


@pytest.mark.unit
class TestRegistryInvariants:
    def test_prefix_map_values_are_known_keys(self):
        assert {menu for _prefix, menu in PREFIX_MENU_MAP} <= set(PERMISSION_KEYS)
        assert set(EXACT_MENU_MAP.values()) <= set(PERMISSION_KEYS)

    def test_canonical_key_set(self):
        assert len(PERMISSION_KEYS) == 12
        assert "administrators" in PERMISSION_KEYS
        assert "settings" in PERMISSION_KEYS
        # authentication shares the configurations endpoint — never standalone
        assert "authentication" not in PERMISSION_KEYS

    def test_prefixes_are_unique(self):
        prefixes = [prefix for prefix, _menu in PREFIX_MENU_MAP]
        assert len(prefixes) == len(set(prefixes))


@pytest.mark.unit
class TestFrontendBackendParity:
    def test_frontend_permission_keys_mirror_backend(self):
        text = FRONTEND_CORE_TS.read_text(encoding="utf-8")
        match = re.search(
            r"export const PERMISSION_KEYS: TPermissionKey\[\] = \[(.*?)\];",
            text,
            re.DOTALL,
        )
        assert match, "PERMISSION_KEYS array not found in admin sidebar registry"
        frontend_keys = re.findall(r'"([a-z-]+)"', match.group(1))
        assert frontend_keys == PERMISSION_KEYS, (
            "Frontend sidebar permission keys diverge from backend "
            "plane/license/menu_registry.py PERMISSION_KEYS"
        )

    def test_frontend_items_only_use_known_permissions(self):
        text = FRONTEND_CORE_TS.read_text(encoding="utf-8")
        item_permissions = set(re.findall(r'permission: "([a-z-]+)"', text))
        assert item_permissions <= set(PERMISSION_KEYS)
