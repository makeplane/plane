# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.filters.converters import LegacyToRichFiltersConverter


@pytest.mark.unit
class TestLegacyToRichFiltersConverterDateOrdering:
    """
    _convert_date_value must order date range bounds chronologically,
    not lexicographically. See: https://github.com/makeplane/plane/issues/9567
    """

    def setup_method(self):
        self.converter = LegacyToRichFiltersConverter()

    def test_non_iso_date_range_is_ordered_chronologically(self):
        # '9/1/2023' (Sep 1) < '10/1/2023' (Oct 1) chronologically, but
        # '10/1/2023' < '9/1/2023' lexicographically ('1' < '9').
        # The old code used string min/max and produced a reversed range.
        result = self.converter._convert_date_value(
            "target_date",
            ["9/1/2023;after", "10/1/2023;before"],
        )
        assert result["target_date__range"] == "2023-09-01,2023-10-01"

    def test_iso_date_range_still_works(self):
        result = self.converter._convert_date_value(
            "target_date",
            ["2023-09-01;after", "2023-12-31;before"],
        )
        assert result["target_date__range"] == "2023-09-01,2023-12-31"