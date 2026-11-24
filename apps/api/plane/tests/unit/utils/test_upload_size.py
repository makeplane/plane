# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.upload import parse_upload_size


@pytest.mark.unit
@pytest.mark.parametrize(
    "value, expected",
    [
        (1024, 1024),
        ("53314", 53314),
        (2048.0, 2048),
        (1, 1),
        (0, None),
        (-5, None),
        ("-5", None),
        (1.5, None),
        ("1.5", None),
        ("abc", None),
        ("", None),
        (None, None),
        (True, None),
        (float("inf"), None),
        (float("nan"), None),
    ],
)
def test_parse_upload_size(value, expected):
    assert parse_upload_size(value) == expected
