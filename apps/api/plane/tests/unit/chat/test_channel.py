# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Database constraints on public and private channels."""

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.chat.models import Channel, ChannelKind
from plane.tests.factories import WorkspaceFactory


def _channel(workspace, **kwargs):
    kwargs.setdefault("kind", ChannelKind.PUBLIC)
    return Channel.objects.create(workspace=workspace, **kwargs)


@pytest.mark.unit
@pytest.mark.django_db
class TestChannelConstraints:
    @pytest.mark.parametrize("kind", [ChannelKind.PUBLIC, ChannelKind.PRIVATE])
    @pytest.mark.parametrize("name", ["", "   "])
    def test_named_channel_requires_a_name(self, workspace, kind, name):
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, kind=kind, name=name)

    def test_named_channel_cannot_have_a_dm_key(self, workspace):
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, name="general", dm_key="a:b")

    @pytest.mark.parametrize("kind", [ChannelKind.DM, ChannelKind.GROUP_DM])
    def test_direct_channel_requires_a_dm_key_and_no_name(self, workspace, kind):
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, kind=kind)
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, kind=kind, name="chat", dm_key="a:b")

    def test_names_are_unique_per_workspace_ignoring_case(self, workspace):
        _channel(workspace, name="General")
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, kind=ChannelKind.PRIVATE, name="general")

    def test_same_name_is_allowed_in_another_workspace(self, workspace):
        _channel(workspace, name="general")
        assert _channel(WorkspaceFactory(), name="general").pk

    def test_archived_channel_keeps_its_name(self, workspace):
        _channel(workspace, name="general", archived_at=timezone.now())
        with pytest.raises(IntegrityError), transaction.atomic():
            _channel(workspace, name="general")

    def test_soft_deleted_channel_frees_its_name(self, workspace):
        _channel(workspace, name="general").delete()
        assert _channel(workspace, name="general").pk
