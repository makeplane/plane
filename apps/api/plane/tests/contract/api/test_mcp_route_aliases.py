# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the v1 route aliases that keep the official MCP SDK
(plane_sdk) working: it calls work items under the `work-items/` prefix and
custom properties under the `work-item-properties` resource segment, whereas
the modules originally registered `issues/` and `properties/`."""

import pytest
from django.urls import resolve

_P = "/api/v1/workspaces/ws/projects/11111111-1111-1111-1111-111111111111"
_U = "22222222-2222-2222-2222-222222222222"

# (path, expected resolved view name) — the SDK paths that must resolve.
ALIAS_CASES = [
    (f"{_P}/work-items/{_U}/pages/", "work-item-page-link-list-alias"),
    (f"{_P}/work-items/{_U}/pages/{_U}/", "work-item-page-link-detail-alias"),
    (f"{_P}/work-item-types/{_U}/work-item-properties/", "work-item-properties-alias"),
    (f"{_P}/work-item-types/{_U}/work-item-properties/{_U}/", "work-item-properties-detail-alias"),
    (f"{_P}/work-item-properties/{_U}/options/", "work-item-property-options-alias"),
    (f"{_P}/work-item-properties/{_U}/options/{_U}/", "work-item-property-options-detail-alias"),
    (f"{_P}/work-items/{_U}/work-item-properties/{_U}/values/", "work-item-property-values-alias"),
]


@pytest.mark.contract
@pytest.mark.parametrize("path, expected_name", ALIAS_CASES)
def test_mcp_sdk_path_resolves(path, expected_name):
    """Every SDK-facing path resolves to the aliased v1 view."""
    match = resolve(path)
    assert match.url_name == expected_name


@pytest.mark.contract
def test_legacy_paths_still_resolve():
    """The original (pre-alias) paths must keep working — additive change only."""
    assert resolve(f"{_P}/issues/{_U}/pages/").url_name == "work-item-page-link-list"
    assert resolve(f"{_P}/work-item-types/{_U}/properties/").url_name == "work-item-properties"
