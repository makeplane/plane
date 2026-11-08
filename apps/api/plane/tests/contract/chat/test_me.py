# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""me/: the caller's chat abilities in this workspace."""

import pytest
from rest_framework.test import APIClient

from plane.chat.models import ChatGuestPermission

from .conftest import ADMIN, GUEST, MEMBER


@pytest.mark.contract
@pytest.mark.django_db
class TestMe:
    def test_admin_and_member(self, admin, member, url):
        assert admin.client.get(url("me/")).data == {
            "workspace_role": ADMIN,
            "is_workspace_admin": True,
            "can_create_channels": True,
            "can_open_dms": True,
        }
        assert member.client.get(url("me/")).data == {
            "workspace_role": MEMBER,
            "is_workspace_admin": False,
            "can_create_channels": True,
            "can_open_dms": True,
        }

    def test_guest_follows_their_grant(self, admin, guest, url):
        res = guest.client.get(url("me/"))
        assert res.status_code == 200
        assert res.data == {
            "workspace_role": GUEST,
            "is_workspace_admin": False,
            "can_create_channels": False,
            "can_open_dms": False,
        }
        admin.client.put(url(f"guests/{guest.user.id}/dm-access/"))
        assert guest.client.get(url("me/")).data["can_open_dms"] is True

    def test_a_grant_elsewhere_does_not_count(self, guest, other_workspace, url):
        ChatGuestPermission.objects.create(workspace=other_workspace, user=guest.user, can_open_dms=True)
        assert guest.client.get(url("me/")).data["can_open_dms"] is False

    def test_outsider_and_anonymous_are_refused(self, outsider, other_workspace, url):
        assert outsider.client.get(url("me/")).status_code == 403
        assert APIClient().get(url("me/")).status_code in (401, 403)
        # In their own workspace they get their own answer.
        assert outsider.client.get(url("me/", slug=other_workspace.slug)).data["workspace_role"] == ADMIN
