# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The permission matrix from plan 6.1, against TimeTrackingAccess."""

import pytest
from django.utils import timezone

from plane.db.models import ProjectMember
from plane.tests.factories_time_tracking import TimeEntryFactory
from plane.time_tracking.access import TimeTrackingAccess


def access(world, user):
    return TimeTrackingAccess(user, world.slug)


@pytest.mark.unit
class TestView:
    @pytest.mark.parametrize(
        "who,expected", [("ana", True), ("pia", True), ("ben", True), ("cal", True), ("gil", False)]
    )
    def test_can_view(self, world, who, expected):
        assert access(world, getattr(world, who)).can_view() is expected

    def test_non_member_of_the_workspace_cannot_view(self, world, create_user):
        assert access(world, create_user).can_view() is False

    def test_unknown_workspace_cannot_view(self, world):
        assert TimeTrackingAccess(world.ana, "nope").can_view() is False

    def test_visible_entries(self, world):
        web = TimeEntryFactory(project=world.web, user=world.ben)
        sec = TimeEntryFactory(project=world.sec, user=world.ana)

        def visible(user):
            return set(access(world, user).visible_entries().values_list("id", flat=True))

        assert visible(world.ana) == {web.id, sec.id}  # workspace admin sees everything
        assert visible(world.ben) == {web.id}  # member, secret project hidden (A2)
        assert visible(world.cal) == {web.id}  # not in WEB, but WEB is public
        assert visible(world.gil) == set()  # guests see nothing (A1)

    def test_secret_project_member_sees_its_entries(self, world):
        sec = TimeEntryFactory(project=world.sec, user=world.ana)
        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.cal, role=5)
        assert sec.id in set(access(world, world.cal).visible_entries().values_list("id", flat=True))

    def test_deleted_project_entries_are_hidden(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        world.web.deleted_at = timezone.now()
        world.web.save()
        assert not access(world, world.ana).visible_entries().filter(id=entry.id).exists()


@pytest.mark.unit
class TestLog:
    @pytest.mark.parametrize(
        "who,expected", [("ana", True), ("pia", True), ("ben", True), ("cal", False), ("gil", False)]
    )
    def test_can_log_own(self, world, who, expected):
        assert access(world, getattr(world, who)).can_log_own(world.web) is expected

    def test_workspace_admin_must_be_in_the_project_to_log_own_time(self, world):
        ProjectMember.objects.filter(project=world.web, member=world.ana).update(is_active=False)
        assert access(world, world.ana).can_log_own(world.web) is False

    def test_archived_project_is_not_loggable(self, world):
        world.web.archived_at = timezone.now()
        assert access(world, world.ben).can_log_own(world.web) is False

    @pytest.mark.parametrize(
        "who,expected", [("ana", True), ("pia", True), ("ben", False), ("cal", False), ("gil", False)]
    )
    def test_can_log_for_a_member(self, world, who, expected):
        assert access(world, getattr(world, who)).can_log_for(world.web, world.ben.id) is expected

    def test_cannot_log_for_a_guest_or_non_member(self, world):
        assert access(world, world.ana).can_log_for(world.web, world.gil.id) is False
        assert access(world, world.ana).can_log_for(world.web, world.cal.id) is False

    def test_workspace_admin_can_log_for_others_in_any_project(self, world):
        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.ben, role=15)
        ProjectMember.objects.filter(project=world.sec, member=world.ana).update(is_active=False)
        assert access(world, world.ana).can_log_for(world.sec, world.ben.id) is True

    def test_project_admin_cannot_log_for_others_elsewhere(self, world):
        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.ben, role=15)
        assert access(world, world.pia).can_log_for(world.sec, world.ben.id) is False


@pytest.mark.unit
class TestEdit:
    def test_matrix(self, world):
        bens = TimeEntryFactory(project=world.web, user=world.ben)
        pias = TimeEntryFactory(project=world.web, user=world.pia)
        secs = TimeEntryFactory(project=world.sec, user=world.ana)

        def can(user, entry):
            return access(world, user).can_edit(entry)

        # own entries
        assert can(world.ben, bens) is True
        assert can(world.pia, pias) is True
        # others' entries: project admin and workspace admin only
        assert can(world.ben, pias) is False
        assert can(world.pia, bens) is True
        assert can(world.ana, bens) is True
        assert can(world.cal, bens) is False
        assert can(world.gil, bens) is False
        # secret project: only its admins / workspace admins
        assert can(world.ana, secs) is True
        assert can(world.pia, secs) is False

    def test_removed_member_cannot_edit_own_history_but_admin_can(self, world):
        bens = TimeEntryFactory(project=world.web, user=world.ben)
        ProjectMember.objects.filter(project=world.web, member=world.ben).update(is_active=False)
        assert access(world, world.ben).can_edit(bens) is False
        assert access(world, world.pia).can_edit(bens) is True

    @pytest.mark.parametrize(
        "who,expected", [("ana", True), ("pia", True), ("ben", False), ("cal", False), ("gil", False)]
    )
    def test_can_manage_settings(self, world, who, expected):
        assert access(world, getattr(world, who)).can_manage_settings(world.web) is expected


@pytest.mark.unit
def test_role_lookups_are_cached(world, django_assert_max_num_queries):
    a = access(world, world.ben)
    with django_assert_max_num_queries(2):
        a.can_view()
        a.can_log_own(world.web)
        a.is_project_admin(world.web.id)
        a.visible_entries()
        a.can_view_project(world.sec)
