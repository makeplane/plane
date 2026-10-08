# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.tests.factories_time_tracking import TimeEntryFactory
from plane.time_tracking.models import TimeEntry


@pytest.mark.unit
class TestTimeEntryConstraints:
    def test_two_running_timers_for_one_user_fail(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben)
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory.running(project=world.web, user=world.ben)

    def test_running_timers_for_different_users_are_fine(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben)
        TimeEntryFactory.running(project=world.web, user=world.pia)
        assert TimeEntry.objects.filter(ended_at__isnull=True, started_at__isnull=False).count() == 2

    def test_soft_deleted_running_timer_does_not_block_a_new_one(self, world):
        old = TimeEntryFactory.running(project=world.web, user=world.ben)
        old.deleted_at = timezone.now()
        old.save(disable_auto_set_user=True)
        TimeEntryFactory.running(project=world.web, user=world.ben)

    def test_running_entry_with_a_duration_fails(self, world):
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory(
                project=world.web,
                user=world.ben,
                started_at=timezone.now() - timedelta(minutes=5),
                duration_seconds=300,
            )

    def test_completed_entry_without_duration_fails(self, world):
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory(project=world.web, user=world.ben, duration_seconds=None)

    def test_end_before_start_fails(self, world):
        now = timezone.now()
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory(
                project=world.web,
                user=world.ben,
                started_at=now,
                ended_at=now - timedelta(minutes=1),
                duration_seconds=60,
            )

    def test_end_without_start_fails(self, world):
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory(project=world.web, user=world.ben, ended_at=timezone.now(), duration_seconds=60)

    @pytest.mark.parametrize("seconds", [0, 86_401])
    def test_duration_out_of_range_fails(self, world, seconds):
        with pytest.raises(IntegrityError), transaction.atomic():
            TimeEntryFactory(project=world.web, user=world.ben, duration_seconds=seconds)

    def test_workspace_follows_the_project(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        assert entry.workspace_id == world.workspace.id
