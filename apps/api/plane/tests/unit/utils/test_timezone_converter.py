# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
import pytz

from plane.db.models import Project
from plane.utils.timezone_converter import convert_to_utc


@pytest.mark.unit
class TestConvertToUtcEndDate:
    """A cycle's end date is stored as 23:59 of that day in the project timezone."""

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "project_timezone, day",
        [
            ("America/New_York", "2027-06-15"),  # ordinary 24-hour day
            ("America/New_York", "2027-03-14"),  # clocks go forward: 23-hour day
            ("America/New_York", "2027-11-07"),  # clocks go back: 25-hour day
            ("Europe/Berlin", "2027-03-28"),  # clocks go forward: 23-hour day
            ("Asia/Kolkata", "2027-03-14"),  # no daylight saving time
        ],
    )
    def test_end_date_is_2359_of_the_same_project_day(self, workspace, create_user, project_timezone, day):
        project = Project.objects.create(
            name="Timezone Project",
            identifier="TZP",
            workspace=workspace,
            created_by=create_user,
            timezone=project_timezone,
        )

        end_date = convert_to_utc(date=day, project_id=project.id)

        assert end_date.utcoffset().total_seconds() == 0
        local_end_date = end_date.astimezone(pytz.timezone(project_timezone))
        assert local_end_date.strftime("%Y-%m-%d %H:%M") == f"{day} 23:59"
