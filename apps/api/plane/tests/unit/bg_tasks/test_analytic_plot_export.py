# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.bgtasks.analytic_plot_export import (
    MODULE_ID,
    generate_segmented_rows,
)


@pytest.mark.unit
class TestGenerateSegmentedRows:
    def test_module_segment_headers_use_module_names(self):
        rows = generate_segmented_rows(
            distribution={
                "High": [
                    {
                        "segment": "module-1",
                        "issue_count": 3,
                    }
                ]
            },
            x_axis="priority",
            y_axis="issue_count",
            segment=MODULE_ID,
            key="issue_count",
            assignee_details=[],
            label_details=[],
            state_details=[],
            cycle_details=[],
            module_details=[
                {
                    MODULE_ID: "module-1",
                    "issue_module__module__name": "Launch Plan",
                }
            ],
        )

        assert rows[0] == ("Priority", "Issue Count", "Launch Plan")
