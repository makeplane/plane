# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit regression tests for StateViewSet.partial_update role requirements.

Creating, deleting and defaulting a state are admin-only, but updating one was open to
members and guests, so a guest could rename a state or move it to another group and skew
every cycle metric that reads the group.
See: https://github.com/makeplane/plane/issues/9364
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.app.permissions import ROLE
from plane.app.views.state.base import StateViewSet


@pytest.mark.unit
class TestStatePartialUpdatePermissions:
    @pytest.fixture(autouse=True)
    def setup_view(self):
        self.factory = APIRequestFactory()
        self.view = StateViewSet()
        self.slug = "test-workspace"
        self.project_id = str(uuid.uuid4())
        self.state_id = str(uuid.uuid4())

    def _call_as(self, role):
        """Run partial_update for a project member holding `role`."""
        wsgi_request = self.factory.patch("/api/test/", data={"name": "Renamed"}, format="json")
        request = Request(wsgi_request, parsers=[JSONParser()])
        request.user = MagicMock()

        def project_member_filter(**kwargs):
            queryset = MagicMock()
            allowed = kwargs.get("role__in")
            # No role filter means "is this user in the project at all", which they are.
            queryset.exists.return_value = True if allowed is None else role.value in allowed
            return queryset

        def workspace_member_filter(**kwargs):
            queryset = MagicMock()
            queryset.exists.return_value = False
            return queryset

        with (
            patch("plane.app.permissions.base.ProjectMember.objects.filter", side_effect=project_member_filter),
            patch("plane.app.permissions.base.WorkspaceMember.objects.filter", side_effect=workspace_member_filter),
            patch("plane.app.views.state.base.State.objects.get", return_value=MagicMock()),
            patch("plane.app.views.state.base.StateSerializer") as serializer_cls,
        ):
            serializer_cls.return_value.is_valid.return_value = True
            serializer_cls.return_value.data = {}
            return self.view.partial_update(request, slug=self.slug, project_id=self.project_id, pk=self.state_id)

    @pytest.mark.parametrize("role", [ROLE.GUEST, ROLE.MEMBER])
    def test_non_admins_cannot_update_a_state(self, role):
        assert self._call_as(role).status_code == status.HTTP_403_FORBIDDEN

    def test_admins_can_still_update_a_state(self):
        assert self._call_as(ROLE.ADMIN).status_code == status.HTTP_200_OK
