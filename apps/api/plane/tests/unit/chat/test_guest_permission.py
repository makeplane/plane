# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""One chat grant row per guest per workspace."""

import pytest
from django.db import IntegrityError, transaction

from plane.chat.models import ChatGuestPermission
from plane.tests.factories import WorkspaceFactory


@pytest.mark.unit
@pytest.mark.django_db
class TestChatGuestPermission:
    def test_defaults_to_no_dm_access(self, workspace, make_member):
        grant = ChatGuestPermission.objects.create(workspace=workspace, user=make_member(role=5))
        assert grant.can_open_dms is False

    def test_one_row_per_guest_per_workspace(self, workspace, make_member):
        guest = make_member(role=5)
        ChatGuestPermission.objects.create(workspace=workspace, user=guest)
        with pytest.raises(IntegrityError), transaction.atomic():
            ChatGuestPermission.objects.create(workspace=workspace, user=guest)
        # The same person can have a separate grant in another workspace.
        ChatGuestPermission.objects.create(workspace=WorkspaceFactory(), user=guest)
        assert ChatGuestPermission.objects.filter(user=guest).count() == 2
