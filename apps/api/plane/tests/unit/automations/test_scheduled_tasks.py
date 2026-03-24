# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from datetime import datetime, timezone as dt_timezone
from unittest.mock import Mock


@pytest.mark.unit
class TestFixedToCron:

    def test_daily(self):
        from plane.automations.tasks import fixed_to_cron

        assert fixed_to_cron({"frequency": "daily", "hour": 9, "minute": 0}) == "0 9 * * *"

    def test_weekly_single_day(self):
        from plane.automations.tasks import fixed_to_cron

        result = fixed_to_cron({"frequency": "weekly", "days": ["mon"], "hour": 10, "minute": 30})
        assert result == "30 10 * * 1"

    def test_weekly_multiple_days(self):
        from plane.automations.tasks import fixed_to_cron

        result = fixed_to_cron({"frequency": "weekly", "days": ["mon", "wed", "fri"], "hour": 9, "minute": 0})
        assert result == "0 9 * * 1,3,5"

    def test_monthly(self):
        from plane.automations.tasks import fixed_to_cron

        result = fixed_to_cron({"frequency": "monthly", "day_of_month": 15, "hour": 9, "minute": 0})
        assert result == "0 9 15 * *"

    def test_yearly(self):
        from plane.automations.tasks import fixed_to_cron

        result = fixed_to_cron({"frequency": "yearly", "month": 3, "day_of_month": 15, "hour": 9, "minute": 0})
        assert result == "0 9 15 3 *"


@pytest.mark.unit
class TestResolveTimezone:

    def test_uses_config_timezone(self):
        from plane.automations.tasks import resolve_timezone

        project = Mock(timezone="US/Eastern")
        assert resolve_timezone({"timezone": "Asia/Kolkata"}, project) == "Asia/Kolkata"

    def test_falls_back_to_project(self):
        from plane.automations.tasks import resolve_timezone

        project = Mock(timezone="US/Eastern")
        assert resolve_timezone({}, project) == "US/Eastern"

    def test_falls_back_to_workspace(self):
        from plane.automations.tasks import resolve_timezone

        workspace = Mock(timezone="Europe/London")
        project = Mock(timezone=None, workspace=workspace)
        assert resolve_timezone({}, project) == "Europe/London"

    def test_falls_back_to_utc(self):
        from plane.automations.tasks import resolve_timezone

        workspace = Mock(timezone=None)
        project = Mock(timezone=None, workspace=workspace)
        assert resolve_timezone({}, project) == "UTC"


@pytest.mark.unit
class TestComputeNextScheduledAt:

    def test_cron_next_fire(self):
        from plane.automations.tasks import compute_next_scheduled_at

        current = datetime(2026, 3, 24, 8, 0, 0, tzinfo=dt_timezone.utc)
        config = {"method": "cron", "cron_expression": "0 9 * * *"}
        project = Mock(timezone="UTC")

        result = compute_next_scheduled_at(config, project, current=current)
        assert result.hour == 9
        assert result.minute == 0
        assert result > current

    def test_fixed_daily(self):
        from plane.automations.tasks import compute_next_scheduled_at

        current = datetime(2026, 3, 24, 8, 0, 0, tzinfo=dt_timezone.utc)
        config = {"method": "fixed", "frequency": "daily", "hour": 9, "minute": 0}
        project = Mock(timezone="UTC")

        result = compute_next_scheduled_at(config, project, current=current)
        assert result.hour == 9

    def test_cron_with_timezone(self):
        from plane.automations.tasks import compute_next_scheduled_at

        current = datetime(2026, 3, 24, 2, 0, 0, tzinfo=dt_timezone.utc)
        config = {"method": "cron", "cron_expression": "0 9 * * *", "timezone": "Asia/Kolkata"}
        project = Mock(timezone="UTC")

        result = compute_next_scheduled_at(config, project, current=current)
        assert result.astimezone(dt_timezone.utc).hour == 3
        assert result.astimezone(dt_timezone.utc).minute == 30
