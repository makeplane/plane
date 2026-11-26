# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.issue_filters import filter_intake_status, filter_updated_at, issue_filters


@pytest.mark.unit
class TestFilterUpdatedAt:
    """Regression test for the "Updated At" filter bug — the filter was
    applying to the `created_at` column instead of `updated_at`, so work
    items updated today but created earlier never showed up under
    `Updated At -> is -> today`. See issue #9316."""

    def test_get_method_targets_updated_at_column(self):
        issue_filter = {}
        params = {"updated_at": "2026-06-26"}
        filter_updated_at(params, issue_filter, method="GET")
        # The filter must key on updated_at, not created_at. A bare date goes through
        # date_filter's single-value branch, which appends a lookup suffix
        # (updated_at__date__contains), so match on the prefix rather than the exact key.
        assert any(key.startswith("updated_at__date") for key in issue_filter)
        assert not any("created_at" in key for key in issue_filter)

    def test_get_method_with_csv_targets_updated_at_column(self):
        issue_filter = {}
        params = {"updated_at": "2026-06-25,2026-06-26"}
        filter_updated_at(params, issue_filter, method="GET")
        assert all("updated_at" in key for key in issue_filter)
        assert not any("created_at" in key for key in issue_filter)

    def test_post_method_targets_updated_at_column(self):
        issue_filter = {}
        params = {"updated_at": ["2026-06-26"]}
        filter_updated_at(params, issue_filter, method="POST")
        assert all("updated_at" in key for key in issue_filter)
        assert not any("created_at" in key for key in issue_filter)

    def test_get_method_with_prefix_targets_updated_at_column(self):
        issue_filter = {}
        params = {"updated_at": "2026-06-26"}
        filter_updated_at(params, issue_filter, method="GET", prefix="cycle_issue__")
        keys = list(issue_filter)
        assert any("cycle_issue__updated_at" in k for k in keys)
        assert not any("created_at" in k for k in keys)

    def test_empty_get_filter_is_noop(self):
        issue_filter = {}
        params = {"updated_at": ""}
        filter_updated_at(params, issue_filter, method="GET")
        assert issue_filter == {}


@pytest.mark.unit
class TestFilterIntakeStatus:
    """Regression test for the "intake_status" filter on non-GET requests — the
    POST/PATCH branch read the legacy `inbox_status` key instead of
    `intake_status`, so saved views and analytics persisted
    `issue_intake__status__in = None` and dropped the selected statuses."""

    def test_get_method_with_csv_filters_by_status(self):
        issue_filter = {}
        params = {"intake_status": "-2,0"}
        filter_intake_status(params, issue_filter, method="GET")
        assert issue_filter == {"issue_intake__status__in": ["-2", "0"]}

    def test_post_method_reads_intake_status_key(self):
        issue_filter = {}
        params = {"intake_status": [-2, 0]}
        filter_intake_status(params, issue_filter, method="POST")
        assert issue_filter == {"issue_intake__status__in": [-2, 0]}

    def test_post_method_with_prefix_reads_intake_status_key(self):
        issue_filter = {}
        params = {"intake_status": [1]}
        filter_intake_status(params, issue_filter, method="POST", prefix="issue__")
        assert issue_filter == {"issue__issue_intake__status__in": [1]}

    def test_post_method_with_null_is_noop(self):
        issue_filter = {}
        params = {"intake_status": "null"}
        filter_intake_status(params, issue_filter, method="POST")
        assert issue_filter == {}

    @pytest.mark.parametrize("method", ["POST", "PATCH"])
    def test_issue_filters_persists_intake_status(self, method):
        assert issue_filters({"intake_status": [1, 2]}, method) == {"issue_intake__status__in": [1, 2]}
