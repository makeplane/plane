# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A points estimate value counts as a number only when it is a plain non-negative decimal.

The SQL side of the same rule (``estimate_value_as_float``) needs Postgres and is covered in
``plane/tests/contract/app/test_points_estimate_numeric_app.py``.
"""

import pytest

from plane.utils.estimate import estimate_to_float, is_numeric_estimate


@pytest.mark.unit
@pytest.mark.parametrize("value", ["0", "3", "2.5", "3.", ".5", "007", " 2 ", 5, 2.5])
def test_numeric_estimate(value):
    assert is_numeric_estimate(value)
    assert estimate_to_float(value) == float(value)


@pytest.mark.unit
@pytest.mark.parametrize(
    "value",
    ["M = 2", "", " ", ".", "-1", "+1", "1e3", "NaN", "inf", "Infinity", "0x10", "1_000", "1,5", "1.2.3"]
    + ["3\n", "\t3", "\u0663", None, True],
)
def test_non_numeric_estimate(value):
    assert not is_numeric_estimate(value)
    assert estimate_to_float(value) == 0.0
