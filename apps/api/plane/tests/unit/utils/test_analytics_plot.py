# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Point estimates are free text; ``burndown_plot`` called ``float()`` on them and
crashed with ``ValueError: could not convert string to float: 'M = 2'``."""

import pytest

from plane.utils.analytics_plot import _estimate_to_float


@pytest.mark.unit
@pytest.mark.parametrize(
    "value, expected",
    [("3", 3.0), ("2.5", 2.5), (5, 5.0), ("M = 2", 0.0), ("", 0.0), (None, 0.0)],
)
def test_estimate_to_float(value, expected):
    assert _estimate_to_float(value) == expected
