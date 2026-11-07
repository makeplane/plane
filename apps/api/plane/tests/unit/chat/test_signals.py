# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A guest's DM grant ends when they stop being an active guest."""

import pytest

from plane.chat.models import ChatGuestPermission
from plane.db.models import WorkspaceMember
from plane.tests.factories import WorkspaceFactory

GUEST, MEMBER = 5, 15


@pytest.fixture
def guest_membership(workspace, make_member):
    user = make_member(role=GUEST)
    ChatGuestPermission.objects.create(workspace=workspace, user=user, can_open_dms=True)
    return WorkspaceMember.objects.get(workspace=workspace, member=user)


def _granted(membership):
    return ChatGuestPermission.objects.filter(
        workspace_id=membership.workspace_id, user_id=membership.member_id, can_open_dms=True
    ).exists()


@pytest.mark.unit
@pytest.mark.django_db
class TestRevokeGuestGrants:
    def test_promotion_revokes_and_demotion_does_not_restore(self, guest_membership):
        guest_membership.role = MEMBER
        guest_membership.save(update_fields=["role", "updated_at"])
        assert not _granted(guest_membership)
        guest_membership.role = GUEST
        guest_membership.save()
        assert not _granted(guest_membership)

    def test_deactivation_revokes(self, guest_membership):
        guest_membership.is_active = False
        guest_membership.save()
        assert not _granted(guest_membership)

    def test_removal_revokes(self, guest_membership):
        guest_membership.delete()
        assert not _granted(guest_membership)

    def test_other_saves_keep_the_grant(self, guest_membership):
        guest_membership.view_props = {"x": 1}
        guest_membership.save(update_fields=["view_props"])
        guest_membership.save()
        assert _granted(guest_membership)

    def test_only_that_workspace(self, guest_membership, make_member):
        elsewhere = WorkspaceFactory()
        WorkspaceMember.objects.create(workspace=elsewhere, member=guest_membership.member, role=MEMBER)
        assert _granted(guest_membership)
