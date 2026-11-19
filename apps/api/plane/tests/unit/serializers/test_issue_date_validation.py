# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest

from plane.api.serializers.issue import IssueSerializer
from plane.app.serializers.issue import IssueCreateSerializer
from plane.db.models import Issue


@pytest.fixture(params=[IssueSerializer, IssueCreateSerializer], ids=["public-api", "app-api"])
def serializer_class(request):
    return request.param


@pytest.mark.unit
class TestIssueDateValidation:
    @pytest.mark.parametrize(
        "payload",
        [
            {"start_date": "2026-01-21"},
            {"target_date": "2026-01-09"},
        ],
    )
    def test_partial_update_rejects_invalid_range_against_existing_date(self, serializer_class, payload):
        issue = Issue(name="Scheduled work item", start_date=date(2026, 1, 10), target_date=date(2026, 1, 20))
        serializer = serializer_class(issue, data=payload, partial=True)

        assert not serializer.is_valid()
        assert serializer.errors["non_field_errors"] == ["Start date cannot exceed target date"]

    @pytest.mark.parametrize(
        "payload",
        [
            {"start_date": "2026-01-15"},
            {"target_date": "2026-01-15"},
            {"start_date": "2026-01-20"},
            {"target_date": "2026-01-10"},
            {"start_date": None},
            {"target_date": None},
            {"start_date": None, "target_date": None},
            {"start_date": "2026-02-01", "target_date": "2026-02-10"},
        ],
    )
    def test_partial_update_accepts_valid_ranges_and_clearing_dates(self, serializer_class, payload):
        issue = Issue(name="Scheduled work item", start_date=date(2026, 1, 10), target_date=date(2026, 1, 20))
        serializer = serializer_class(issue, data=payload, partial=True)

        assert serializer.is_valid(), serializer.errors
        for field, value in payload.items():
            assert serializer.validated_data[field] == (date.fromisoformat(value) if value else None)

    @pytest.mark.parametrize("field", ["start_date", "target_date"])
    def test_partial_update_accepts_date_when_other_date_is_unset(self, serializer_class, field):
        issue = Issue(name="Unscheduled work item")
        serializer = serializer_class(issue, data={field: "2026-01-10"}, partial=True)

        assert serializer.is_valid(), serializer.errors

    def test_unrelated_update_does_not_revalidate_existing_dates(self, serializer_class):
        issue = Issue(name="Legacy work item", start_date=date(2026, 1, 20), target_date=date(2026, 1, 10))
        serializer = serializer_class(issue, data={"name": "Renamed work item"}, partial=True)

        assert serializer.is_valid(), serializer.errors

    @pytest.mark.parametrize("partial", [False, True], ids=["create", "partial-update"])
    def test_rejects_invalid_range_with_both_dates_supplied(self, serializer_class, partial):
        serializer = serializer_class(
            instance=Issue(name="Existing work item") if partial else None,
            data={"name": "Scheduled work item", "start_date": "2026-01-20", "target_date": "2026-01-10"},
            partial=partial,
        )

        assert not serializer.is_valid()
        assert serializer.errors["non_field_errors"] == ["Start date cannot exceed target date"]

    @pytest.mark.parametrize(
        "dates",
        [
            {},
            {"start_date": "2026-01-10"},
            {"target_date": "2026-01-20"},
            {"start_date": "2026-01-10", "target_date": "2026-01-20"},
            {"start_date": "2026-01-10", "target_date": "2026-01-10"},
        ],
    )
    def test_create_accepts_valid_dates(self, serializer_class, dates):
        serializer = serializer_class(data={"name": "Scheduled work item", **dates})

        assert serializer.is_valid(), serializer.errors
