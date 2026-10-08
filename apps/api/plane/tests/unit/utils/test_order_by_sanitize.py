# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for order_by injection on the external REST API.

Covers GHSA-p885-6jpg-cr2p: the external-API project list and work-item
list endpoints passed a raw ``order_by`` query parameter to Django's
``.order_by()``. Because Django resolves ``__``-separated relational paths,
an attacker could order by sensitive columns on related tables
(``created_by__password``, ``created_by__token``, ``created_by__email``,
``workspace__owner__password`` ...) to build a blind ordering oracle, or
crash the endpoint (HTTP 500) with an unknown field.

The fix routes both endpoints through ``sanitize_order_by()`` with the
appropriate allowlist. These tests assert that the two allowlists used by
those endpoints neutralise the disclosed attack strings and preserve every
legitimate ordering value.
"""

import pytest

from plane.utils.order_queryset import (
    ISSUE_ORDER_BY_ALLOWLIST,
    PROJECT_ORDER_BY_ALLOWLIST,
    sanitize_order_by,
)

# Relational-traversal payloads from the advisory PoC plus common variants.
INJECTION_PAYLOADS = [
    "created_by__password",
    "created_by__token",
    "created_by__email",
    "-created_by__password",
    "workspace__owner__password",
    "updated_by__password",
    "not_a_field",
    "id; drop table",
    "--created_at",  # malformed double-dash prefix
]


@pytest.mark.unit
class TestProjectOrderBySanitization:
    """order_by sanitization for GET /api/v1/workspaces/<slug>/projects/."""

    DEFAULT = "sort_order"

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_injection_payload_falls_back_to_default(self, payload):
        """Any non-allowlisted / relational value is replaced with the
        endpoint's safe default instead of reaching .order_by()."""
        assert (
            sanitize_order_by(payload, PROJECT_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == self.DEFAULT
        )

    @pytest.mark.parametrize(
        "value",
        ["created_at", "updated_at", "name", "network", "sort_order"],
    )
    def test_legitimate_ascending_values_pass_through(self, value):
        assert (
            sanitize_order_by(value, PROJECT_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == value
        )

    @pytest.mark.parametrize(
        "value",
        ["-created_at", "-updated_at", "-name", "-network", "-sort_order"],
    )
    def test_legitimate_descending_values_pass_through(self, value):
        assert (
            sanitize_order_by(value, PROJECT_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == value
        )

    def test_empty_value_uses_default(self):
        assert (
            sanitize_order_by("", PROJECT_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == self.DEFAULT
        )


@pytest.mark.unit
class TestIssueOrderBySanitization:
    """order_by sanitization for
    GET /api/v1/workspaces/<slug>/projects/<project_id>/issues/."""

    DEFAULT = "-created_at"

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_injection_payload_falls_back_to_default(self, payload):
        assert (
            sanitize_order_by(payload, ISSUE_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == self.DEFAULT
        )

    @pytest.mark.parametrize(
        "value",
        [
            "created_at",
            "updated_at",
            "sequence_id",
            "sort_order",
            "target_date",
            "start_date",
            "priority",
            "state__name",
            "state__group",
            "assignees__first_name",
            "labels__name",
        ],
    )
    def test_legitimate_values_pass_through(self, value):
        """Every value the endpoint's branch logic special-cases must survive
        sanitization, otherwise legitimate ordering would silently break."""
        assert (
            sanitize_order_by(value, ISSUE_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == value
        )
        # Descending variant is equally valid.
        assert (
            sanitize_order_by(f"-{value}", ISSUE_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == f"-{value}"
        )

    def test_default_is_preserved_for_missing_param(self):
        assert (
            sanitize_order_by(None, ISSUE_ORDER_BY_ALLOWLIST, default=self.DEFAULT)
            == self.DEFAULT
        )
