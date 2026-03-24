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
from pydantic import ValidationError as PydanticValidationError


@pytest.mark.unit
class TestScheduledTriggerParams:

    def test_fixed_daily(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(method="fixed", frequency="daily", hour=9, minute=0)
        assert params.frequency == "daily"
        assert params.hour == 9

    def test_fixed_weekly(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(
            method="fixed", frequency="weekly", days=["mon", "fri"], hour=10, minute=30
        )
        assert params.days == ["mon", "fri"]

    def test_fixed_monthly(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(
            method="fixed", frequency="monthly", day_of_month=15, hour=9, minute=0
        )
        assert params.day_of_month == 15

    def test_fixed_yearly(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(
            method="fixed", frequency="yearly", month=3, day_of_month=15, hour=9, minute=0
        )
        assert params.month == 3
        assert params.day_of_month == 15

    def test_cron_valid(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(method="cron", cron_expression="0 9 * * 1-5")
        assert params.cron_expression == "0 9 * * 1-5"

    def test_cron_missing_expression(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="cron")

    def test_cron_invalid_expression(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="cron", cron_expression="not valid")

    def test_fixed_missing_frequency(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="fixed", hour=9, minute=0)

    def test_fixed_missing_time(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="fixed", frequency="daily")

    def test_weekly_missing_days(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="fixed", frequency="weekly", hour=9, minute=0)

    def test_monthly_missing_day_of_month(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="fixed", frequency="monthly", hour=9, minute=0)

    def test_yearly_missing_month(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(
                method="fixed", frequency="yearly", day_of_month=15, hour=9, minute=0
            )

    def test_invalid_day_of_month(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(
                method="fixed", frequency="monthly", day_of_month=32, hour=9, minute=0
            )

    def test_invalid_hour(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(method="fixed", frequency="daily", hour=25, minute=0)

    def test_timezone_valid(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        params = ScheduledTriggerParams(
            method="fixed", frequency="daily", hour=9, minute=0, timezone="Asia/Kolkata"
        )
        assert params.timezone == "Asia/Kolkata"

    def test_timezone_invalid(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(
                method="fixed", frequency="daily", hour=9, minute=0, timezone="Not/Real"
            )

    def test_invalid_day_name(self):
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        with pytest.raises(PydanticValidationError):
            ScheduledTriggerParams(
                method="fixed", frequency="weekly", days=["monday"], hour=9, minute=0
            )


@pytest.mark.unit
class TestScheduledTriggerExecute:

    def test_execute_fixed(self):
        from plane.automations.nodes.triggers import ScheduledTrigger

        trigger = ScheduledTrigger(method="fixed", frequency="daily", hour=9, minute=0)
        result = trigger.execute(
            {"event_type": "automation.scheduled", "workspace_id": "ws-1"},
            {"automation_id": "auto-1"},
        )
        assert result["success"] is True
        assert result["action"] == "scheduled"

    def test_execute_cron(self):
        from plane.automations.nodes.triggers import ScheduledTrigger

        trigger = ScheduledTrigger(method="cron", cron_expression="0 9 * * *")
        result = trigger.execute(
            {"event_type": "automation.scheduled", "workspace_id": "ws-1"},
            {"automation_id": "auto-1"},
        )
        assert result["success"] is True
