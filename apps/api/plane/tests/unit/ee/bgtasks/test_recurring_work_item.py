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
from unittest.mock import patch
from datetime import datetime
from uuid import uuid4

import pytz

from plane.db.models import Workspace, Project, WorkspaceMember
from plane.ee.models import RecurringWorkitemTask, WorkitemTemplate, Template, ProjectTemplate


@pytest.fixture
def workspace(db, create_user):
    """Create and return a workspace instance"""
    workspace = Workspace.objects.create(
        name="Test Workspace",
        slug="test-workspace",
        id=uuid4(),
        owner=create_user,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    return workspace


@pytest.fixture
def project_utc(db, workspace, create_user):
    """Create and return a project with UTC timezone"""
    return Project.objects.create(
        name="Test Project UTC",
        identifier="TPUTC",
        workspace=workspace,
        created_by=create_user,
        timezone="UTC",
    )


@pytest.fixture
def project_ist(db, workspace, create_user):
    """Create and return a project with IST timezone"""
    return Project.objects.create(
        name="Test Project IST",
        identifier="TPIST",
        workspace=workspace,
        created_by=create_user,
        timezone="Asia/Kolkata",
    )


@pytest.fixture
def project_pst(db, workspace, create_user):
    """Create and return a project with PST timezone"""
    return Project.objects.create(
        name="Test Project PST",
        identifier="TPPST",
        workspace=workspace,
        created_by=create_user,
        timezone="America/Los_Angeles",
    )


@pytest.fixture
def template(db, workspace, create_user):
    """Create and return a template instance"""
    return Template.objects.create(
        workspace=workspace,
        name="Test Template",
        description="A test template",
        created_by=create_user,
        template_type=Template.TemplateType.PROJECT,
    )


@pytest.fixture
def project_template(db, template, workspace, create_user):
    """Create and return a project template instance"""
    return ProjectTemplate.objects.create(
        template=template,
        workspace=workspace,
        name="Test Project Template",
        description="A test project template",
        created_by=create_user,
        states=[],
    )


@pytest.fixture
def workitem_template_utc(db, project_template, workspace, create_user):
    """Create and return a workitem template linked to UTC project"""
    return WorkitemTemplate.objects.create(
        project_template=project_template,
        name="Test Workitem",
        description={"type": "doc", "content": [{"type": "paragraph"}]},
        description_html="<p>Test workitem description</p>",
        description_stripped="Test workitem description",
        created_by=create_user,
        workspace=workspace,
    )


@pytest.mark.unit
class TestAdvanceToNextSchedule:
    """Test cases for advance_to_next_schedule method"""

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_advance_to_next_schedule_normalizes_to_0005_utc(
        self,
        mock_save,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that advance_to_next_schedule normalizes to 00:05 in UTC timezone"""
        # Arrange - create a task with start_at at 00:00 UTC
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 0, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=1,
            next_scheduled_at=start_at,
            created_by=create_user,
        )
        # Manually set the ID and _state to simulate an existing instance
        task.id = uuid4()
        task._state.adding = False

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 UTC on the next day
        expected = pytz.UTC.localize(datetime(2026, 1, 16, 0, 5, 0))
        assert result == expected
        assert task.next_scheduled_at == expected

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_advance_to_next_schedule_normalizes_to_0005_ist(
        self,
        mock_save,
        project_ist,
        workitem_template_utc,
        create_user,
    ):
        """Test that advance_to_next_schedule normalizes to 00:05 in IST timezone"""
        # Arrange - IST is UTC+5:30, so 00:05 IST = 18:35 UTC (previous day)
        ist = pytz.timezone("Asia/Kolkata")
        # Start at 00:05 IST on Jan 15
        start_at_local = ist.localize(datetime(2026, 1, 15, 0, 5, 0))
        start_at_utc = start_at_local.astimezone(pytz.UTC)

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_ist,
            workspace=project_ist.workspace,
            start_at=start_at_utc,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=1,
            next_scheduled_at=start_at_utc,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 IST on the next day (Jan 16)
        # 00:05 IST on Jan 16 = 18:35 UTC on Jan 15
        expected_local = ist.localize(datetime(2026, 1, 16, 0, 5, 0))
        expected_utc = expected_local.astimezone(pytz.UTC)
        assert result == expected_utc
        assert task.next_scheduled_at == expected_utc

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_advance_to_next_schedule_weekly(
        self,
        mock_save,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test advance_to_next_schedule with weekly interval"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_WEEKLY,
            interval_count=1,
            next_scheduled_at=start_at,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 UTC one week later
        expected = pytz.UTC.localize(datetime(2026, 1, 22, 0, 5, 0))
        assert result == expected

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_advance_to_next_schedule_monthly(
        self,
        mock_save,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test advance_to_next_schedule with monthly interval"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_MONTHLY,
            interval_count=1,
            next_scheduled_at=start_at,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 UTC one month later
        expected = pytz.UTC.localize(datetime(2026, 2, 15, 0, 5, 0))
        assert result == expected

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_advance_to_next_schedule_every_2_days(
        self,
        mock_save,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test advance_to_next_schedule with interval_count > 1"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=2,
            next_scheduled_at=start_at,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 UTC two days later
        expected = pytz.UTC.localize(datetime(2026, 1, 17, 0, 5, 0))
        assert result == expected


@pytest.mark.unit
class TestTimezoneChangeSelfHealing:
    """Test cases for timezone change self-healing behavior"""

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_timezone_change_self_healing(
        self,
        mock_save,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """
        Test that when project timezone changes, the next execution
        self-heals to 00:05 in the new timezone.

        Scenario:
        1. Task created in UTC, scheduled at 00:05 UTC
        2. Project timezone changed to IST (UTC+5:30)
        3. First advance_to_next_schedule called (with old 00:05 UTC)
        4. Result should be 00:05 IST (which is 18:35 UTC previous day)
        """
        # Arrange - task originally created with UTC timezone
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=1,
            next_scheduled_at=start_at,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Simulate timezone change: update project timezone to IST
        project_utc.timezone = "Asia/Kolkata"
        project_utc.save()

        # Act - advance to next schedule (should use new IST timezone)
        result = task.advance_to_next_schedule()

        # Assert - the next execution should be at 00:05 IST on Jan 16
        # 00:05 IST = 18:35 UTC (previous day)
        ist = pytz.timezone("Asia/Kolkata")
        expected_local = ist.localize(datetime(2026, 1, 16, 0, 5, 0))
        expected_utc = expected_local.astimezone(pytz.UTC)

        assert result == expected_utc
        assert task.next_scheduled_at == expected_utc

    @pytest.mark.django_db
    @patch.object(RecurringWorkitemTask, "save")
    def test_timezone_change_pst_to_utc(
        self,
        mock_save,
        project_pst,
        workitem_template_utc,
        create_user,
    ):
        """Test timezone change from PST to UTC"""
        # Arrange - task created with PST timezone (UTC-8)
        pst = pytz.timezone("America/Los_Angeles")
        start_at_local = pst.localize(datetime(2026, 1, 15, 0, 5, 0))
        start_at_utc = start_at_local.astimezone(pytz.UTC)

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_pst,
            workspace=project_pst.workspace,
            start_at=start_at_utc,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=1,
            next_scheduled_at=start_at_utc,
            created_by=create_user,
        )
        task.id = uuid4()
        task._state.adding = False

        # Simulate timezone change: update project timezone to UTC
        project_pst.timezone = "UTC"
        project_pst.save()

        # Act
        result = task.advance_to_next_schedule()

        # Assert - should be 00:05 UTC on the next day
        # The current time in UTC would be 08:05 on Jan 15, so next is 00:05 UTC Jan 16
        expected = pytz.UTC.localize(datetime(2026, 1, 16, 0, 5, 0))
        assert result == expected


@pytest.mark.unit
class TestSerializerConvertDateToProjectTz:
    """Test cases for serializer _convert_date_to_project_tz method"""

    @pytest.mark.django_db
    def test_convert_date_to_project_tz_uses_0005(self, project_utc, workspace, create_user):
        """Test that _convert_date_to_project_tz uses 00:05 for start_of_day"""
        from plane.ee.serializers.app.recurring_work_item import RecurringWorkItemSerializer

        # Arrange
        serializer = RecurringWorkItemSerializer(context={"project_id": project_utc.id})
        input_date = datetime(2026, 1, 15)

        # Act
        result = serializer._convert_date_to_project_tz(input_date, project_utc.id, start_of_day=True)

        # Assert - should be 00:05:00 UTC
        assert result.hour == 0
        assert result.minute == 5
        assert result.second == 0
        assert result.tzinfo == pytz.UTC

    @pytest.mark.django_db
    def test_convert_date_to_project_tz_end_of_day(self, project_utc, workspace, create_user):
        """Test that _convert_date_to_project_tz uses 23:59:59 for end_of_day"""
        from plane.ee.serializers.app.recurring_work_item import RecurringWorkItemSerializer

        # Arrange
        serializer = RecurringWorkItemSerializer(context={"project_id": project_utc.id})
        input_date = datetime(2026, 1, 15)

        # Act
        result = serializer._convert_date_to_project_tz(input_date, project_utc.id, start_of_day=False)

        # Assert - should be 23:59:59 UTC
        assert result.hour == 23
        assert result.minute == 59
        assert result.second == 59

    @pytest.mark.django_db
    def test_convert_date_to_project_tz_ist_timezone(self, project_ist, workspace, create_user):
        """Test conversion with IST timezone uses 00:05 IST converted to UTC"""
        from plane.ee.serializers.app.recurring_work_item import RecurringWorkItemSerializer

        # Arrange
        serializer = RecurringWorkItemSerializer(context={"project_id": project_ist.id})
        input_date = datetime(2026, 1, 15)

        # Act
        result = serializer._convert_date_to_project_tz(input_date, project_ist.id, start_of_day=True)

        # Assert - 00:05 IST = 18:35 UTC (previous day)
        # IST is UTC+5:30, so 00:05 IST on Jan 15 = 18:35 UTC on Jan 14
        expected = pytz.UTC.localize(datetime(2026, 1, 14, 18, 35, 0))
        assert result == expected


@pytest.mark.unit
class TestScheduleDescription:
    """Test cases for schedule_description property"""

    @pytest.mark.django_db
    def test_schedule_description_daily_shows_0005(
        self,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that schedule_description shows 00:05 for daily tasks"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=1,
            created_by=create_user,
        )

        # Act
        description = task.schedule_description

        # Assert
        assert "00:05" in description
        assert "Every day at 00:05" == description

    @pytest.mark.django_db
    def test_schedule_description_every_2_days_shows_0005(
        self,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that schedule_description shows 00:05 for multi-day intervals"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_DAILY,
            interval_count=3,
            created_by=create_user,
        )

        # Act
        description = task.schedule_description

        # Assert
        assert "00:05" in description
        assert "Every 3 days at 00:05" == description

    @pytest.mark.django_db
    def test_schedule_description_weekly_shows_0005(
        self,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that schedule_description shows 00:05 for weekly tasks"""
        # Arrange - Jan 15, 2026 is a Thursday
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_WEEKLY,
            interval_count=1,
            created_by=create_user,
        )

        # Act
        description = task.schedule_description

        # Assert
        assert "00:05" in description
        assert "Thursday" in description
        assert "Every week on Thursday at 00:05" == description

    @pytest.mark.django_db
    def test_schedule_description_monthly_shows_0005(
        self,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that schedule_description shows 00:05 for monthly tasks"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_MONTHLY,
            interval_count=1,
            created_by=create_user,
        )

        # Act
        description = task.schedule_description

        # Assert
        assert "00:05" in description
        assert "Every month on day 15 at 00:05" == description

    @pytest.mark.django_db
    def test_schedule_description_yearly_shows_0005(
        self,
        project_utc,
        workitem_template_utc,
        create_user,
    ):
        """Test that schedule_description shows 00:05 for yearly tasks"""
        # Arrange
        start_at = pytz.UTC.localize(datetime(2026, 1, 15, 0, 5, 0))

        task = RecurringWorkitemTask(
            workitem_blueprint=workitem_template_utc,
            project=project_utc,
            workspace=project_utc.workspace,
            start_at=start_at,
            interval_type=RecurringWorkitemTask.INTERVAL_YEARLY,
            interval_count=1,
            created_by=create_user,
        )

        # Act
        description = task.schedule_description

        # Assert
        assert "00:05" in description
        assert "Every year on January 15 at 00:05" == description
