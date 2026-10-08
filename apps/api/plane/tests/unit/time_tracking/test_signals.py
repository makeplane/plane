# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.utils import timezone

from plane.db.models import ProjectMember, WorkspaceMember
from plane.tests.factories_time_tracking import TimeEntryFactory


def running(world, user, project=None):
    return TimeEntryFactory.running(project=project or world.web, user=user, started_ago=timedelta(minutes=30))


def is_running(entry):
    entry.refresh_from_db()
    return entry.ended_at is None


@pytest.mark.unit
class TestLifecycleSignals:
    def test_project_member_removed_stops_their_timer_in_that_project(self, world):
        bens = running(world, world.ben)
        pias = running(world, world.pia)
        member = ProjectMember.objects.get(project=world.web, member=world.ben)
        member.is_active = False
        member.save()
        assert not is_running(bens)
        assert bens.auto_stopped is True
        assert is_running(pias)

    def test_project_member_removed_elsewhere_leaves_the_timer(self, world):
        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.ben, role=15)
        bens = running(world, world.ben)  # running in WEB
        member = ProjectMember.objects.get(project=world.sec, member=world.ben)
        member.is_active = False
        member.save()
        assert is_running(bens)

    def test_workspace_member_removed_stops_their_timer(self, world):
        bens = running(world, world.ben)
        pias = running(world, world.pia)
        # workspace removal bulk-updates project memberships (no signal), then saves the workspace member
        ProjectMember.objects.filter(member=world.ben).update(is_active=False)
        member = WorkspaceMember.objects.get(workspace=world.workspace, member=world.ben)
        member.is_active = False
        member.save()
        assert not is_running(bens)
        assert is_running(pias)

    def test_project_archived_stops_all_its_timers(self, world):
        bens = running(world, world.ben)
        pias = running(world, world.pia)
        anas = running(world, world.ana, project=world.sec)
        world.web.archived_at = timezone.now()
        world.web.save()
        assert not is_running(bens) and not is_running(pias)
        assert is_running(anas)

    def test_ordinary_saves_do_nothing(self, world):
        bens = running(world, world.ben)
        world.web.name = "Renamed"
        world.web.save()
        member = ProjectMember.objects.get(project=world.web, member=world.ben)
        member.role = 20
        member.save()
        assert is_running(bens)
