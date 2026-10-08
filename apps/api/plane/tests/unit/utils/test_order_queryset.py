# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.order_queryset import ISSUE_GROUP_BY_ALLOWLIST, sanitize_order_by


@pytest.mark.unit
class TestIssueGroupByAllowlist:
    """Regression tests for GHSA-wwgj-929g-42cm.

    ISSUE_GROUP_BY_ALLOWLIST must contain exactly the field names that
    `issue_group_values()` (plane/utils/grouper.py and
    plane/space/utils/grouper.py) knows how to resolve safely. Anything
    outside this set must never reach the ORM as a raw field name via
    GroupedOffsetPaginator/SubGroupedOffsetPaginator.
    """

    def test_allowlist_matches_known_safe_group_fields(self):
        expected = {
            "state_id",
            "state__group",
            "priority",
            "labels__id",
            "assignees__id",
            "issue_module__module_id",
            "cycle_id",
            "project_id",
            "created_by",
            "target_date",
            "start_date",
        }
        assert ISSUE_GROUP_BY_ALLOWLIST == frozenset(expected)

    def test_allowlist_rejects_injection_style_fields(self):
        # These are exactly the kind of values GHSA-wwgj-929g-42cm's PoC used
        # to trigger a 500 / force a blind relational-traversal oracle.
        dangerous_values = [
            "not_a_field",
            "created_by__password",
            "workspace__secret_key",
            "assignees__password",
            "id",
            "",
            None,
        ]
        for value in dangerous_values:
            assert value not in ISSUE_GROUP_BY_ALLOWLIST


@pytest.mark.unit
class TestSanitizeOrderByStillWorks:
    """Sanity check that the pre-existing order_by sanitizer (GHSA-2r95 /
    GHSA-w45q) is untouched by this change."""

    def test_valid_field_passes_through(self):
        allowed = frozenset({"created_at", "priority"})
        assert sanitize_order_by("priority", allowed) == "priority"
        assert sanitize_order_by("-created_at", allowed) == "-created_at"

    def test_invalid_field_falls_back_to_default(self):
        allowed = frozenset({"created_at"})
        assert sanitize_order_by("not_a_field", allowed, default="-created_at") == "-created_at"
